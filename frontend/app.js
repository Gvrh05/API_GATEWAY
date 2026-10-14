const API = () => {
  const u = (window.APP_CONFIG && window.APP_CONFIG.API_URL !== undefined) ? window.APP_CONFIG.API_URL : "http://127.0.0.1:3000";
  return String(u).replace(/\/$/, "");
};
const $ = (id) => document.getElementById(id);
let token = localStorage.getItem("jwt") || "";
let user = localStorage.getItem("who") || "";

function beacon(action, route) {
  fetch(`${API()}/analytics`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user || "anonymous", action, route: route || location.pathname }),
  }).catch(() => {});
}
const authH = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });
function setStatus(m) { $("status").textContent = m; }

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
    localStorage.setItem("jwt", token); localStorage.setItem("who", user);
    renderSession(); beacon("login", "/auth/login"); await loadAll();
    $("login-msg").textContent = "";
  } catch (e) { $("login-msg").textContent = "Error: " + e.message; }
}
function logout() {
  token = ""; user = "";
  localStorage.removeItem("jwt"); localStorage.removeItem("who");
  renderSession();
}
function renderSession() {
  const on = !!token;
  $("app").hidden = !on; $("login-card").style.display = on ? "none" : "";
  $("btn-logout").hidden = !on;
  $("who").textContent = on ? `Hola, ${user}` : "Sin sesión";
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
  const list = await getJSON("/api/products/products");
  $("tb-products").innerHTML = list.map(p => `<tr><td>${p.id}</td><td>${p.name}</td><td>${p.price}</td><td>${p.stock}</td></tr>`).join("");
  setStatus(`Productos: ${list.length}`); beacon("list_products", "/api/products");
}
async function loadCustomers() {
  setStatus("Cargando clientes...");
  const list = await getJSON("/api/customers/customers");
  $("tb-customers").innerHTML = list.map(c => `<tr><td>${c.id}</td><td>${c.name}</td><td>${c.email}</td></tr>`).join("");
  setStatus(`Clientes: ${list.length}`); beacon("list_customers", "/api/customers");
}
async function loadOrders() {
  setStatus("Cargando pedidos...");
  const list = await getJSON("/api/orders/orders");
  $("tb-orders").innerHTML = list.map(o => `<tr><td>${o.id}</td><td>${o.customerId}</td><td>${o.total}</td><td>${o.status}</td></tr>`).join("");
  setStatus(`Pedidos: ${list.length}`); beacon("list_orders", "/api/orders");
}
async function loadAll() { try { await loadProducts(); await loadCustomers(); await loadOrders(); } catch (e) { setStatus(e.message); } }

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
document.querySelectorAll(".tabs [data-tab]").forEach(b => b.onclick = () => {
  document.querySelectorAll(".tabs [data-tab]").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  ["productos", "clientes", "pedidos"].forEach(t => $("tab-" + t).hidden = t !== b.dataset.tab);
  beacon("page_view", "/" + b.dataset.tab);
});
renderSession();
if (token) loadAll().catch(() => logout());
