import {
    ChangeDetectionStrategy,
    Component,
    inject,
    signal,
} from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '@/auth/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [
        RouterOutlet,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        MatSidenavModule,
        MatMenuModule,
        NgIf,
        RouterLink,
    ],
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
    auth = inject(AuthService);
    router = inject(Router);

    isSideNavOpened = signal(false);

    toggleSideNav() {
        this.isSideNavOpened.set(!this.isSideNavOpened());
    }

    async signOut() {
        await this.auth.signOut();

        await this.router.navigate(['/auth/sign-in']);
    }
}
