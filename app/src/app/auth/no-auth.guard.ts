import { inject } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateFn,
    Router,
} from '@angular/router';
import Session from 'supertokens-web-js/recipe/session';
import { AuthService } from '@/auth/auth.service';

export const noAuthGuard: CanActivateFn = async (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isSignedIn()) {
        router.navigate(['/catalog']).then();
        return false;
    }

    return true;
};
