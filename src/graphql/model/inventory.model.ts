import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Inventory {
    @Field((type) => String)
    id: string;

    @Field({ nullable: false })
    quantityAvailable: number;
}
