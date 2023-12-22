import { Pipe, PipeTransform } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Pipe({
    name: 'formError',
    standalone: true,
})
export class FormErrorPipe implements PipeTransform {
    transform(value: FormGroup, ...args: string[]): unknown {
        const path = args[0];

        if (value.hasError('required', path)) {
            return `${path} is required`;
        }

        if (value.hasError('email', path)) {
            return `invalid email`;
        }

        return null;
    }
}
