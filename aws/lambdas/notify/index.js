const { Pool } = require('pg');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

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

const sns = new SNSClient({ region: 'us-east-1' });
const s3  = new S3Client({ region: 'us-east-1' });

const TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const THRESHOLD = parseInt(process.env.STOCK_THRESHOLD || '5', 10);
const BUCKET    = process.env.S3_BUCKET;

exports.handler = async () => {
  const db = getPool();
  console.log('StockAlertNotifier iniciado:', new Date().toISOString());

  try {
    const result = await db.query(
      `SELECT p.id, p.name, p.stock, s.name as store_name
       FROM products p
       JOIN stores s ON s.id = p.store_id
       WHERE p.stock < $1
       ORDER BY p.stock ASC`,
      [THRESHOLD]
    );
    const lowStock = result.rows;

    // Guardar relatório diário no S3 (backlog histórico)
    const today = new Date().toISOString().split('T')[0];
    const relatorio = {
      data: today,
      threshold: THRESHOLD,
      total_alertas: lowStock.length,
      produtos: lowStock
    };

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `relatorios/${today}.json`,
      Body: JSON.stringify(relatorio, null, 2),
      ContentType: 'application/json'
    }));
    console.log(`Relatório guardado no S3: relatorios/${today}.json`);

    if (lowStock.length === 0) {
      console.log('Stock OK — sem alertas.');
      return { statusCode: 200, body: 'Sem alertas de stock.' };
    }

    // Enviar email via SNS
    const now = new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' });
    const linhas = lowStock.map(p => `• ${p.name} (${p.store_name}) — stock: ${p.stock}`).join('\n');
    const message = [
      `[Store Management] Alerta de Stock Baixo`,
      `Hora: ${now}`,
      ``,
      `Produtos com stock abaixo de ${THRESHOLD} unidades:`,
      linhas,
      ``,
      `Total: ${lowStock.length} produto(s) em alerta.`
    ].join('\n');

    const result2 = await sns.send(new PublishCommand({
      TopicArn: TOPIC_ARN,
      Message: message,
      Subject: 'Alerta: Stock Baixo',
    }));
    console.log('Email enviado, MessageId:', result2.MessageId);
    return { statusCode: 200, body: 'Alerta enviado!' };

  } catch (err) {
    console.error('Erro:', err);
    throw err;
  }
};