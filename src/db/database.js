// ============================================================
//  db/database.js — In-memory store (substitua por Postgres/ORM)
// ============================================================
const { randomUUID } = require("crypto");

const now = () => new Date().toISOString();

// ── Seed data ────────────────────────────────────────────────
const db = {
  users: [
    { id: "u1", name: "Ana Silva",    email: "ana@email.com",   passwordHash: "hashed_pw", role: "seller", avatarUrl: null, createdAt: now(), updatedAt: now() },
    { id: "u2", name: "Bruno Costa",  email: "bruno@email.com", passwordHash: "hashed_pw", role: "buyer",  avatarUrl: null, createdAt: now(), updatedAt: now() },
  ],
  stores: [
    { id: "s1", ownerId: "u1", name: "Loja da Ana", slug: "loja-da-ana", description: "Produtos artesanais", logoUrl: null, rating: 4.8, isActive: true, createdAt: now() },
  ],
  categories: [
    { id: "cat1", parentId: null, name: "Eletrônicos",  slug: "eletronicos",  iconUrl: null },
    { id: "cat2", parentId: null, name: "Artesanato",   slug: "artesanato",   iconUrl: null },
    { id: "cat3", parentId: "cat1", name: "Smartphones", slug: "smartphones", iconUrl: null },
  ],
  products: [
    { id: "p1", storeId: "s1", categoryId: "cat2", name: "Vaso de Cerâmica", description: "Feito à mão", price: 8900, stock: 12, images: [], tags: ["cerâmica","decoração"], isActive: true, createdAt: now() },
    { id: "p2", storeId: "s1", categoryId: "cat2", name: "Quadro em Tela",   description: "Pintura abstrata", price: 25000, stock: 3, images: [], tags: ["arte"], isActive: true, createdAt: now() },
  ],
  orders: [
    { id: "o1", buyerId: "u2", addressId: "addr1", status: "delivered", totalAmount: 8900, paymentMethod: "credit_card", paymentRef: "pay_abc123", createdAt: now(), updatedAt: now() },
  ],
  orderItems: [
    { id: "oi1", orderId: "o1", productId: "p1", quantity: 1, unitPrice: 8900, subtotal: 8900 },
  ],
  reviews: [
    { id: "r1", userId: "u2", productId: "p1", rating: 5, comment: "Lindo e bem embalado!", createdAt: now() },
  ],
  addresses: [
    { id: "addr1", userId: "u2", street: "Rua das Flores, 42", city: "São Paulo", state: "SP", zipCode: "01310-100", country: "BR", isDefault: true },
  ],
};

// ── Generic helpers ──────────────────────────────────────────
const createId = () => randomUUID();

module.exports = { db, createId, now };
