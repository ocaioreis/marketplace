// ============================================================
//  routes/products.js
// ============================================================
const { db, createId, now } = require("../db/database");
const { ok, created, notFound, badRequest, parseBody } = require("../middleware/router");

module.exports = (router) => {

  // GET /products?category=&minPrice=&maxPrice=&search=
  router.get("/products", (req, res, { query }) => {
    let results = db.products.filter((p) => p.isActive);
    if (query.category) results = results.filter((p) => p.categoryId === query.category);
    if (query.minPrice) results = results.filter((p) => p.price >= Number(query.minPrice));
    if (query.maxPrice) results = results.filter((p) => p.price <= Number(query.maxPrice));
    if (query.search)   results = results.filter((p) => p.name.toLowerCase().includes(query.search.toLowerCase()));
    ok(res, results, { total: results.length });
  });

  // GET /products/:id
  router.get("/products/:id", (req, res, { params }) => {
    const product = db.products.find((p) => p.id === params.id);
    if (!product) return notFound(res, "Produto não encontrado");
    const reviews = db.reviews.filter((r) => r.productId === params.id);
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
    ok(res, { ...product, reviewCount: reviews.length, avgRating: Number(avgRating) });
  });

  // POST /products
  router.post("/products", async (req, res) => {
    try {
      const body = await parseBody(req);
      const { storeId, categoryId, name, description, price, stock } = body;
      if (!storeId || !name || price === undefined || stock === undefined)
        return badRequest(res, "storeId, name, price e stock são obrigatórios");
      if (!db.stores.find((s) => s.id === storeId)) return notFound(res, "Loja não encontrada");
      const product = { id: createId(), storeId, categoryId: categoryId || null, name, description: description || "", price: Number(price), stock: Number(stock), images: body.images || [], tags: body.tags || [], isActive: true, createdAt: now() };
      db.products.push(product);
      created(res, product);
    } catch (e) { badRequest(res, e.message); }
  });

  // PUT /products/:id
  router.put("/products/:id", async (req, res, { params }) => {
    try {
      const idx = db.products.findIndex((p) => p.id === params.id);
      if (idx === -1) return notFound(res, "Produto não encontrado");
      const body = await parseBody(req);
      ["name","description","price","stock","images","tags","isActive","categoryId"].forEach((k) => {
        if (body[k] !== undefined) db.products[idx][k] = body[k];
      });
      ok(res, db.products[idx]);
    } catch (e) { badRequest(res, e.message); }
  });

  // DELETE /products/:id
  router.delete("/products/:id", (req, res, { params }) => {
    const idx = db.products.findIndex((p) => p.id === params.id);
    if (idx === -1) return notFound(res, "Produto não encontrado");
    db.products[idx].isActive = false; // soft delete
    ok(res, { message: "Produto desativado" });
  });

  // GET /products/:id/reviews
  router.get("/products/:id/reviews", (req, res, { params }) => {
    if (!db.products.find((p) => p.id === params.id)) return notFound(res, "Produto não encontrado");
    const reviews = db.reviews.filter((r) => r.productId === params.id);
    ok(res, reviews, { total: reviews.length });
  });

  // POST /products/:id/reviews
  router.post("/products/:id/reviews", async (req, res, { params }) => {
    try {
      if (!db.products.find((p) => p.id === params.id)) return notFound(res, "Produto não encontrado");
      const body = await parseBody(req);
      const { userId, rating, comment } = body;
      if (!userId || !rating) return badRequest(res, "userId e rating são obrigatórios");
      if (rating < 1 || rating > 5) return badRequest(res, "rating deve ser entre 1 e 5");
      const review = { id: createId(), userId, productId: params.id, rating: Number(rating), comment: comment || null, createdAt: now() };
      db.reviews.push(review);
      created(res, review);
    } catch (e) { badRequest(res, e.message); }
  });
};

// ============================================================
//  routes/orders.js
// ============================================================
module.exports.orders = (router) => {

  // GET /orders
  router.get("/orders", (req, res) => {
    ok(res, db.orders, { total: db.orders.length });
  });

  // GET /orders/:id
  router.get("/orders/:id", (req, res, { params }) => {
    const order = db.orders.find((o) => o.id === params.id);
    if (!order) return notFound(res, "Pedido não encontrado");
    const items = db.orderItems.filter((i) => i.orderId === params.id);
    ok(res, { ...order, items });
  });

  // POST /orders
  router.post("/orders", async (req, res) => {
    try {
      const body = await parseBody(req);
      const { buyerId, addressId, items, paymentMethod } = body;
      if (!buyerId || !addressId || !items?.length || !paymentMethod)
        return badRequest(res, "buyerId, addressId, items e paymentMethod são obrigatórios");
      if (!db.users.find((u) => u.id === buyerId)) return notFound(res, "Comprador não encontrado");

      // validate & compute totals
      let totalAmount = 0;
      const orderItems = [];
      for (const item of items) {
        const product = db.products.find((p) => p.id === item.productId && p.isActive);
        if (!product) return notFound(res, `Produto ${item.productId} não encontrado`);
        if (product.stock < item.quantity) return badRequest(res, `Estoque insuficiente para ${product.name}`);
        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;
        orderItems.push({ id: createId(), productId: item.productId, quantity: item.quantity, unitPrice: product.price, subtotal });
        product.stock -= item.quantity; // decrement stock
      }

      const order = { id: createId(), buyerId, addressId, status: "pending", totalAmount, paymentMethod, paymentRef: null, createdAt: now(), updatedAt: now() };
      db.orders.push(order);
      orderItems.forEach((oi) => { oi.orderId = order.id; db.orderItems.push(oi); });
      created(res, { ...order, items: orderItems });
    } catch (e) { badRequest(res, e.message); }
  });

  // PUT /orders/:id/status
  router.put("/orders/:id/status", async (req, res, { params }) => {
    try {
      const idx = db.orders.findIndex((o) => o.id === params.id);
      if (idx === -1) return notFound(res, "Pedido não encontrado");
      const { status } = await parseBody(req);
      const valid = ["pending","paid","shipped","delivered","cancelled"];
      if (!valid.includes(status)) return badRequest(res, `Status deve ser: ${valid.join(", ")}`);
      db.orders[idx].status = status;
      db.orders[idx].updatedAt = now();
      ok(res, db.orders[idx]);
    } catch (e) { badRequest(res, e.message); }
  });
};

// ============================================================
//  routes/categories.js
// ============================================================
module.exports.categories = (router) => {

  // GET /categories
  router.get("/categories", (req, res) => {
    ok(res, db.categories);
  });

  // GET /categories/:id/products
  router.get("/categories/:id/products", (req, res, { params }) => {
    const products = db.products.filter((p) => p.categoryId === params.id && p.isActive);
    ok(res, products, { total: products.length });
  });

  // POST /categories
  router.post("/categories", async (req, res) => {
    try {
      const body = await parseBody(req);
      const { name, slug, parentId } = body;
      if (!name || !slug) return badRequest(res, "name e slug são obrigatórios");
      if (db.categories.find((c) => c.slug === slug)) return badRequest(res, "Slug já em uso");
      const cat = { id: createId(), parentId: parentId || null, name, slug, iconUrl: body.iconUrl || null };
      db.categories.push(cat);
      created(res, cat);
    } catch (e) { badRequest(res, e.message); }
  });
};
