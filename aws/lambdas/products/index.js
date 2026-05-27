const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      host:     process.env.DB_HOST,
      port:     process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'postgres',
      user:     process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl:      { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  const db = getPool();
  await db.query(`CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE, name VARCHAR(100) NOT NULL, price DECIMAL(10,2) NOT NULL, stock INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  const method = event.requestContext?.http?.method || event.httpMethod;
  const storeId = event.pathParameters?.store_id;
  const id = event.pathParameters?.id;
  if (method === 'OPTIONS') return response(200, {});
  try {
    switch (method) {
      case 'GET': {
        const result = await db.query('SELECT * FROM products WHERE store_id = $1 ORDER BY id', [storeId]);
        return response(200, result.rows);
      }
      case 'POST': {
        const { name, price, stock } = JSON.parse(event.body || '{}');
        if (!name || !price) return response(400, { error: 'name e price são obrigatórios' });
        const result = await db.query('INSERT INTO products (store_id, name, price, stock) VALUES ($1, $2, $3, $4) RETURNING *', [storeId, name, price, stock || 0]);
        return response(201, result.rows[0]);
      }
      case 'PUT': {
        if (!id) return response(400, { error: 'id é obrigatório' });
        const { name, price, stock } = JSON.parse(event.body || '{}');
        const result = await db.query('UPDATE products SET name = $1, price = $2, stock = $3 WHERE id = $4 RETURNING *', [name, price, stock, id]);
        if (result.rows.length === 0) return response(404, { error: 'Product not found' });
        return response(200, result.rows[0]);
      }
      case 'DELETE': {
        if (!id) return response(400, { error: 'id é obrigatório' });
        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return response(404, { error: 'Product not found' });
        return response(200, { message: 'Product deleted' });
      }
      default:
        return response(405, { error: 'Método não permitido' });
    }
  } catch (err) {
    console.error(err);
    return response(500, { error: err.message });
  }
};