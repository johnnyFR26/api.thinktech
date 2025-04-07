import { Field, Float, ID, ObjectType } from "type-graphql";
import { Account } from "./account-model";
import { TransactionType } from "../enums";

@ObjectType()
export class Transaction {
    @Field(() => ID)
    id: string;

    @Field(() => Float)
    value: number;

    @Field(() => TransactionType)
    type: TransactionType;

    @Field(() => String)
    destination: string;

    @Field(() => String)
    description: string;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Account)
    account: Account;
}