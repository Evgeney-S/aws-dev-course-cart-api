import pg from 'pg';

// We already got the DB connection settings from lambda environment variables (by task requirements)
// so we don't need to get them here
/*
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });
*/

const { Pool } = pg;

const connectionSettings = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    database: process.env.DB_DATABASE,
};

const pool = new Pool({
    ...connectionSettings,
    idleTimeoutMillis: 10*1000,
    max: 10,
});

interface QueryCallback {
    (err: Error | null, rows?: any[]): void;
}

export const query = (query: string, params?: any[], callback?: QueryCallback) => {
    pool.query(query, params || [], (err: Error, res: pg.QueryResult) => {
        if (err) {
            console.error('Error executing query', err.stack);
            return callback?.(err);
        }
        callback?.(null, res.rows);
    });
};

/*
export const query = (query: string, params?: any[], callback?) => {
    pool.query(query, params, (err, res) => {
        if (err) {
            console.error('Error executing query', err.stack);
            return callback(err);
        }
        callback(null, res.rows);
    });
}
*/

export const client = pool.connect();

export const close = () => {
    pool.end();
}
