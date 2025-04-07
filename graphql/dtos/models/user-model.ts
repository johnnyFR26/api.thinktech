import { Field, ID, ObjectType } from "type-graphql";
import { Account } from "./account-model";

@ObjectType()
export class User {
    @Field(() => ID)
    id: number;

    @Field(() => String)
    name: string;

    @Field(() => String)
    email: string;

    @Field(() => String)
    password: string;

    @Field(() => String)
    phone: string;

    @Field(() => String)
    cpf: string;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;

    @Field(() => Account, { nullable: true })
    account?: Account;
}
