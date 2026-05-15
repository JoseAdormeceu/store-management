const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Página de documentação da API
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <title>Store Management API</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --primary: #2563eb;
      --bg: #f8fafc;
      --surface: #ffffff;
      --border: #e2e8f0;
      --text: #1e293b;
      --muted: #64748b;
      --green: #16a34a;
      --orange: #ea580c;
      --red: #dc2626;
      --purple: #7c3aed;
    }
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); }
    header {
      background: var(--primary);
      color: white;
      padding: 2rem;
    }
    header h1 { font-size: 1.5rem; font-weight: 600; }
    header p { margin-top: 0.5rem; opacity: 0.85; font-size: 0.9rem; }
    main { max-width: 900px; margin: 2rem auto; padding: 0 2rem; }
    .section { margin-bottom: 2rem; }
    .section h2 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--primary);
      color: var(--primary);
    }
    .endpoint {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 0.75rem;
      overflow: hidden;
    }
    .endpoint-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1.25rem;
    }
    .method {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      min-width: 60px;
      text-align: center;
      color: white;
    }
    .GET { background: var(--green); }
    .POST { background: var(--primary); }
    .PUT { background: var(--orange); }
    .DELETE { background: var(--red); }
    .path { font-family: monospace; font-size: 0.95rem; font-weight: 500; }
    .desc { color: var(--muted); font-size: 0.85rem; margin-left: auto; }
    .status {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #dcfce7;
      color: var(--green);
      margin-left: 0.5rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>Store Management API</h1>
    <p>REST API — Plataformas de Desenvolvimento 2025/26 &nbsp;|&nbsp; Base URL: http://localhost:3000</p>
  </header>
  <main>
    <div class="section">
      <h2>Stores</h2>
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="method GET">GET</span>
          <span class="path">/stores</span>
          <span class="desc">Listar todas as lojas</span>
        </div>
      </div>
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="method GET">GET</span>
          <span class="path">/stores/:id</span>
          <span class="desc">Obter uma loja por ID</span>
        </div>
      </div>
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="method POST">POST</span>
          <span class="path">/stores</span>
          <span class="desc">Criar uma nova loja</span>
        </div>
      </div>
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="method PUT">PUT</span>
          <span class="path">/stores/:id</span>
          <span class="desc">Atualizar uma loja</span>
        </div>
      </div>
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="method DELETE">DELETE</span>
          <span class="path">/stores/:id</span>
          <span class="desc">Apagar uma loja</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Products</h2>
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="method GET">GET</span>
          <span class="path">/stores/:store_id/products</span>
          <span class="desc">Listar produtos de uma loja</span>
        </div>
      </div>
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="method POST">POST</span>
          <span class="path">/stores/:store_id/products</span>
          <span class="desc">Criar produto numa loja</span>
        </div>
      </div>
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="method PUT">PUT</span>
          <span class="path">/products/:id</span>
          <span class="desc">Atualizar um produto</span>
        </div>
      </div>
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="method DELETE">DELETE</span>
          <span class="path">/products/:id</span>
          <span class="desc">Apagar um produto</span>
        </div>
      </div>
    </div>
  </main>
</body>
</html>
  `);
}); 

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