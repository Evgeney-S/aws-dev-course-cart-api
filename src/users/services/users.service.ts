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

    findOne(name: string): User | null {
        try {
            const result: any = db.query('SELECT * FROM users WHERE name = $1 LIMIT 1', [name]);

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

    createOne({ name, password }: User): User | null {
        try {
            const result: any = db.query(
                'INSERT INTO users (id, name, password) VALUES ($1, $2, $3) RETURNING *', 
                [randomUUID(), name, password]
            );

            if (result.rowCount === 1) {
                return result.rows[0];
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }
}
