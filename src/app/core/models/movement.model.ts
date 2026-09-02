export interface Movement {
  id: string;
  date: string;
  ingredient: string;
  type: 'Stock In' | 'Stock Out';
  quantity: number;
  unit: string;
  reason: string;
}
