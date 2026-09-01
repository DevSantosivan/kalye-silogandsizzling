import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  orderType = signal<'dine-in' | 'takeout'>('dine-in');

  paymentMethod = signal<'gcash' | 'cash'>('gcash');
}
