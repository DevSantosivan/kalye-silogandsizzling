import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface BestSeller {
  rank: number;
  name: string;
  orders: number;
  price: number;
  image: string;
}

interface RecentOrder {
  orderNumber: string;
  customer: string;
  type: 'Dine In' | 'Take Out';
  total: number;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  stats = {
    todaySales: 12450,
    totalOrders: 48,
    averageOrder: 259,
    customers: 42,
  };

  bestSellers: BestSeller[] = [
    {
      rank: 1,
      name: 'Tapsilog',
      orders: 128,
      price: 160,
      image:
        'https://tse1.mm.bing.net/th/id/OIP.7IfH8UH_TFwaNeKJ_mDDgwHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
    },
    {
      rank: 2,
      name: 'Longsilog',
      orders: 96,
      price: 150,
      image:
        'https://131500952.cdn6.editmysite.com/uploads/1/3/1/5/131500952/HP4PV6WHBSCOXPSFIIFA7TDZ.jpeg',
    },
    {
      rank: 3,
      name: 'Bangsilog',
      orders: 82,
      price: 170,
      image:
        'https://tse4.mm.bing.net/th/id/OIP.iROipFlj6rR5QAPfD0hTEgHaHX?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
    },
    {
      rank: 4,
      name: 'Tocilog',
      orders: 71,
      price: 150,
      image:
        'https://wfg32p.s3.amazonaws.com/media/dishes/tocilog_9142-med.png',
    },
  ];

  recentOrders: RecentOrder[] = [
    {
      orderNumber: 'KS-00125',
      customer: 'Juan Santos',
      type: 'Dine In',
      total: 350,
      status: 'Preparing',
    },
    {
      orderNumber: 'KS-00124',
      customer: 'Maria Cruz',
      type: 'Take Out',
      total: 220,
      status: 'Ready',
    },
    {
      orderNumber: 'KS-00123',
      customer: 'Pedro Reyes',
      type: 'Dine In',
      total: 480,
      status: 'Completed',
    },
    {
      orderNumber: 'KS-00122',
      customer: 'Carlo Reyes',
      type: 'Take Out',
      total: 180,
      status: 'Completed',
    },
  ];

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
