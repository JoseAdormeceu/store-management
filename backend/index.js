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