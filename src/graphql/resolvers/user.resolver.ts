import { Resolver, Args, Query } from '@nestjs/graphql';
import { User } from '../model/user.model';
import { AuthService } from '../../auth/auth.service';

@Resolver((of: any) => User)
export class UserResolver {
    constructor(readonly authService: AuthService) {}

    @Query((returns) => User)
    async user(@Args({ name: 'id', type: () => String }) id: string) {
        return this.authService.getUser(id);
    }
}
