import { inject } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateFn,
    Router,
} from '@angular/router';
import Session from 'supertokens-web-js/recipe/session';
import { AuthService } from '@/auth/auth.service';

export const adminAuthGuard: CanActivateFn = async (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isSignedIn() && (await auth.isAdmin())) {
        return true;
    }

    router.navigate(['/shop/catalog']).then();

    return false;
};
