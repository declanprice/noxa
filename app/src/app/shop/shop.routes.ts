import { Routes } from '@angular/router';
import { CatalogComponent } from '@/shop/catalog/catalog.component';
import { OrdersComponent } from '@/shop/orders/orders/orders.component';

export const SHOP_ROUTES: Routes = [
    {
        path: '',
        component: CatalogComponent,
    },
    {
        path: 'orders',
        component: OrdersComponent,
    },
];
