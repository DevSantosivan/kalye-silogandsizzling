import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FavoriteItem {
  name: string;
  description: string;
  price: number;
  image: string;
  tag: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  favorites: FavoriteItem[] = [
    {
      name: 'Tapsilog',
      description: 'Tender beef tapa, garlic rice and egg.',
      price: 99,
      tag: 'BEST SELLER',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tapsilog.jpg',
    },
    {
      name: 'Tocilog',
      description: 'Sweet tocino, garlic rice and egg.',
      price: 89,
      tag: 'CUSTOMER FAVORITE',
      image:
        'https://www.sliceofculture.com/wp-content/uploads/2024/10/img_4582-2-1.jpg',
    },
    {
      name: 'Longsilog',
      description: 'Classic longganisa, garlic rice and egg.',
      price: 95,
      tag: 'POPULAR',
      image:
        'https://commons.wikimedia.org/wiki/Special:FilePath/Sweet%20Longsilog%20-%201025194119.jpg',
    },
  ];

  get currentYear(): number {
    return new Date().getFullYear();
  }
}
