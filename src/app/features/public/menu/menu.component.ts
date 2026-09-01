import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-menu',
  imports: [RouterLink],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  /* =========================================
     FILTERS
  ========================================== */

  selectedCategory = signal('All');

  searchTerm = signal('');

  orderType = signal<'dine-in' | 'takeout'>('dine-in');

  /* =========================================
     CART
  ========================================== */

  cartCount = signal(0);

  /* =========================================
     CATEGORIES
  ========================================== */

  categories = ['All', 'Silog', 'Rice Meals', 'Drinks', 'Add-ons'];

  /* =========================================
     MENU ITEMS
  ========================================== */
  products: Product[] = [
    {
      id: 1,
      name: 'Tapsilog',
      description: 'Beef tapa, garlic rice and egg.',
      price: 160,
      category: 'Silog',
      image:
        'https://tse1.mm.bing.net/th/id/OIP.7IfH8UH_TFwaNeKJ_mDDgwHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
      popular: true,
      available: true,
    },

    {
      id: 2,
      name: 'Tocilog',
      description: 'Sweet pork tocino with rice and egg.',
      price: 150,
      category: 'Silog',
      image:
        'https://wfg32p.s3.amazonaws.com/media/dishes/tocilog_9142-med.png',
      available: true,
    },

    {
      id: 3,
      name: 'Longsilog',
      description: 'Sweet pork longganisa with rice and egg.',
      price: 150,
      category: 'Silog',
      image:
        'https://131500952.cdn6.editmysite.com/uploads/1/3/1/5/131500952/HP4PV6WHBSCOXPSFIIFA7TDZ.jpeg',
      popular: true,
      available: true,
    },

    {
      id: 4,
      name: 'Bangsilog',
      description: 'Bangus, garlic rice and egg.',
      price: 170,
      category: 'Silog',
      image:
        'https://tse4.mm.bing.net/th/id/OIP.iROipFlj6rR5QAPfD0hTEgHaHX?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
      available: false,
    },

    {
      id: 5,
      name: 'Chicksilog',
      description: 'Crispy chicken with garlic rice and fried egg.',
      price: 119,
      category: 'Silog',
      image:
        'https://filipinochow.com/wp-content/uploads/2020/05/Longsilog-Sausage-with-Garlic-Rice-and-Fried-Egg.jpg',
      available: true,
    },

    {
      id: 6,
      name: 'Pancakes',
      description: 'Fluffy pancakes served with syrup.',
      price: 120,
      category: 'Breakfast',
      image:
        'https://framerusercontent.com/images/yhJhJPkumvAzK7JUURDujhs5hus.jpg?height=6932&width=4621',
      available: true,
    },

    {
      id: 7,
      name: 'Garlic Longganisa',
      description: 'Savory garlic longganisa with egg.',
      price: 145,
      category: 'Breakfast',
      image:
        'https://filipinochow.com/wp-content/uploads/2020/05/Longsilog-Sausage-with-Garlic-Rice-and-Fried-Egg.jpg',
      available: true,
    },

    {
      id: 8,
      name: 'Iced Coffee',
      description: 'Cold brewed coffee with creamy milk.',
      price: 85,
      category: 'Drinks',
      image:
        'https://snapcalorie-webflow-website.s3.us-east-2.amazonaws.com/media/food_pics_v2/medium/jollibee_iced_coffee.jpg',
      popular: true,
      available: true,
    },

    {
      id: 9,
      name: 'Calamansi Juice',
      description: 'Freshly squeezed calamansi juice.',
      price: 65,
      category: 'Drinks',
      image:
        'https://i.pinimg.com/originals/72/3b/9f/723b9f33c6bc7c68ee7a99ab084e97a2.jpg',
      available: true,
    },

    {
      id: 10,
      name: 'Extra Egg',
      description: 'Sunny-side-up egg.',
      price: 25,
      category: 'Add-ons',
      image:
        'https://d1w7312wesee68.cloudfront.net/kHoRA1fgTL6E9-LZolFwwsn5pWl9wrWnDcKJZ8JKmes/resize%3Afit%3A720%3A720/plain/s3%3A/toasttab/restaurants/restaurant-4240000000000000/menu/items/3/item-300000010740496413_1775537119.png',
      available: true,
    },

    {
      id: 11,
      name: 'Extra Garlic Rice',
      description: 'Additional serving of garlic rice.',
      price: 35,
      category: 'Add-ons',
      image:
        'https://cdn.apartmenttherapy.info/image/upload/v1621515584/k/Photo/Recipes/05-2021_Garlic_fried_rice_Silog_sinangag/k-photo-2021-05-garlic-fried-rice-01.jpg',
      available: true,
    },
  ];
  /* =========================================
     FILTERED MENU
  ========================================== */

  filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const search = this.searchTerm().trim().toLowerCase();

    return this.products.filter((product) => {
      const matchesCategory =
        category === 'All' || product.category === category;

      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  });

  /* =========================================
     CATEGORY
  ========================================== */

  selectCategory(category: string) {
    this.selectedCategory.set(category);
  }

  /* =========================================
     ORDER TYPE
  ========================================== */

  selectOrderType(type: 'dine-in' | 'takeout') {
    this.orderType.set(type);
  }

  /* =========================================
     CART
  ========================================== */

  addToCart(product: Product) {
    if (!product.available) {
      return;
    }

    this.cartCount.update((count) => count + 1);
  }
}
