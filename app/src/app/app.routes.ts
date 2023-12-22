import { Routes } from '@angular/router';

import { LayoutComponent } from '@/layout/layout.component';
import { authGuard } from '@/auth/auth.guard';
import { noAuthGuard } from '@/auth/no-auth.guard';
import { ShopNavComponent } from '@/shop/shop-nav/shop-nav.component';
import { AdminNavComponent } from '@/admin/admin-nav/admin-nav.component';
import { adminAuthGuard } from '@/auth/admin-auth.guard';

export const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'auth',
                loadChildren: () =>
                    import('./auth/auth.routes').then((m) => m.AUTH_ROUTES),
                canActivate: [noAuthGuard],
            },
            {
                path: '',
                component: LayoutComponent,
                children: [
                    {
                        path: 'admin',
                        canActivate: [adminAuthGuard],
                        children: [
                            {
                                path: '',
                                component: AdminNavComponent,
                                outlet: 'nav',
                            },
                            {
                                path: '',
                                loadChildren: () =>
                                    import('@/admin/admin.routes').then(
                                        (m) => m.ADMIN_ROUTES,
                                    ),
                                outlet: 'content',
                            },
                        ],
                    },
                    {
                        path: 'shop',
                        canActivate: [authGuard],
                        children: [
                            {
                                path: '',
                                component: ShopNavComponent,
                                outlet: 'nav',
                            },
                            {
                                path: '',
                                loadChildren: () =>
                                    import('@/shop/shop.routes').then(
                                        (m) => m.SHOP_ROUTES,
                                    ),
                                outlet: 'content',
                            },
                        ],
                    },
                    {
                        path: '**',
                        redirectTo: 'shop',
                    },
                ],
            },
        ],
    },
];
