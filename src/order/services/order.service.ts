import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Order, OrderRow } from '../models';
import { CreateOrderPayload, OrderStatus, Address } from '../type';
import { CartService } from '../../cart';
import { Cart, CartItem, CartStatuses, Product, ProductsDetails } from '../../cart/models';
import * as db from '../../db';

@Injectable()
export class OrderService {
  private orders: Record<string, Order> = {};
  constructor(private readonly cartService: CartService) {}

    async getAll() {
        // return Object.values(this.orders);
        try{
            const result: any = db.query('SELECT * FROM orders LIMIT 100');
            if(result.rows.length === 0) {
                return null;
            }else{
                let orders: Order[] = [];
                
                for (const order of result.rows) {
                    const curOrder = await this.getOrderObject(order);
                    orders.push(curOrder);
                }

                return orders;
            }
        } catch (error){
            console.error('Error fetching ALL orders:', error);
            throw error;
        }
    }

    async getOrderObject(order: OrderRow): Promise<Order> {
        const cartItems = await this.cartService.getCartItems(order.cart_id);
        const orderItems = cartItems.map((item: CartItem) => ({productId: item.product.id, count: item.count}));
        const orderObj = {
            id: order.id,
            userId: order.user_id,
            items: orderItems,
            cartId: order.cart_id,
            address: order.delivery.address,
            statusHistory: [
                {
                    status: order.status,
                    timestamp: 0,
                    comment: order.comments ?? '',
                }
            ]
        };

        return orderObj;
    }

    async findById(orderId: string): Promise<Order | null> {
        // return this.orders[orderId];
        try {
            const result: any = db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
            if(result.rows.length === 0) {
                return null;
            }else{
                const order = await this.getOrderObject(result.rows[0]);
                return order;
            }
        } catch (error) {
            console.error('Error fetching order by ID:', error);
            throw error;
        }
    }

    create(data: CreateOrderPayload, dbClient?: any) {
        try{
            const query = {
                text: 'INSERT INTO orders (id, user_id, cart_id, payment, delivery, comments, status, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', 
                params: [randomUUID(), data.userId, data.cartId, null, {address: data.address}, data.address.comment, OrderStatus.Open, data.total]
            };
            let result: any; 
            if(dbClient) {
                result = dbClient.query(query.text, query.params);
            }else{
                result = db.query(query.text, query.params);
            }

            if (result.rowCount === 1) {
                const order: Order = {
                    // id: result.rows[0].id,
                    userId: result.rows[0].user_id,
                    cartId: result.rows[0].cart_id,
                    items: data.items,
                    address: result.rows[0].delivery.address,
                    statusHistory: [
                        {
                            status: result.rows[0].status,
                            timestamp: 0,
                            comment: result.rows[0].comments,
                        }
                    ],
                };
                
                console.log('Order created: ', order);
                return order;

            } else {
                console.error('Failed to create order');
                throw new Error('Failed to create order');
            }

        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }

  // TODO add  type
    async update(orderId: string, data: Order) {
        const order = await this.findById(orderId);

        if (!order) {
            throw new Error('Order does not exist.');
        }

        try {
            const result: any = db.query(
                'UPDATE orders SET status = $1, comments = $2 WHERE id = $3 RETURNING *',
                [data.statusHistory[0].status, data.statusHistory[0].comment, orderId]
            );

            if (result.rowCount === 1) {
                console.log('Order updated: ', result.rows[0]);
            } else {
                console.error('Failed to update order');
                throw new Error('Failed to update order');
            }
            // return result.rows[0];
        } catch (error) {
            console.error('Error updating order:', error);
            throw error;
        }

        // this.orders[orderId] = {
        //     ...data,
        //     id: orderId,
        // };
    }
}
