const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Showcase WhatsApp E-Commerce Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Admin Access: http://localhost:${PORT}/api/admin`);
  console.log(`=================================================`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await pool.end();
    console.log('HTTP server and MySQL pool closed');
  });
});
