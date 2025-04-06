import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { User } from '../models';
import * as db from '../../db';

@Injectable()
export class UsersService {
  private readonly users: Record<string, User>;

  constructor() {
    this.users = {};
  }

    async findOne(name: string): Promise<User | null> {
        try {
            const result: any = await db.query('SELECT * FROM users WHERE name = $1 LIMIT 1', [name]);

            if (result.rowCount === 0) {
                return null;
            } else {
                return result.rows[0];
            }

        } catch (error) {
            console.error('Error fetching user by name:', error);
            throw error;
        }
    }

    async createOne({ name, password }: User): Promise<User> {
        try {
            const result: any = await db.query(
                'INSERT INTO users (id, name, password) VALUES ($1, $2, $3) RETURNING *', 
                [randomUUID(), name, password]
            );

            if (result.rowCount === 1) {
                return result.rows[0];
            } else {
                throw new Error('Failed to create user');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }
}
