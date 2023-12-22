import { Routes } from '@angular/router';

import { SignInComponent } from '@/auth/sign-in/sign-in.component';
import { SignUpComponent } from '@/auth/sign-up/sign-up.component';

export const AUTH_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'sign-in',
    },
    {
        path: 'sign-in',
        component: SignInComponent,
    },
    {
        path: 'sign-up',
        component: SignUpComponent,
    },
];
