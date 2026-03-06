// ============================================================
//  middleware/router.js — Lightweight router (no Express)
// ============================================================
const { URL } = require("url");

class Router {
  constructor() {
    this.routes = [];
  }

  register(method, pattern, handler) {
    // Convert /users/:id  →  regex + param names
    const keys = [];
    const regexStr = pattern
      .replace(/:[^/]+/g, (m) => { keys.push(m.slice(1)); return "([^/]+)"; })
      .replace(/\//g, "\\/");
    this.routes.push({ method, regex: new RegExp(`^${regexStr}$`), keys, handler });
  }

  get(pattern, handler)    { this.register("GET",    pattern, handler); }
  post(pattern, handler)   { this.register("POST",   pattern, handler); }
  put(pattern, handler)    { this.register("PUT",    pattern, handler); }
  delete(pattern, handler) { this.register("DELETE", pattern, handler); }

  resolve(method, pathname) {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = pathname.match(route.regex);
      if (match) {
        const params = {};
        route.keys.forEach((k, i) => { params[k] = match[i + 1]; });
        return { handler: route.handler, params };
      }
    }
    return null;
  }
}

// ── Response helpers ─────────────────────────────────────────
const send = (res, status, body) => {
  const json = JSON.stringify(body, null, 2);
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(json);
};

const ok       = (res, data, meta = {})  => send(res, 200, { success: true,  data, ...meta });
const created  = (res, data)             => send(res, 201, { success: true,  data });
const noContent = (res)                  => { res.writeHead(204); res.end(); };
const notFound = (res, msg = "Not found") => send(res, 404, { success: false, error: msg });
const badRequest = (res, msg)            => send(res, 400, { success: false, error: msg });
const serverError = (res, err)           => send(res, 500, { success: false, error: err.message });

// ── Body parser ───────────────────────────────────────────────
const parseBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error("Invalid JSON")); }
    });
  });

module.exports = { Router, send, ok, created, noContent, notFound, badRequest, serverError, parseBody };
