import {
    APP_INITIALIZER,
    ApplicationConfig,
    importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { AuthService } from '@/auth/auth.service';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { Apollo, APOLLO_OPTIONS, ApolloModule } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client/core';

export const appConfig: ApplicationConfig = {
    providers: [
        AuthService,
        Apollo,
        {
            provide: APP_INITIALIZER,
            useFactory: (auth: AuthService) => {
                return async () => {
                    await auth.init();
                };
            },
            deps: [AuthService],
            multi: true,
        },
        {
            provide: APOLLO_OPTIONS,
            useFactory(httpLink: HttpLink) {
                return {
                    cache: new InMemoryCache(),
                    link: httpLink.create({
                        uri: 'http://localhost:3000/graphql',
                    }),
                };
            },
            deps: [HttpLink],
        },
        provideRouter(routes),
        provideAnimations(),
        provideHttpClient(),
    ],
};
