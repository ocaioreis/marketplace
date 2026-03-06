// ============================================================
//  routes/users.js
// ============================================================
const { db, createId, now } = require("../db/database");
const { ok, created, notFound, badRequest, parseBody } = require("../middleware/router");

module.exports = (router) => {

  // GET /users
  router.get("/users", (req, res) => {
    const safe = db.users.map(({ passwordHash, ...u }) => u);
    ok(res, safe, { total: safe.length });
  });

  // GET /users/:id
  router.get("/users/:id", (req, res, { params }) => {
    const user = db.users.find((u) => u.id === params.id);
    if (!user) return notFound(res, "Usuário não encontrado");
    const { passwordHash, ...safe } = user;
    ok(res, safe);
  });

  // POST /users
  router.post("/users", async (req, res) => {
    try {
      const body = await parseBody(req);
      const { name, email, role = "buyer" } = body;
      if (!name || !email) return badRequest(res, "name e email são obrigatórios");
      if (db.users.find((u) => u.email === email))
        return badRequest(res, "Email já cadastrado");
      const user = { id: createId(), name, email, passwordHash: "hashed_pw", role, avatarUrl: null, createdAt: now(), updatedAt: now() };
      db.users.push(user);
      const { passwordHash, ...safe } = user;
      created(res, safe);
    } catch (e) { badRequest(res, e.message); }
  });

  // PUT /users/:id
  router.put("/users/:id", async (req, res, { params }) => {
    try {
      const idx = db.users.findIndex((u) => u.id === params.id);
      if (idx === -1) return notFound(res, "Usuário não encontrado");
      const body = await parseBody(req);
      const allowed = ["name", "avatarUrl", "role"];
      allowed.forEach((k) => { if (body[k] !== undefined) db.users[idx][k] = body[k]; });
      db.users[idx].updatedAt = now();
      const { passwordHash, ...safe } = db.users[idx];
      ok(res, safe);
    } catch (e) { badRequest(res, e.message); }
  });

  // DELETE /users/:id
  router.delete("/users/:id", (req, res, { params }) => {
    const idx = db.users.findIndex((u) => u.id === params.id);
    if (idx === -1) return notFound(res, "Usuário não encontrado");
    db.users.splice(idx, 1);
    ok(res, { message: "Usuário removido" });
  });
};

// ============================================================
//  routes/stores.js (appended here for brevity)
// ============================================================
module.exports.stores = (router) => {

  // GET /stores
  router.get("/stores", (req, res) => {
    ok(res, db.stores, { total: db.stores.length });
  });

  // GET /stores/:id
  router.get("/stores/:id", (req, res, { params }) => {
    const store = db.stores.find((s) => s.id === params.id);
    if (!store) return notFound(res, "Loja não encontrada");
    ok(res, store);
  });

  // GET /stores/:id/products
  router.get("/stores/:id/products", (req, res, { params }) => {
    const store = db.stores.find((s) => s.id === params.id);
    if (!store) return notFound(res, "Loja não encontrada");
    const products = db.products.filter((p) => p.storeId === params.id);
    ok(res, products, { total: products.length });
  });

  // POST /stores
  router.post("/stores", async (req, res) => {
    try {
      const body = await parseBody(req);
      const { ownerId, name, slug, description } = body;
      if (!ownerId || !name || !slug) return badRequest(res, "ownerId, name e slug são obrigatórios");
      if (!db.users.find((u) => u.id === ownerId)) return notFound(res, "Usuário dono não encontrado");
      if (db.stores.find((s) => s.slug === slug)) return badRequest(res, "Slug já em uso");
      const store = { id: createId(), ownerId, name, slug, description: description || null, logoUrl: null, rating: 0, isActive: true, createdAt: now() };
      db.stores.push(store);
      created(res, store);
    } catch (e) { badRequest(res, e.message); }
  });
};
