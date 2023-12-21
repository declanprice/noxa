import { Field, ObjectType } from '@nestjs/graphql';
import { Inventory } from './inventory.model';

@ObjectType()
export class Product {
    @Field((type) => String)
    id: string;

    @Field({ nullable: false })
    name: string;

    @Field((type) => Inventory, { nullable: true })
    inventory?: Inventory;
}
