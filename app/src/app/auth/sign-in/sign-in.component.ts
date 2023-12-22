import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

import { AuthService } from '@/auth/auth.service';
import { FormErrorPipe } from '@/pipes/form-error.pipe';
import { Router, RouterLink } from '@angular/router';
import { ApolloModule } from 'apollo-angular';

@Component({
    selector: 'app-sign-in',
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatButtonModule,
        FormErrorPipe,
        RouterLink,
    ],
    templateUrl: './sign-in.component.html',
    styleUrl: './sign-in.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent {
    fb = inject(FormBuilder);
    auth = inject(AuthService);
    router = inject(Router);

    signInForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]],
    });

    async signIn(event: SubmitEvent) {
        await this.auth.signIn({
            email: this.signInForm.value.email!,
            password: this.signInForm.value.password!,
        });

        await this.router.navigate(['/catalog']);
    }
}
