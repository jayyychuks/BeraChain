import { Address } from "abitype";
import { Exact, Simplify, ValueOf } from "type-fest";
import { Abi } from "viem";

// Assuming these are your type definitions:
export type TypeChainFactory = {
  abi: Abi;
};

export type TypeChainObj = {
  [K: `${string}__factory`]: TypeChainFactory;
};

export type AbiMapValue = {
  abi: Abi;
  defaultAddress?: string;
};

// Rest of the code:
type TypechainFactoryKeys<T extends TypeChainObj> = Extract<
  keyof T,
  `${string}__factory`
>;

type TypechainContractNames<T extends TypeChainObj> = ValueOf<{
  [K in TypechainFactoryKeys<T>]: K extends `${infer Name}__factory`
    ? Name
    : never;
}>;

type DefaultAddresses<T extends TypeChainObj> = {
  [K in TypechainContractNames<T>]?: Address;
};

export function processTypechainAbis<
  T extends TypeChainObj,
  U extends Exact<DefaultAddresses<T>, U> & Record<string, any>
>(typechainExports: T, defaultAddresses?: U) {
  type ContractNames = TypechainContractNames<T>;

  type TypechainAbiMap = {
    [K in ContractNames]: K extends keyof U
      ? {
          abi: T[`${K}__factory`]["abi"];
          defaultAddress: Address;
        }
      : {
          abi: T[`${K}__factory`]["abi"];
        };
  };

  const abiEntries = Object.entries(typechainExports)
    .filter(([key]) => key.endsWith("__factory"))
    .map<[string, AbiMapValue]>(([key, factory]) => {
      const contractName = key.replace(/__factory$/, "") as ContractNames;

      const value: AbiMapValue = {
        abi: factory.abi,
      };

      if (defaultAddresses && contractName in defaultAddresses) {
        const defaultAddress = defaultAddresses[contractName as keyof U];

        if (typeof defaultAddress === "string") {
          value.defaultAddress = defaultAddress;
        }
      }

      return [contractName, value];
    });

  return Object.fromEntries(abiEntries) as unknown as Simplify<TypechainAbiMap>;
}
