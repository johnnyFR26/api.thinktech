import { registerEnumType } from "type-graphql";

export enum TransactionType {
  INPUT = "input",
  OUTPUT = "output",
}

registerEnumType(TransactionType, {
  name: "TransactionType",
  description: "Defines whether the transaction is an input or an output",
});

// Enum Currency
export enum Currency {
  BRL = "BRL",
  USS = "USS",
}

registerEnumType(Currency, {
  name: "Currency",
  description: "Defines the currency type",
});
