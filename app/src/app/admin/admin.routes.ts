import { Routes } from '@angular/router';
import { AdminProductsComponent } from '@/admin/products/admin-products/admin-products.component';
import { AdminOrdersComponent } from '@/admin/orders/admin-orders.component';

export const ADMIN_ROUTES: Routes = [
    {
        path: '',
        component: AdminProductsComponent,
    },
    {
        path: 'orders',
        component: AdminOrdersComponent,
    },
];
