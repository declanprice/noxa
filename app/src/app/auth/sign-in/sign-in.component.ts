import { Component, OnInit } from '@angular/core';
import { signUp } from 'supertokens-web-js/recipe/emailpassword';

@Component({
    selector: 'app-sign-in',
    standalone: true,
    imports: [],
    templateUrl: './sign-in.component.html',
    styleUrl: './sign-in.component.scss',
})
export class SignInComponent implements OnInit {
    async ngOnInit() {
        // let response = await signUp({
        //     formFields: [
        //         {
        //             id: 'email',
        //             value: 'declanprice1@gmail.com',
        //         },
        //         {
        //             id: 'password',
        //             value: 'password123',
        //         },
        //     ],
        // });
        //
        // console.log('response', response);
    }
}
