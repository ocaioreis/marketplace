# 🛒 Marketplace API

API REST para marketplace, construída em **Node.js puro** (sem dependências).  
Dados em memória — troque `src/db/database.js` por Postgres/Prisma em produção.

## Início rápido

```bash
node server.js
# Rodando em http://localhost:3000
```

---

## Endpoints

### 🔍 Saúde & Index
```bash
curl http://localhost:3000/health
curl http://localhost:3000/
```

---

### 👤 Usuários `/users`
```bash
# Listar todos
curl http://localhost:3000/users

# Buscar por ID
curl http://localhost:3000/users/u1

# Criar
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Carlos Lima","email":"carlos@email.com","role":"seller"}'

# Atualizar
curl -X PUT http://localhost:3000/users/u1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana Silva Atualizada"}'

# Deletar
curl -X DELETE http://localhost:3000/users/u2
```

---

### 🏪 Lojas `/stores`
```bash
# Listar todas
curl http://localhost:3000/stores

# Buscar loja por ID
curl http://localhost:3000/stores/s1

# Produtos de uma loja
curl http://localhost:3000/stores/s1/products

# Criar loja
curl -X POST http://localhost:3000/stores \
  -H "Content-Type: application/json" \
  -d '{"ownerId":"u1","name":"Nova Loja","slug":"nova-loja","description":"Descrição"}'
```

---

### 📦 Produtos `/products`
```bash
# Listar (com filtros opcionais)
curl "http://localhost:3000/products"
curl "http://localhost:3000/products?search=vaso"
curl "http://localhost:3000/products?minPrice=5000&maxPrice=30000"
curl "http://localhost:3000/products?category=cat2"

# Buscar por ID (inclui reviews e rating médio)
curl http://localhost:3000/products/p1

# Criar
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"storeId":"s1","categoryId":"cat2","name":"Pote de Barro","description":"Artesanal","price":4500,"stock":20}'

# Atualizar estoque/preço
curl -X PUT http://localhost:3000/products/p1 \
  -H "Content-Type: application/json" \
  -d '{"price":9500,"stock":10}'

# Desativar (soft delete)
curl -X DELETE http://localhost:3000/products/p2
```

---

### ⭐ Reviews `/products/:id/reviews`
```bash
# Listar reviews de um produto
curl http://localhost:3000/products/p1/reviews

# Criar review
curl -X POST http://localhost:3000/products/p1/reviews \
  -H "Content-Type: application/json" \
  -d '{"userId":"u2","rating":4,"comment":"Muito bonito!"}'
```

---

### 🧾 Pedidos `/orders`
```bash
# Listar todos
curl http://localhost:3000/orders

# Buscar pedido com itens
curl http://localhost:3000/orders/o1

# Criar pedido (decrementa estoque automaticamente)
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "u2",
    "addressId": "addr1",
    "paymentMethod": "pix",
    "items": [
      {"productId": "p2", "quantity": 1}
    ]
  }'

# Atualizar status
curl -X PUT http://localhost:3000/orders/o1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"shipped"}'
```

---

### 🗂️ Categorias `/categories`
```bash
# Listar todas
curl http://localhost:3000/categories

# Produtos de uma categoria
curl http://localhost:3000/categories/cat2/products

# Criar categoria
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Decoração","slug":"decoracao","parentId":"cat2"}'
```

---

## Estrutura do projeto

```
marketplace-api/
├── server.js                   # Entry point, HTTP server
└── src/
    ├── db/
    │   └── database.js         # In-memory store + seed data
    ├── middleware/
    │   └── router.js           # Router, helpers de resposta, body parser
    └── routes/
        ├── users.js            # /users + /stores
        └── products.js         # /products + /orders + /categories
```
