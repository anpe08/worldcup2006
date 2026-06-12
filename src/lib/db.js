import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

export const query = (text, params) => pool.query(text, params);
