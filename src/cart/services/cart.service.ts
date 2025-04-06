import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Cart, CartItem, CartStatuses, Product, ProductsDetails } from '../models';
import { PutCartPayload } from '../../order/type';
import * as db from '../../db';
import { count } from 'node:console';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";

@Injectable()
export class CartService {

    private userCarts: Record<string, Cart> = {};

    async findByUserId(userId: string): Promise<Cart | null> {
        try {
            const result: any = db.query(
                'SELECT * FROM cart WHERE user_id = $1 AND satus = $2', 
                [userId, CartStatuses.OPEN]
            );

            if(result.rows.length === 0) {
                return null;
            }else{
                let cart = result.rows[0];
                const cartItems = await this.getCartItems(cart.id);
                cart.items = cartItems;

                return cart;
            }

        } catch (error) {
            console.error('Error fetching cart by user ID:', error);
            throw error;
        }
    }



    async getCartItems(cartId: string): Promise<CartItem[] | []> {
        try {
            const result: any = db.query('SELECT * FROM cart_items WHERE cart_id = $1', [cartId]);

            if (result.rows.length === 0) {
                return [];
            }else{
                const productIds: string[] = result.rows.map((item: { product_id: string }) => item.product_id);
                const productsDetails = await this.getProductsDetails(productIds);
                let cartItems: CartItem[] = [];
                result.rows.forEach((item: { product_id: string; count: number }) => {
                    const cartItem: CartItem = {
                        product: productsDetails[item.product_id],
                        count: item.count,
                    };
                    cartItems.push(cartItem);
                });
                console.log('Cart items:', cartItems);

                return cartItems;
            }

        } catch (error) {
            console.error('Error fetching cart items:', error);
            throw error;
        }
    }



    async getProductsDetails(productIds: string[]): Promise<ProductsDetails> {
        
        const dynamoDb = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(dynamoDb);

        const productsTableName = process.env.PRODUCTS_TABLE!;

        try {
            const command = new BatchGetCommand({
                RequestItems: {
                    [productsTableName]: {
                        Keys: productIds.map(id => ({ id }))
                    }
                }
            });

            const response = await docClient.send(command);

            if (!response.Responses) {
                return {};
            }

            const products = response.Responses[productsTableName] as Product[];
            const productsDetails: ProductsDetails = {};
            products.forEach(product => {
                productsDetails[product.id] = product;
            });
            console.log('Products details:', productsDetails);

            return productsDetails;

        } catch (error) {
            console.error('Error fetching products from DynamoDB:', error);
            // return {};
            throw error;
        }
    }
    


    createByUserId(user_id: string): Cart {
        try {
            const result: any = db.query(
                'INSERT INTO carts (id, user_id, created_at, updated_at, status) VALUES ($1, $2, NOW(), NOW(), $3) RETURNING *', 
                [randomUUID(), user_id, CartStatuses.OPEN]
            );
        
            if (result.rowCount === 1) {
                const userCart = {
                    ...result.rows[0],
                    items: []
                };
                
                console.log('Cart created: ', userCart);
                return userCart;

            } else {
                console.error('Failed to create cart by user ID');
                throw new Error('Failed to create cart by user ID');
            }
        } catch (error) {
            console.error('Error on cart creating (createByUserId):', error);
            throw error;
        }
    }



    async findOrCreateByUserId(userId: string): Promise<Cart> {
        const userCart = await this.findByUserId(userId);

        if (userCart) {
            return userCart;
        } else {
            return this.createByUserId(userId);
        }
    }



    async updateByUserId(userId: string, payload: PutCartPayload): Promise<Cart> {
        const userCart = await this.findOrCreateByUserId(userId);

        const index = userCart.items.findIndex(
            ({ product }) => product.id === payload.product.id,
        );

        try {
            if (index === -1) {
                // userCart.items.push(payload);
                const res: any = db.query(
                    'INSERT INTO carts_items (cart_id, product_id, count) VALUES ($1, $2, $3)', 
                    [userCart.id, payload.product.id, payload.count]
                );
                
            } else if (payload.count === 0) {
                // userCart.items.splice(index, 1);
                const res: any = db.query(
                    'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', 
                    [userCart.id, payload.product.id]
                );
            } else {
                // userCart.items[index] = payload;
                const res: any = db.query(
                    'UPDATE cart_items SET count = $1 WHERE cart_id = $2 AND product_id = $3', 
                    [payload.count, userCart.id, payload.product.id]
                );
            }
    
            const updatedCart = await this.findByUserId(userId);
            if (!updatedCart) {
                throw new Error('Cart not found after update');
            }
            return updatedCart;

        } catch (error) {
            console.error('Error on cart updating (updateByUserId):', error);
            throw error;
        }
    }



    // Not using this method in the code, but it can be used to remove all carts for user
    async removeAllByUserId(userId: string): Promise<void> {

        const client = await db.client; // We need to use dedicated client for transaction (not just db.query)

        try {
            await client.query('BEGIN');

            // Not using findByUserId here, because it returns only one user cart, 
            // and we need to be shure to delete all carts for user
            const cartsResult = await client.query('SELECT id FROM carts WHERE user_id = $1', [userId]);

            if(cartsResult.rows.length === 0) {
                client.query('COMMIT');
                return;
            }

            const cartIds: string[] = cartsResult.rows.map((row: { id: string }) => row.id);
            await client.query('DELETE FROM cart_items WHERE cart_id = ANY($1::uuid[])', [cartIds]);
            await client.query('DELETE FROM carts WHERE user_id = $1 RETURNING id',[userId]);
            await client.query('COMMIT');

            return;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            await client.release();
        }
    }



    async removeByUserId(userId: string): Promise<void> {
        const userCart = await this.findByUserId(userId);

        if(!userCart) {
            return;
        }

        const client = await db.client; // We need to use dedicated client for transaction (not just db.query)

        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM cart_items WHERE cart_id = $1', [userCart.id]);
            await client.query('DELETE FROM carts WHERE id = $1 RETURNING id',[userCart.id]);
            await client.query('COMMIT');

            return;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            await client.release();
        }
    }



    setOrderedByUserId(userId: string, dbClient?: any): void {
        try{
            const query = {
                text: 'UPDATE carts SET status = $1 WHERE user_id = $2 AND status = $3 RETURNING id',
                params: [CartStatuses.ORDERED, userId, CartStatuses.OPEN]
            };
            if(dbClient) {
                dbClient.query(query.text, query.params);
            }else{
                db.query(query.text, query.params);
            }
        } catch (error) {
            console.error('Error on cart updating (setOrderedByUserId):', error);
            throw error;
        }
    }
}
