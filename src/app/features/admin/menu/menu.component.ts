import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MenuItem {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  sold: number;
  available: boolean;
  image: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  // ==========================================
  // FILTERS
  // ==========================================

  categories = ['All', 'Silog Meals', 'Breakfast', 'Drinks', 'Add-ons'];

  availabilityFilters = ['All', 'Available', 'Unavailable'];

  activeCategory = 'All';
  activeAvailability = 'All';

  searchTerm = '';

  // ==========================================
  // PAGINATION
  // ==========================================

  currentPage = 1;
  pageSize = 8;

  // ==========================================
  // ACTION MENU
  // ==========================================

  openMenuId: number | null = null;

  // ==========================================
  // MENU ITEMS
  // ==========================================

  items: MenuItem[] = [
    {
      id: 1,
      name: 'Tapsilog',
      category: 'Silog Meals',
      description: 'Beef tapa, garlic rice and egg.',
      price: 160,
      sold: 128,
      available: true,
      image:
        'https://tse1.mm.bing.net/th/id/OIP.7IfH8UH_TFwaNeKJ_mDDgwHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
    },

    {
      id: 2,
      name: 'Longsilog',
      category: 'Silog Meals',
      description: 'Sweet pork longganisa with rice and egg.',
      price: 150,
      sold: 96,
      available: true,
      image:
        'https://131500952.cdn6.editmysite.com/uploads/1/3/1/5/131500952/HP4PV6WHBSCOXPSFIIFA7TDZ.jpeg',
    },

    {
      id: 3,
      name: 'Bangsilog',
      category: 'Silog Meals',
      description: 'Bangus, garlic rice and egg.',
      price: 170,
      sold: 82,
      available: true,
      image:
        'https://tse4.mm.bing.net/th/id/OIP.iROipFlj6rR5QAPfD0hTEgHaHX?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
    },

    {
      id: 4,
      name: 'Tocilog',
      category: 'Silog Meals',
      description: 'Sweet pork tocino with rice and egg.',
      price: 150,
      sold: 71,
      available: false,
      image:
        'https://wfg32p.s3.amazonaws.com/media/dishes/tocilog_9142-med.png',
    },

    {
      id: 5,
      name: 'Pancakes',
      category: 'Breakfast',
      description: 'Fluffy pancakes served with syrup.',
      price: 120,
      sold: 64,
      available: true,
      image:
        'https://framerusercontent.com/images/yhJhJPkumvAzK7JUURDujhs5hus.jpg?height=6932&width=4621',
    },

    {
      id: 6,
      name: 'Garlic Longganisa',
      category: 'Breakfast',
      description: 'Savory garlic longganisa with egg.',
      price: 145,
      sold: 58,
      available: true,
      image:
        'https://filipinochow.com/wp-content/uploads/2020/05/Longsilog-Sausage-with-Garlic-Rice-and-Fried-Egg.jpg',
    },

    {
      id: 7,
      name: 'Iced Coffee',
      category: 'Drinks',
      description: 'Cold brewed coffee with creamy milk.',
      price: 85,
      sold: 143,
      available: true,
      image:
        'https://snapcalorie-webflow-website.s3.us-east-2.amazonaws.com/media/food_pics_v2/medium/jollibee_iced_coffee.jpg',
    },

    {
      id: 8,
      name: 'Calamansi Juice',
      category: 'Drinks',
      description: 'Freshly squeezed calamansi juice.',
      price: 65,
      sold: 87,
      available: true,
      image:
        'https://i.pinimg.com/originals/72/3b/9f/723b9f33c6bc7c68ee7a99ab084e97a2.jpg',
    },

    {
      id: 9,
      name: 'Extra Egg',
      category: 'Add-ons',
      description: 'Sunny-side-up egg.',
      price: 25,
      sold: 112,
      available: true,
      image:
        'https://d1w7312wesee68.cloudfront.net/kHoRA1fgTL6E9-LZolFwwsn5pWl9wrWnDcKJZ8JKmes/resize%3Afit%3A720%3A720/plain/s3%3A/toasttab/restaurants/restaurant-4240000000000000/menu/items/3/item-300000010740496413_1775537119.png',
    },

    {
      id: 10,
      name: 'Extra Garlic Rice',
      category: 'Add-ons',
      description: 'Additional serving of garlic rice.',
      price: 35,
      sold: 104,
      available: true,
      image:
        'https://cdn.apartmenttherapy.info/image/upload/v1621515584/k/Photo/Recipes/05-2021_Garlic_fried_rice_Silog_sinangag/k-photo-2021-05-garlic-fried-rice-01.jpg',
    },
  ];

  // ==========================================
  // FILTERED ITEMS
  // ==========================================

  get filteredItems(): MenuItem[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.items.filter((item) => {
      const matchesCategory =
        this.activeCategory === 'All' || item.category === this.activeCategory;

      const matchesAvailability =
        this.activeAvailability === 'All' ||
        (this.activeAvailability === 'Available' && item.available) ||
        (this.activeAvailability === 'Unavailable' && !item.available);

      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search);

      return matchesCategory && matchesAvailability && matchesSearch;
    });
  }

  // ==========================================
  // PAGINATED ITEMS
  // ==========================================

  get paginatedItems(): MenuItem[] {
    const start = (this.currentPage - 1) * this.pageSize;

    const end = start + this.pageSize;

    return this.filteredItems.slice(start, end);
  }

  // ==========================================
  // PAGINATION
  // ==========================================

  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get startItem(): number {
    if (this.filteredItems.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredItems.length,
    );
  }

  // ==========================================
  // CATEGORY
  // ==========================================

  setCategory(category: string): void {
    this.activeCategory = category;
    this.currentPage = 1;
    this.closeActionMenu();
  }

  // ==========================================
  // AVAILABILITY
  // ==========================================

  setAvailability(filter: string): void {
    this.activeAvailability = filter;
    this.currentPage = 1;
    this.closeActionMenu();
  }

  // ==========================================
  // SEARCH
  // ==========================================

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm = input.value;
    this.currentPage = 1;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
  }

  // ==========================================
  // PAGINATION ACTIONS
  // ==========================================

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // ==========================================
  // ACTION MENU
  // ==========================================

  toggleActionMenu(id: number): void {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  closeActionMenu(): void {
    this.openMenuId = null;
  }

  // ==========================================
  // MENU ACTIONS
  // ==========================================

  editItem(item: MenuItem): void {
    this.closeActionMenu();

    console.log('Edit item:', item);

    // Later:
    // open edit modal
  }

  toggleAvailability(item: MenuItem): void {
    item.available = !item.available;

    this.closeActionMenu();
  }

  deleteItem(item: MenuItem): void {
    const confirmed = window.confirm(`Delete "${item.name}" from the menu?`);

    if (!confirmed) {
      return;
    }

    this.items = this.items.filter((menuItem) => menuItem.id !== item.id);

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    this.closeActionMenu();
  }

  // ==========================================
  // ADD ITEM
  // ==========================================

  addMenuItem(): void {
    console.log('Open add menu item modal');

    // Later:
    // open modal
  }

  // ==========================================
  // CURRENCY
  // ==========================================

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  // ==========================================
  // SUMMARY
  // ==========================================

  get totalItems(): number {
    return this.items.length;
  }

  get availableItems(): number {
    return this.items.filter((item) => item.available).length;
  }

  get unavailableItems(): number {
    return this.items.filter((item) => !item.available).length;
  }

  get totalSold(): number {
    return this.items.reduce((total, item) => total + item.sold, 0);
  }
}
