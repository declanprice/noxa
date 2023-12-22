import { Routes } from '@angular/router';
import { authGuard } from '@/auth/auth.guard';

export const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'auth',
                loadChildren: () =>
                    import('./auth/auth.routes').then((m) => m.AUTH_ROUTES),
            },
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
];
