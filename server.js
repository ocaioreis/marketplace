// ============================================================
//  server.js — Marketplace API  (Node.js nativo, sem dependências)
//  Inicie com:  node server.js
//  Porta padrão: 3000  (sobreponha com PORT=xxxx node server.js)
// ============================================================
"use strict";

const http = require("http");
const { URL } = require("url");
const { Router, send, serverError } = require("./src/middleware/router");

// ── Register all routes ───────────────────────────────────────
const router = new Router();

const registerUsers      = require("./src/routes/users");
const { stores: registerStores } = require("./src/routes/users");
const registerProducts   = require("./src/routes/products");
const { orders: registerOrders, categories: registerCategories } = require("./src/routes/products");

registerUsers(router);
registerStores(router);
registerProducts(router);
registerOrders(router);
registerCategories(router);

// ── Health check ──────────────────────────────────────────────
router.get("/health", (req, res) => {
  send(res, 200, { status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" });
});

// ── API index ─────────────────────────────────────────────────
router.get("/", (req, res) => {
  send(res, 200, {
    name: "Marketplace API",
    version: "1.0.0",
    endpoints: {
      health:     "GET  /health",
      users:      ["GET /users", "GET /users/:id", "POST /users", "PUT /users/:id", "DELETE /users/:id"],
      stores:     ["GET /stores", "GET /stores/:id", "GET /stores/:id/products", "POST /stores"],
      products:   ["GET /products", "GET /products/:id", "POST /products", "PUT /products/:id", "DELETE /products/:id"],
      reviews:    ["GET /products/:id/reviews", "POST /products/:id/reviews"],
      orders:     ["GET /orders", "GET /orders/:id", "POST /orders", "PUT /orders/:id/status"],
      categories: ["GET /categories", "GET /categories/:id/products", "POST /categories"],
    },
  });
});

// ── HTTP server ───────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    });
    return res.end();
  }

  try {
    const url    = new URL(req.url, `http://localhost`);
    const query  = Object.fromEntries(url.searchParams.entries());
    const match  = router.resolve(req.method, url.pathname);

    if (!match) {
      return send(res, 404, { success: false, error: `Rota não encontrada: ${req.method} ${url.pathname}` });
    }

    await match.handler(req, res, { params: match.params, query });
  } catch (err) {
    serverError(res, err);
  }
});

server.listen(PORT, () => {
  console.log(`\n🛒  Marketplace API rodando em http://localhost:${PORT}`);
  console.log(`📋  Documentação:      GET  http://localhost:${PORT}/`);
  console.log(`💚  Health check:      GET  http://localhost:${PORT}/health`);
  console.log(`\nEndpoints disponíveis:`);
  console.log(`   Usuários   → /users`);
  console.log(`   Lojas      → /stores`);
  console.log(`   Produtos   → /products`);
  console.log(`   Pedidos    → /orders`);
  console.log(`   Categorias → /categories\n`);
});
