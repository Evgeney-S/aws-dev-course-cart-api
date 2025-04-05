import { Address, OrderStatus } from '../type';

export type Order = {
  id?: string;
  userId: string;
  items: Array<{ productId: string; count: number }>;
  cartId: string;
  address: Address;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: number;
    comment: string;
  }>;
};

export type OrderRow = {
    id: string;
    user_id: string;
    cart_id: string;
    status: OrderStatus;
    comments: string | null;
    delivery: any;
    payment: any;
    totlal: string;
};
