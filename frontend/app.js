const API = () => {
  const u = (window.APP_CONFIG && window.APP_CONFIG.API_URL !== undefined) ? window.APP_CONFIG.API_URL : "http://127.0.0.1:3000";
  return String(u).replace(/\/$/, "");
};
const $ = (id) => document.getElementById(id);
let token = localStorage.getItem("jwt") || "";
let user = localStorage.getItem("who") || "";
// Rol desde el payload del JWT ({..., role: "admin"|"user"}). Solo gating visual;
// la seguridad real está en Kong + los servicios.
function roleFromToken(t) {
  try {
    const payload = JSON.parse(atob(String(t).split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role || "";
  } catch (e) { return ""; }
}
let role = localStorage.getItem("who-role") || roleFromToken(token) || (user === "admin" ? "admin" : (user ? "user" : ""));
const isAdmin = () => role === "admin";

function beacon(action, route) {
  fetch(`${API()}/analytics`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user || "anonymous", action, route: route || location.pathname }),
  }).catch(() => {});
}
const authH = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });
function setStatus(m) { $("status").textContent = m; }
// Helpers de presentación (solo visual, no cambian datos ni endpoints)
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = (v) => { const n = Number(v); return Number.isFinite(n) ? "$" + n.toFixed(2) : esc(v); };
const setStat = (id, v) => { const el = $(id); if (el) el.textContent = v; };
const stockBadge = (s) => {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return `<span class="badge out">${esc(s)} · agotado</span>`;
  if (n < 50) return `<span class="badge low">${esc(s)} · bajo</span>`;
  return `<span class="badge ok">${esc(s)}</span>`;
};
const orderBadge = (st) => {
  const s = String(st || "").toUpperCase();
  const cls = s === "CANCELLED" ? "out" : (s === "PAID" || s === "COMPLETED" || s === "DELIVERED" ? "ok" : (s === "PENDING" ? "low" : "neu"));
  return `<span class="badge ${cls}">${esc(st)}</span>`;
};

