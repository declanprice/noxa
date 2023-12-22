import { Inject, Injectable } from '@nestjs/common';
import supertokens from 'supertokens-node';
import Session from 'supertokens-node/recipe/session';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Dashboard from 'supertokens-node/recipe/dashboard';
import UserRoles from 'supertokens-node/recipe/userroles';
import { AuthModuleConfig, ConfigInjectionToken } from './auth.config';

@Injectable()
export class AuthService {
    constructor(
        @Inject(ConfigInjectionToken) private config: AuthModuleConfig,
    ) {
        supertokens.init({
            appInfo: config.appInfo,
            supertokens: {
                connectionURI: config.connectionURI,
                apiKey: config.apiKey,
            },
            recipeList: [
                EmailPassword.init(),
                Session.init(),
                Dashboard.init(),
                UserRoles.init(),
            ],
        });
    }

    async getUser(userId: string) {
        return supertokens.getUser(userId);
    }
}
