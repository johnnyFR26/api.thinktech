import { Field, ID, ObjectType } from "type-graphql";
import { Transaction } from "./transaction-model";
import { Account } from "./account-model";

@ObjectType()
export class Category {
    @Field(() => ID)
    id: string;

    @Field(() => String)
    name: string;

    @Field(() => Account)
    account: Account;

    @Field(() => [Transaction])
    transactions: Transaction[];
}