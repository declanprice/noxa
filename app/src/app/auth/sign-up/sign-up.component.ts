import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormErrorPipe } from '@/pipes/form-error.pipe';
import {
    FormBuilder,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '@/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { ApolloModule } from 'apollo-angular';

@Component({
    selector: 'app-sign-up',
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatButtonModule,
        FormErrorPipe,
        RouterLink,
    ],
    templateUrl: './sign-up.component.html',
    styleUrl: './sign-up.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent {
    fb = inject(FormBuilder);
    auth = inject(AuthService);
    router = inject(Router);

    signUpForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]],
    });

    async signUp(event: SubmitEvent) {
        await this.auth.signUp({
            email: this.signUpForm.value.email!,
            password: this.signUpForm.value.password!,
        });

        await this.router.navigate(['/shop/catalog']);
    }
}
