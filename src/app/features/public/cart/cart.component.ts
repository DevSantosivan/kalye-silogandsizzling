import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem } from '../../../core/models/cartItem.model';

@Component({
  selector: 'app-cart',
  imports: [RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  orderType = signal<'dine-in' | 'takeout'>('dine-in');

  items = signal<CartItem[]>([
    {
      id: 1,
      name: 'Tapsilog',
      price: 160,
      quantity: 1,
      image:
        'https://tse1.mm.bing.net/th/id/OIP.7IfH8UH_TFwaNeKJ_mDDgwHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
    },

    {
      id: 2,
      name: 'Tocilog',
      price: 150,
      quantity: 1,
      image:
        'https://wfg32p.s3.amazonaws.com/media/dishes/tocilog_9142-med.png',
    },
  ]);

  subtotal = computed(() =>
    this.items().reduce((total, item) => total + item.price * item.quantity, 0),
  );

  increase(id: number) {
    this.items.update((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  }

  decrease(id: number) {
    this.items.update((items) =>
      items
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  setOrderType(type: 'dine-in' | 'takeout') {
    this.orderType.set(type);
  }
}
