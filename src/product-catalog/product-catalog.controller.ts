import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '../../lib';
import { AddProductToCatalog } from './api/commands/add-product-to-catalog.command';
import { RemoveProductFromCatalog } from './api/commands/remove-product-from-catalog.command';
import { GetProductById } from './api/queries/get-product-by-id.query';
import { GetAllProducts } from './api/queries/get-all-products.query';

@Controller('/products')
export class ProductCatalogController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    add(@Body() dto: AddProductToCatalog) {
        return this.commandBus.invoke(
            new AddProductToCatalog(
                dto.name,
                dto.description,
                dto.category,
                dto.photoUrl,
            ),
        );
    }

    @Delete('/:id')
    remove(@Param('id') id: string) {
        return this.commandBus.invoke(new RemoveProductFromCatalog(id));
    }

    @Get('/')
    getAll() {
        return this.queryBus.invoke(new GetAllProducts());
    }

    @Get('/:id')
    getById(@Param('id') id: string) {
        return this.queryBus.invoke(new GetProductById(id));
    }
}
