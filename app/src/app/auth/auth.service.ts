import { inject, Injectable, signal } from '@angular/core';
import {
    signIn,
    signUp,
    signOut,
} from 'supertokens-web-js/recipe/emailpassword';
import Session from 'supertokens-web-js/recipe/session';
import UserRoles, { UserRoleClaim } from 'supertokens-web-js/recipe/userroles';
import { Apollo } from 'apollo-angular';
import { GET_USER } from '@/graphql/queries';
import { firstValueFrom } from 'rxjs';
import { getUser } from 'supertokens-node';

type User = {
    id: string;
    emails: string[];
};

@Injectable()
export class AuthService {
    readonly apollo = inject(Apollo);

    readonly user = signal<User | null>(null);

    async init() {
        const doesSessionExist = await Session.doesSessionExist();

        if (doesSessionExist) {
            let userId = await Session.getUserId();

            const user = await this.getUser(userId);

            this.user.set(user);
        }
    }

    async getUser(userId: string): Promise<User | null> {
        const { data } = await firstValueFrom(
            this.apollo.query<{ user: User }>({
                query: GET_USER,
                variables: { userId },
            }),
        );

        if (data === null) {
            return null;
        }

        return data.user;
    }

    isSignedIn() {
        return this.user() !== null;
    }

    async isAdmin() {
        let validationErrors = await Session.validateClaims({
            overrideGlobalClaimValidators: (globalValidators) => [
                ...globalValidators,
                UserRoleClaim.validators.includes('admin'),
            ],
        });

        console.log(validationErrors);

        return validationErrors.length === 0;
    }

    async signIn(data: { email: string; password: string }) {
        const response = await signIn({
            formFields: [
                {
                    id: 'email',
                    value: data.email,
                },
                {
                    id: 'password',
                    value: data.password,
                },
            ],
        });

        if (response.status !== 'OK') {
            throw new Error('failed to sign in');
        }

        this.user.set(response.user);
    }

    async signUp(data: { email: string; password: string }) {
        const response = await signUp({
            formFields: [
                {
                    id: 'email',
                    value: data.email,
                },
                {
                    id: 'password',
                    value: data.password,
                },
            ],
        });

        if (response.status !== 'OK') {
            throw new Error('failed to sign up');
        }

        this.user.set(response.user);
    }

    async signOut() {
        await signOut();
        this.user.set(null);
    }
}