async function login() {
  const username = $("in-user").value.trim(), password = $("in-pass").value;
  $("login-msg").textContent = "...";
  try {
    const r = await fetch(`${API()}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 429) throw new Error("Límite excedido (429). Espera ~60s y reintenta.");
      throw new Error(data.message || `HTTP ${r.status}`);
    }
    token = data.accessToken; user = username;
    role = roleFromToken(token) || (username === "admin" ? "admin" : "user");
    localStorage.setItem("jwt", token); localStorage.setItem("who", user); localStorage.setItem("who-role", role);
    renderSession(); beacon("login", "/auth/login"); await loadInitial();
    // Vuelve a Productos para que la vista y el estado queden coherentes.
    const p = document.querySelector('.tabs [data-tab="productos"]');
    if (p && token) switchTab(p, { silent: true });
    $("login-msg").textContent = "";
  } catch (e) { $("login-msg").textContent = "Error: " + e.message; }
}
function logout() {
  token = ""; user = ""; role = "";
  localStorage.removeItem("jwt"); localStorage.removeItem("who"); localStorage.removeItem("who-role");
  // Limpia todo lo del usuario anterior para no mostrar datos viejos al siguiente.
  productsCache = []; customersCache = []; ordersCache = []; auditCache = [];
  Object.keys(loadedTabs).forEach((k) => delete loadedTabs[k]);
  ["q-products", "q-customers", "q-orders", "f-audit-user"].forEach((id) => { const el = $(id); if (el) el.value = ""; });
  ["tb-products", "tb-customers", "tb-orders", "tb-audit"].forEach((id) => { const el = $(id); if (el) el.innerHTML = ""; });
  setStat("stat-products", "–"); setStat("stat-customers", "–"); setStat("stat-orders", "–");
  setStatus("");
  $("health-out").textContent = "Pulsa «Salud del sistema» para ver el estado de los microservicios.";
  renderSession();
}
// Muestra/oculta secciones según rol: user = solo ver productos; admin = todo.
function applyRole() {
  const admin = isAdmin(), on = !!token;
  document.querySelectorAll('.tabs [data-tab]').forEach((b) => {
    if (b.dataset.tab !== "productos") b.hidden = !admin;
  });
  const hide = (id, h) => { const el = $(id); if (el) el.hidden = h; };
  hide("tab-clientes", !admin);
  hide("tab-pedidos", !admin);
  hide("statcard-customers", !admin);
  hide("statcard-orders", !admin);
  hide("form-product", !admin);
  hide("btn-health", !admin);
  hide("panel-salud", !admin);
  hide("tab-auditoria", !admin);
  const badge = $("role-badge");
  if (badge) {
    badge.hidden = !on;
    badge.textContent = admin ? "Admin" : "Lector";
    badge.className = "role " + (admin ? "admin" : "user");
  }
  // Si la pestaña activa quedó oculta, vuelve a productos.
  const active = document.querySelector('.tabs [data-tab].active');
  if (active && active.hidden) document.querySelector('.tabs [data-tab="productos"]').click();
}
function renderSession() {
  const on = !!token;
  $("app").hidden = !on; $("login-card").style.display = on ? "none" : "";
  const lv = $("login-view"); if (lv) lv.hidden = on;
  $("btn-logout").hidden = !on;
  $("who").textContent = on ? `Hola, ${user}` : "Sin sesión";
  applyRole();
}
async function getJSON(path) {
  const r = await fetch(`${API()}${path}`, { headers: authH() });
  if (r.status === 429) throw new Error("Límite excedido (429). Espera ~60s y reintenta.");
  if (r.status === 401) throw new Error("JWT inválido/expirado. Reingresa.");
  if (!r.ok) throw new Error(`${path} -> HTTP ${r.status}`);
  return r.status === 204 ? null : r.json();
}
async function loadProducts() {
  setStatus("Cargando productos...");
  const list = (await getJSON("/api/products/products")) || [];
  productsCache = list; loadedTabs.productos = true; renderProducts();
  setStat("stat-products", list.length); beacon("list_products", "/api/products");
}
// Buscadores locales (filtran sobre lo ya cargado, sin pedir de más al API).
// Se activan escribiendo, con Enter o con el botón Buscar de cada apartado.
let productsCache = [];
let customersCache = [];
let ordersCache = [];
let auditCache = [];
const loadedTabs = {}; // pestañas con datos ya cargados (evita pintar "0" antes del primer load)
const queryOf = (id) => { const el = $(id); return el ? el.value.trim().toLowerCase() : ""; };
const matchIdName = (q, id, ...texts) => {
  const sid = String(id).toLowerCase();
  return !q || sid === q || sid.includes(q) || texts.some((t) => String(t || "").toLowerCase().includes(q));
};
const statusCount = (label, view, total) =>
  setStatus(view.length === total ? `${label}: ${total}` : `${label}: ${view.length} de ${total}`);
function renderProducts() {
  const list = productsCache;
  const q = queryOf("q-products");
  const view = list.filter((p) => matchIdName(q, p.id, p.name));
  const qraw = ($("q-products") && $("q-products").value.trim()) || "";
  $("tb-products").innerHTML = list.length
    ? (view.length
      ? view.map(p => `<tr><td>${p.id}</td><td>${esc(p.name)}</td><td class="num">${money(p.price)}</td><td>${stockBadge(p.stock)}</td></tr>`).join("")
      : `<tr class="empty-row"><td colspan="4">Sin resultados para «${esc(qraw)}».</td></tr>`)
    : `<tr class="empty-row"><td colspan="4">Sin productos todavía. Crea el primero arriba.</td></tr>`;
  statusCount("Productos", view, list.length);
}
function renderCustomers() {
  const list = customersCache;
  const q = queryOf("q-customers");
  const view = list.filter((c) => matchIdName(q, c.id, c.name, c.email));
  const qraw = ($("q-customers") && $("q-customers").value.trim()) || "";
  $("tb-customers").innerHTML = list.length
    ? (view.length
      ? view.map(c => `<tr><td>${c.id}</td><td>${esc(c.name)}</td><td>${esc(c.email)}</td></tr>`).join("")
      : `<tr class="empty-row"><td colspan="3">Sin resultados para «${esc(qraw)}».</td></tr>`)
    : `<tr class="empty-row"><td colspan="3">Sin clientes todavía. Crea el primero arriba.</td></tr>`;
  statusCount("Clientes", view, list.length);
}
function renderOrders() {
  const list = ordersCache;
  const q = queryOf("q-orders");
  const view = list.filter((o) => matchIdName(q, o.id, o.customerId, o.status));
  const qraw = ($("q-orders") && $("q-orders").value.trim()) || "";
  $("tb-orders").innerHTML = list.length
    ? (view.length
      ? view.map(o => `<tr><td>${o.id}</td><td>${esc(o.customerId)}</td><td class="num">${money(o.total)}</td><td>${orderBadge(o.status)}</td></tr>`).join("")
      : `<tr class="empty-row"><td colspan="4">Sin resultados para «${esc(qraw)}».</td></tr>`)
    : `<tr class="empty-row"><td colspan="4">Sin pedidos todavía. Crea el primero arriba.</td></tr>`;
  statusCount("Pedidos", view, list.length);
}
function wireSearch(inputId, btnId, render) {
  const inp = $(inputId), btn = $(btnId);
  if (inp) {
    inp.addEventListener("input", render);
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); render(); } });
  }
  if (btn) btn.addEventListener("click", render);
}
async function loadCustomers() {
  setStatus("Cargando clientes...");
  const list = (await getJSON("/api/customers/customers")) || [];
  customersCache = list; loadedTabs.clientes = true; renderCustomers();
  setStat("stat-customers", list.length); beacon("list_customers", "/api/customers");
}
async function loadOrders() {
  setStatus("Cargando pedidos...");
  const list = (await getJSON("/api/orders/orders")) || [];
  ordersCache = list; loadedTabs.pedidos = true; renderOrders();
  setStat("stat-orders", list.length); beacon("list_orders", "/api/orders");
}
// Al entrar solo se carga Productos (la pestaña visible).
// Clientes/Pedidos/Auditoría cargan perezosamente al abrir su pestaña.
async function loadInitial() {
  try { await loadProducts(); }
  catch (e) {
    setStatus(e.message);
    // Token expirado/inválido al recargar la página: no dejar sesión fantasma.
    if (/401|JWT|expirad|Unauthorized/i.test(e.message)) logout();
  }
}

$("btn-login").onclick = login;
$("btn-logout").onclick = logout;
$("btn-reload-products").onclick = () => loadProducts().catch(e => setStatus(e.message));
$("btn-reload-customers").onclick = () => loadCustomers().catch(e => setStatus(e.message));
$("btn-reload-orders").onclick = () => loadOrders().catch(e => setStatus(e.message));
$("btn-create-product").onclick = async () => {
  try {
    const body = { name: $("p-name").value, price: Number($("p-price").value), stock: Number($("p-stock").value || 0) };
    const r = await fetch(`${API()}/api/products/products`, { method: "POST", headers: authH(), body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    beacon("create_product", "/api/products"); await loadProducts();
  } catch (e) { setStatus(e.message); }
};
$("btn-create-customer").onclick = async () => {
  try {
    const body = { name: $("c-name").value, email: $("c-email").value };
    const r = await fetch(`${API()}/api/customers/customers`, { method: "POST", headers: authH(), body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    beacon("create_customer", "/api/customers"); await loadCustomers();
  } catch (e) { setStatus(e.message); }
};
$("btn-create-order").onclick = async () => {
  try {
    const body = { customerId: Number($("o-customer").value), items: [{ productId: Number($("o-product").value), quantity: Number($("o-qty").value || 1), unitPrice: Number($("o-price").value) }] };
    const r = await fetch(`${API()}/api/orders/orders`, { method: "POST", headers: authH(), body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    beacon("create_order", "/api/orders"); await loadOrders();
  } catch (e) { setStatus(e.message); }
};
$("btn-health").onclick = async () => {
  try {
    const data = await getJSON("/api/health/services");
    $("health-out").textContent = JSON.stringify(data, null, 2);
    beacon("health_check", "/api/health/services");
  } catch (e) { $("health-out").textContent = e.message; }
};
async function loadAudit() {
  setStatus("Cargando auditoría...");
  const q = new URLSearchParams({ limit: $("f-audit-limit").value || "50" });
  const u = $("f-audit-user").value.trim(), a = $("f-audit-action").value;
  if (u) q.set("username", u);
  if (a) q.set("action", a);
  const list = (await getJSON(`/analytics/recent?${q}`)) || [];
  auditCache = list; loadedTabs.auditoria = true; renderAudit();
  beacon("list_audit", "/analytics/recent");
}
function renderAudit() {
  const list = auditCache;
  const fmtDate = (v) => { const d = new Date(v); return isNaN(d) ? esc(v) : d.toLocaleString("es"); };
  $("tb-audit").innerHTML = list.length
    ? list.map(r => `<tr><td>${fmtDate(r.createdAt)}</td><td>${esc(r.username)}</td><td><span class="badge neu">${esc(r.action)}</span></td><td>${esc(r.route)}</td></tr>`).join("")
    : `<tr class="empty-row"><td colspan="4">Sin eventos para esos filtros.</td></tr>`;
  setStatus(`Eventos: ${list.length}`);
}
$("btn-reload-audit").onclick = () => loadAudit().catch(e => setStatus(e.message));
["f-audit-user", "f-audit-action", "f-audit-limit"].forEach((id) => {
  const el = $(id);
  if (el) el.addEventListener("change", () => loadAudit().catch(e => setStatus(e.message)));
});
// Cambio de pestaña: muestra la sección y refresca su estado desde la caché
// (sin pedir de más al API; auditoría solo consulta si aún no tiene datos).
function switchTab(b, opts = {}) {
  document.querySelectorAll(".tabs [data-tab]").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  document.querySelectorAll(".tabs [data-tab]").forEach(x => { const s = $("tab-" + x.dataset.tab); if (s) s.hidden = x !== b; });
  if (!opts.silent) beacon("page_view", "/" + b.dataset.tab);
  const tab = b.dataset.tab;
  if (tab === "auditoria") {
    if (loadedTabs.auditoria && !opts.reload) renderAudit();
    else loadAudit().catch(e => setStatus(e.message));
  } else {
    const R = { productos: renderProducts, clientes: renderCustomers, pedidos: renderOrders };
    const L = { clientes: loadCustomers, pedidos: loadOrders };
    if (R[tab] && loadedTabs[tab]) R[tab]();
    else if (L[tab]) L[tab]().catch(e => setStatus(e.message));
  }
}
document.querySelectorAll(".tabs [data-tab]").forEach(b => b.onclick = () => switchTab(b));
renderSession();
if (token) loadInitial();
// Enter en login = Entrar
["in-user", "in-pass"].forEach((id) => {
  const el = $(id);
  if (el) el.addEventListener("keydown", (e) => { if (e.key === "Enter") login(); });
});
// Buscadores: escribiendo, con Enter o con el botón Buscar de cada apartado
wireSearch("q-products", "btn-search-products", renderProducts);
wireSearch("q-customers", "btn-search-customers", renderCustomers);
wireSearch("q-orders", "btn-search-orders", renderOrders);
// Auditoría: botón Buscar + Enter en el campo usuario (+ change en los selects)
$("btn-search-audit").onclick = () => loadAudit().catch(e => setStatus(e.message));
const fau = $("f-audit-user");
if (fau) fau.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); loadAudit().catch(err => setStatus(err.message)); }
});
