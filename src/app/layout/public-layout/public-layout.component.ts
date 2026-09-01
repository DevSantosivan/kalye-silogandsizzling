import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent {
  mobileMenuOpen = signal(false);

  cartCount = signal(2);

  toggleMenu() {
    this.mobileMenuOpen.update((value) => !value);
  }

  closeMenu() {
    this.mobileMenuOpen.set(false);
  }
}
