import { Component } from '@angular/core';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  reports = [
    {
      title: 'Daily Sales Report',
      description: "Summary of today's sales and orders.",
      icon: '₱',
    },
    {
      title: 'Monthly Sales Report',
      description: 'Monthly revenue and performance.',
      icon: '▥',
    },
    {
      title: 'Best Seller Report',
      description: 'See which menu items sell the most.',
      icon: '★',
    },
    {
      title: 'Order Report',
      description: 'Detailed history of customer orders.',
      icon: '☷',
    },
    {
      title: 'Staff Performance',
      description: 'Monitor staff activity and performance.',
      icon: '♙',
    },
    {
      title: 'Customer Report',
      description: 'Customer growth and purchasing activity.',
      icon: '♙',
    },
  ];
}
