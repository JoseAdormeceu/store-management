const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'storedb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Criar tabela se não existir
pool.query(`
  CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// GET - listar todas as lojas
app.get('/stores', async (req, res) => {
  const result = await pool.query('SELECT * FROM stores ORDER BY id');
  res.json(result.rows);
});

// GET - obter uma loja
app.get('/stores/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM stores WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Store not found' });
  res.json(result.rows[0]);
});

// POST - criar loja
app.post('/stores', async (req, res) => {
  const { name, location } = req.body;
  const result = await pool.query(
    'INSERT INTO stores (name, location) VALUES ($1, $2) RETURNING *',
    [name, location]
  );
  res.status(201).json(result.rows[0]);
});

// PUT - atualizar loja
app.put('/stores/:id', async (req, res) => {
  const { name, location } = req.body;
  const result = await pool.query(
    'UPDATE stores SET name = $1, location = $2 WHERE id = $3 RETURNING *',
    [name, location, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Store not found' });
  res.json(result.rows[0]);
});

// DELETE - apagar loja
app.delete('/stores/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM stores WHERE id = $1 RETURNING *', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Store not found' });
  res.json({ message: 'Store deleted' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
// Criar tabela products se não existir
pool.query(`
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// GET - listar todos os produtos de uma loja
app.get('/stores/:store_id/products', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM products WHERE store_id = $1 ORDER BY id',
    [req.params.store_id]
  );
  res.json(result.rows);
});

// POST - criar produto numa loja
app.post('/stores/:store_id/products', async (req, res) => {
  const { name, price, stock } = req.body;
  const result = await pool.query(
    'INSERT INTO products (store_id, name, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.params.store_id, name, price, stock || 0]
  );
  res.status(201).json(result.rows[0]);
});

// PUT - atualizar produto
app.put('/products/:id', async (req, res) => {
  const { name, price, stock } = req.body;
  const result = await pool.query(
    'UPDATE products SET name = $1, price = $2, stock = $3 WHERE id = $4 RETURNING *',
    [name, price, stock, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
  res.json(result.rows[0]);
});

// DELETE - apagar produto
app.delete('/products/:id', async (req, res) => {
  const result = await pool.query(
    'DELETE FROM products WHERE id = $1 RETURNING *',
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
  res.json({ message: 'Product deleted' });
});