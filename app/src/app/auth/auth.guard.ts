import { inject } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanActivateFn,
    Router,
} from '@angular/router';
import Session from 'supertokens-web-js/recipe/session';

export const authGuard: CanActivateFn = async (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
) => {
    const router = inject(Router);

    if (await Session.doesSessionExist()) {
        return true;
    }

    router.navigate(['/auth/sign-in']).then();

    return false;
};
