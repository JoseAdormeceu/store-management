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
  await db.query(`CREATE TABLE IF NOT EXISTS stores (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, location VARCHAR(200), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  const method = event.requestContext?.http?.method || event.httpMethod;
  const id = event.pathParameters?.id;
  if (method === 'OPTIONS') return response(200, {});
  try {
    switch (method) {
      case 'GET': {
        if (id) {
          const result = await db.query('SELECT * FROM stores WHERE id = $1', [id]);
          if (result.rows.length === 0) return response(404, { error: 'Store not found' });
          return response(200, result.rows[0]);
        }
        const result = await db.query('SELECT * FROM stores ORDER BY id');
        return response(200, result.rows);
      }
      case 'POST': {
        const { name, location } = JSON.parse(event.body || '{}');
        if (!name) return response(400, { error: 'name é obrigatório' });
        const result = await db.query('INSERT INTO stores (name, location) VALUES ($1, $2) RETURNING *', [name, location]);
        return response(201, result.rows[0]);
      }
      case 'PUT': {
        if (!id) return response(400, { error: 'id é obrigatório' });
        const { name, location } = JSON.parse(event.body || '{}');
        const result = await db.query('UPDATE stores SET name = $1, location = $2 WHERE id = $3 RETURNING *', [name, location, id]);
        if (result.rows.length === 0) return response(404, { error: 'Store not found' });
        return response(200, result.rows[0]);
      }
      case 'DELETE': {
        if (!id) return response(400, { error: 'id é obrigatório' });
        const result = await db.query('DELETE FROM stores WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return response(404, { error: 'Store not found' });
        return response(200, { message: 'Store deleted' });
      }
      default:
        return response(405, { error: 'Método não permitido' });
    }
  } catch (err) {
    console.error('Erro:', err);
    return response(500, { error: err.message });
  }
};