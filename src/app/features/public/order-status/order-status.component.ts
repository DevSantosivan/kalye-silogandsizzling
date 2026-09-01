import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-order-status',
  imports: [],
  templateUrl: './order-status.component.html',
  styleUrl: './order-status.component.scss',
})
export class OrderStatusComponent {
  orderId = '';

  constructor(private route: ActivatedRoute) {
    this.orderId = this.route.snapshot.paramMap.get('id') ?? 'KS-1029';
  }
}
