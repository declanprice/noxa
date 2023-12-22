import { Routes } from '@angular/router';

import { LayoutComponent } from '@/layout/layout.component';
import { authGuard } from '@/auth/auth.guard';
import { noAuthGuard } from '@/auth/no-auth.guard';

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
                        path: 'catalog',
                        canActivate: [authGuard],
                        loadChildren: () =>
                            import('./catalog/catalog.routes').then(
                                (m) => m.CATALOG_ROUTES,
                            ),
                    },
                    {
                        path: '**',
                        redirectTo: 'catalog',
                    },
                ],
            },
        ],
    },
];
