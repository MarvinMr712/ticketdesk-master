const API = "http://127.0.0.1:5000";
let selPrio = "Media";
let selPanelId = null;
let toastT;
let currentUser = null;
let tecnicosCache = null;

// ── AUTH / LOGIN ──
const ROLE_SCREENS = {
  tecnico: ["dashboard", "nuevo", "tickets", "panel", "conocimiento", "ml"],
  usuario: ["nuevo", "tickets"],
  admin: ["dashboard", "nuevo", "tickets", "conocimiento", "ml", "admin"],
  areati: ["dash-ti", "nuevo", "tickets-ti", "panel-ti", "conocimiento", "ml"]
};

function initAuth() {
  const saved = localStorage.getItem("td_user");
  if (saved) {
    try { currentUser = JSON.parse(saved); applyLogin(); return; } catch (e) { }
  }
  showLogin();
}

function showLogin() {
  document.getElementById("login-screen").classList.remove("hide");
  document.getElementById("sidebar").style.display = "none";
  document.getElementById("topbar").style.display = "none";
  document.getElementById("main").style.display = "none";
  document.getElementById("login-pass").value = "";
  setTimeout(() => document.getElementById("login-user").focus(), 50);
}

async function doLogin() {
  const username = document.getElementById("login-user").value.trim();
  const password = document.getElementById("login-pass").value;
  const errEl = document.getElementById("login-err");
  errEl.style.display = "none";
  if (!username || !password) { errEl.textContent = "⚠ Completa usuario y contraseña"; errEl.style.display = "block"; return }
  try {
    const r = await fetch(API + "/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    const d = await r.json();
    if (!r.ok) { errEl.textContent = "⛔ " + (d.error || "Error de acceso"); errEl.style.display = "block"; return }
    currentUser = d;
    localStorage.setItem("td_user", JSON.stringify(d));
    applyLogin();
  } catch (e) { errEl.textContent = "❌ No se pudo conectar al servidor. Verifica que python app.py esté corriendo."; errEl.style.display = "block" }
}

function logout() {
  localStorage.removeItem("td_user");
  currentUser = null;
  document.getElementById("login-user").value = "";
  showLogin();
}

function applyLogin() {
  document.getElementById("login-screen").classList.add("hide");
  document.getElementById("sidebar").style.display = "";
  document.getElementById("topbar").style.display = "";
  document.getElementById("main").style.display = "";

  const initials = currentUser.nombre.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  document.getElementById("user-av").textContent = initials;
  const roleLabel = { tecnico: "TI", usuario: "Usuario", admin: "Admin", areati: "Área TI" };
  document.getElementById("user-name").textContent = `${currentUser.nombre} · ${roleLabel[currentUser.rol] || currentUser.rol}`;

  const allowed = ROLE_SCREENS[currentUser.rol] || [];
  document.querySelectorAll("#sidebar > .ni").forEach(ni => {
    const m = (ni.getAttribute("onclick") || "").match(/goto\('([\w-]+)'\)/);
    ni.style.display = (m && !allowed.includes(m[1])) ? "none" : "";
  });
  let lastLabel = null, groupVisible = false;
  document.querySelectorAll("#sidebar > div").forEach(el => {
    if (el.classList.contains("slbl")) {
      if (lastLabel) lastLabel.style.display = groupVisible ? "" : "none";
      lastLabel = el; groupVisible = false;
    } else if (el.classList.contains("ni") && el.style.display !== "none") {
      groupVisible = true;
    }
  });
  if (lastLabel) lastLabel.style.display = groupVisible ? "" : "none";

  const usrInput = document.getElementById("f-usr");
  const areaSel = document.getElementById("f-area");
  if (currentUser.rol === "usuario") {
    usrInput.value = currentUser.nombre; usrInput.disabled = true;
    if (currentUser.area) { areaSel.value = currentUser.area; areaSel.disabled = true; }
  } else {
    usrInput.disabled = false; areaSel.disabled = false;
  }

  document.getElementById("th-accion").style.display = (currentUser.rol === "tecnico" || currentUser.rol === "areati") ? "" : "none";

  const defaultScreen = allowed.find(s => s.startsWith("dash") || s === "nuevo") || "nuevo";
  goto(defaultScreen);
}

// ── NAVIGATION ──
const titles = { dashboard: "Dashboard", nuevo: "Nuevo Ticket", tickets: "Mis Tickets", panel: "Panel Técnico", conocimiento: "Base de Conocimiento", ml: "Predicción ML", admin: "Admin Usuarios", "dash-ti": "Dashboard TI", "tickets-ti": "Tickets TI", "panel-ti": "Panel TI" };
function goto(s) {
  if (currentUser && ROLE_SCREENS[currentUser.rol] && !ROLE_SCREENS[currentUser.rol].includes(s)) {
    toast("⛔ No tienes acceso a esta sección");
    return;
  }
  document.querySelectorAll(".screen").forEach(x => x.classList.remove("active"));
  document.querySelectorAll(".ni").forEach(x => x.classList.remove("active"));
  document.getElementById("screen-" + s).classList.add("active");
  document.getElementById("ptitle").textContent = titles[s] || s;
  document.querySelectorAll(".ni").forEach(n => { if (n.getAttribute("onclick") && n.getAttribute("onclick").includes("'" + s + "'")) n.classList.add("active") });
  document.getElementById("det-panel").style.display = "none";
  document.getElementById("close-panel").style.display = "none";
  if (s === "dashboard") loadDash();
  if (s === "dash-ti") loadDashTI();
  if (s === "tickets") loadTickets();
  if (s === "tickets-ti") loadTicketsTI();
  if (s === "panel") loadPanel();
  if (s === "panel-ti") loadPanelTI();
  if (s === "conocimiento") loadKB();
  if (s === "ml") loadML();
  if (s === "admin") loadAdmin();
}

// ── HELPERS ──
function toast(msg) { const t = document.getElementById("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 3200) }
function catCode(c) { const m = { "ERP Corporativo": "ERP", "Red / Internet": "Red", "Hardware": "HW", "Software": "SW", "Impresoras": "Imp", "Otros": "Otros" }; return m[c] || c }
function bCat(c) { const cls = { "ERP Corporativo": "ERP", "Red / Internet": "Red", "Hardware": "HW", "Software": "SW", "Impresoras": "Imp", "Otros": "Imp" }; return `<span class="badge ${cls[c] || 'ERP'}">${catCode(c)}</span>` }
function bPrio(p) { const e = { "Alta": "🔴", "Media": "🟡", "Baja": "🟢" }; return `<span class="badge ${p}">${e[p] || ""} ${p}</span>` }
function bEst(e) { return `<span class="badge ${e.replace(" ", "-")}">${e}</span>` }
function fmtFecha(s) { if (!s) return "–"; const d = new Date(s); return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) }

// ── DASHBOARD ──
async function loadDash() {
  document.getElementById("dash-fecha").textContent = new Date().toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  try {
    const r = await fetch(API + "/api/kpis");
    const d = await r.json();
    document.getElementById("kgrid").innerHTML = `
      <div class="kcard r"><div class="kl">Tickets Abiertos</div><div class="kv">${d.abiertos}</div><div class="ks">Total: ${d.total}</div><div class="kic">🎫</div></div>
      <div class="kcard g"><div class="kl">Cerrados Hoy</div><div class="kv">${d.cerrados_hoy}</div><div class="ks">Histórico registrado</div><div class="kic">✅</div></div>
      <div class="kcard b"><div class="kl">Tpo. Prom. Resolución</div><div class="kv">${d.tpo_prom_horas}h</div><div class="ks">Promedio histórico</div><div class="kic">⏱</div></div>
      <div class="kcard y"><div class="kl">Satisfacción</div><div class="kv">${d.satisfaccion}%</div><div class="ks">Encuestas piloto</div><div class="kic">⭐</div></div>`;
    const cats = d.por_categoria; const maxv = Math.max(...cats.map(c => c.total), 1);
    const colors = ["#3949ab", "#0277bd", "#7b1fa2", "#2e7d32", "#e65100", "#795548"];
    document.getElementById("chart-cat").innerHTML = cats.map((c, i) => `
      <div class="bc">
        <div class="bv">${c.total}</div>
        <div class="bar" style="height:${Math.max(8, c.total / maxv * 130)}px;background:${colors[i % colors.length]}"></div>
        <div class="bl">${catCode(c.categoria)}</div>
      </div>`).join("");
    const tecs = d.por_tecnico; const maxt = Math.max(...tecs.map(t => t.total), 1);
    document.getElementById("chart-tec").innerHTML = tecs.map(t => `
      <div class="hr">
        <div class="hn">${t.tecnico.split(" ")[0]} ${(t.tecnico.split(" ")[1] || "").charAt(0)}.</div>
        <div class="ht"><div class="hf" style="width:${Math.round(t.total / maxt * 100)}%"></div></div>
        <div class="hnum">${t.total}</div>
      </div>`).join("");
    document.getElementById("dash-tbl").innerHTML = d.recientes.map(t => `
      <tr onclick="goto('tickets')">
        <td><strong>${t.numero}</strong></td><td>${t.descripcion.substring(0, 45)}</td>
        <td>${bCat(t.categoria)}</td><td>${bPrio(t.prioridad)}</td><td>${bEst(t.estado)}</td>
        <td>${t.tecnico || "–"}</td><td>${fmtFecha(t.fecha_creacion)}</td>
      </tr>`).join("");
    const pend = d.por_estado.find(e => e.estado === "Pendiente" || e.estado === "En Proceso");
    document.getElementById("badge").textContent = pend ? pend.total : 0;
  } catch (e) { document.getElementById("kgrid").innerHTML = `<div style="color:var(--red);padding:20px;grid-column:1/-1">❌ Error conectando al servidor Flask.<br>Asegúrate de que <strong>python app.py</strong> esté corriendo en el puerto 5000.</div>` }
}

// ── NUEVO TICKET ──
function setPrio(v, el) { selPrio = v; document.querySelectorAll(".pb").forEach(b => b.classList.remove("sel")); el.classList.add("sel") }

async function onCatChange() {
  const cat = document.getElementById("f-cat").value;
  if (!cat) return;
  const r = await fetch(`${API}/api/sugerencia?categoria=${encodeURIComponent(cat)}`);
  const d = await r.json();
  if (d.encontrado) {
    document.getElementById("sug-txt").textContent = `"${d.sugerencia.titulo}" (reutilizado ${d.sugerencia.usos} veces)`;
    document.getElementById("ml-sug").style.display = "block";
  } else { document.getElementById("ml-sug").style.display = "none" }
  onAreaChange();
}

async function onAreaChange() {
  const cat = document.getElementById("f-cat").value;
  const area = document.getElementById("f-area").value;
  if (!cat || !area) return;
  const r = await fetch(API + "/api/ml/predecir_rf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoria: cat, area }) });
  const d = await r.json();
  document.getElementById("knn-hint").textContent = `🌲 Random Forest recomienda prioridad: ${d.prioridad_predicha} (confianza ${d.confianza})`;
  const r2 = await fetch(API + "/api/ml/predecir_tiempo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoria: cat, prioridad: selPrio }) });
  const d2 = await r2.json();
  document.getElementById("time-txt").textContent = `El modelo estima resolución en ~${d2.horas_estimadas} horas para esta categoría y prioridad`;
  document.getElementById("ml-time").style.display = "block";
}

function onFileChange() {
  const f = document.getElementById("f-file").files[0];
  const dz = document.getElementById("dz-label");
  const placeholder = `📎 Arrastra archivos aquí o haz clic<br><span style="font-size:11px;opacity:.7">PNG, JPG, PDF – máx. 5MB</span>`;
  if (!f) { dz.innerHTML = placeholder; return }
  if (f.size > 5 * 1024 * 1024) {
    toast("⚠ El archivo supera el máximo de 5MB");
    document.getElementById("f-file").value = "";
    dz.innerHTML = placeholder;
    return;
  }
  dz.innerHTML = `📎 <strong>${f.name}</strong><br><span style="font-size:11px;opacity:.7">${(f.size / 1024).toFixed(0)} KB — clic para cambiar</span>`;
}

async function enviarTicket() {
  const desc = document.getElementById("f-desc").value;
  const cat = document.getElementById("f-cat").value;
  const area = document.getElementById("f-area").value;
  const usr = document.getElementById("f-usr").value;
  if (!desc.trim() || !cat || !area) { toast("⚠ Completa los campos obligatorios (*)"); return }
  const btn = document.getElementById("btn-enviar");
  btn.innerHTML = `<span class="spin"></span> Enviando...`; btn.disabled = true;
  try {
    const fd = new FormData();
    fd.append("descripcion", desc); fd.append("categoria", cat); fd.append("area", area);
    fd.append("sistema", document.getElementById("f-sis").value);
    fd.append("prioridad", selPrio); fd.append("usuario", usr);
    const file = document.getElementById("f-file").files[0];
    if (file) fd.append("archivo", file);
    const r = await fetch(API + "/api/tickets", { method: "POST", body: fd });
    const d = await r.json();
    if (!r.ok) { toast("⚠ " + (d.error || "No se pudo crear el ticket")); btn.innerHTML = "✅ Enviar Ticket"; btn.disabled = false; return }
    document.getElementById("c-num").textContent = d.numero;
    document.getElementById("c-time").textContent = d.prediccion_ml?.texto || "";
    document.getElementById("cov").classList.add("show");
    ["f-desc", "f-sis"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("f-cat").value = "";
    document.getElementById("f-file").value = "";
    onFileChange();
    if (!(currentUser && currentUser.rol === "usuario" && currentUser.area)) {
      document.getElementById("f-area").value = "";
    }
    document.getElementById("ml-sug").style.display = "none"; document.getElementById("ml-time").style.display = "none";
    document.getElementById("knn-hint").textContent = "";
    selPrio = "Media"; document.querySelectorAll(".pb").forEach(b => b.classList.remove("sel"));
    document.querySelector(".pb.Media").classList.add("sel");
  } catch (e) { toast("❌ Error al enviar. Verifica que Flask esté corriendo.") }
  btn.innerHTML = "✅ Enviar Ticket"; btn.disabled = false;
}
function closeCov() { document.getElementById("cov").classList.remove("show"); goto("tickets") }

// ── MIS TICKETS ──
async function loadTickets() {
  const est = document.getElementById("f-estado").value;
  const params = new URLSearchParams();
  if (est) params.set("estado", est);
  if (currentUser && currentUser.rol === "usuario") params.set("usuario", currentUser.nombre);
  if (currentUser && currentUser.rol === "tecnico") params.set("tecnico", currentUser.nombre);
  const qs = params.toString();
  const url = API + "/api/tickets" + (qs ? `?${qs}` : "");
  const r = await fetch(url);
  let tickets = await r.json();
  const esTecnico = currentUser && currentUser.rol === "tecnico";
  document.getElementById("tbl-tickets").innerHTML = tickets.map(t => `
    <tr id="row-${t.id}" onclick="showDet(${t.id})">
      <td><strong>${t.numero}</strong></td><td>${t.descripcion.substring(0, 45)}</td>
      <td>${bCat(t.categoria)}</td><td>${bPrio(t.prioridad)}</td><td>${bEst(t.estado)}</td>
      <td>${t.tecnico || "–"}</td><td>${fmtFecha(t.fecha_creacion)}</td>
      ${esTecnico ? `<td onclick="event.stopPropagation();">
        ${t.estado === "Escalado" ? `<span class="badge Escalado" style="font-size:12px">⬆ Escalado</span>` :
          t.estado === "Resuelto" ? `<span class="badge Resuelto" style="font-size:12px">✅ Atendido</span>` :
          `<button class="btn bp bsm" onclick="openCloseFromTickets(${t.id},'${t.numero}','${t.descripcion.replace(/'/g, "\\'")}','${t.estado}','${t.prioridad}','${t.categoria}')">Atender</button>`}
      </td>` : ""}
    </tr>
  `).join("");
  const pend = tickets.filter(t => t.estado === "Pendiente" || t.estado === "En Proceso");
  document.getElementById("badge").textContent = pend.length;
}

// ── PANEL TÉCNICO ──
async function loadPanel() {
  document.getElementById("panel-tec-nombre").textContent = currentUser ? currentUser.nombre : "";
  const r = await fetch(API + "/api/kpis?tecnico=" + encodeURIComponent(currentUser ? currentUser.nombre : ""));
  const d = await r.json();
  const byEst = Object.fromEntries(d.por_estado.map(e => [e.estado, e.total]));
  document.getElementById("p-pend").textContent = byEst["Pendiente"] || 0;
  document.getElementById("p-proc").textContent = byEst["En Proceso"] || 0;
  document.getElementById("p-cerr").textContent = d.cerrados_hoy;
  document.getElementById("p-alta").textContent = 0;

  const r2 = await fetch(API + "/api/tickets?tecnico=" + encodeURIComponent(currentUser ? currentUser.nombre : "") + "&limit=50");
  const tickets = await r2.json();
  const open = tickets.filter(t => t.estado !== "Resuelto");
  document.getElementById("p-alta").textContent = open.filter(t => t.prioridad === "Alta").length;

  if (!tecnicosCache) {
    try {
      const rt = await fetch(API + "/api/tecnicos");
      tecnicosCache = await rt.json();
    } catch (e) { tecnicosCache = [] }
  }

  document.getElementById("tbl-panel").innerHTML = open.map(t => `
    <tr>
      <td><strong>${t.numero}</strong></td><td>${t.descripcion.substring(0, 45)}</td>
      <td>${bCat(t.categoria)}</td><td>${bPrio(t.prioridad)}</td><td>${bEst(t.estado)}</td>
      <td>
        <select id="tec-select-${t.id}" style="font-size:12px;padding:4px;border-radius:4px;border:1px solid var(--border);">
          ${tecnicosCache.map(tec => `<option value="${tec.nombre}" ${t.tecnico === tec.nombre ? 'selected' : ''}>${tec.nombre}</option>`).join('')}
        </select>
        <button class="btn bp bsm" onclick="asignarTicket(${t.id})">Asignar</button>
      </td>
    </tr>
  `).join("");
}

// ── FILTROS ──
function filterTickets() {
  const input = document.getElementById("search-tickets");
  const filter = input.value.toLowerCase();
  const rows = document.querySelectorAll("#tbl-tickets tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? "" : "none";
  });
}
function filterPanel() {
  const input = document.getElementById("search-panel");
  const filter = input.value.toLowerCase();
  const rows = document.querySelectorAll("#tbl-panel tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? "" : "none";
  });
}

// ── ASIGNAR ──
async function asignarTicket(id) {
  const select = document.getElementById("tec-select-" + id);
  const tecnico = select.value;
  if (!tecnico) { toast("⚠ Selecciona un técnico"); return }
  const r = await fetch(`${API}/api/tickets/${id}/asignar`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tecnico })
  });
  const d = await r.json();
  toast("✅ " + (d.mensaje || d.error));
  loadPanel();
}

// ── ATENDER DESDE MIS TICKETS ──
function openCloseFromTickets(id, num, desc, estadoActual, prioridadActual, categoriaActual) {
  selPanelId = id;
  document.getElementById("cp-id").textContent = "Atendiendo: " + num + " — " + desc;
  document.getElementById("t-diag").value = "";
  document.getElementById("t-sol").value = "";
  document.getElementById("t-estado-sel").value = (estadoActual === "En Proceso") ? "En Proceso" : "Pendiente";
  document.getElementById("t-prioridad-sel").value = prioridadActual || "Media";
  document.getElementById("t-categoria-sel").value = categoriaActual || "ERP Corporativo";
  cargarTecnicosSelect();
  document.getElementById("escalar-row").style.display = (currentUser && currentUser.rol === "areati") ? "none" : "";
  document.getElementById("t-tecnico-sel").style.display = "none";
  document.getElementById("close-panel").style.display = "block";
  document.getElementById("close-panel").scrollIntoView({ behavior: "smooth", block: "nearest" });
  document.getElementById("det-panel").style.display = "none";
}

function openClose(id, num, desc, estadoActual) {
  openCloseFromTickets(id, num, desc, estadoActual, "Media", "ERP Corporativo");
}

async function cargarTecnicosSelect() {
  if (!tecnicosCache) {
    try {
      const r = await fetch(API + "/api/tecnicos");
      tecnicosCache = await r.json();
    } catch (e) { tecnicosCache = [] }
  }
  const sel = document.getElementById("t-tecnico-sel");
  sel.innerHTML = tecnicosCache.map(t => `<option value="${t.nombre}">${t.nombre}</option>`).join("")
    || `<option value="Area TI">Area TI</option>`;
}

// ── ACCIONES DEL PANEL DE CIERRE ──
async function actualizarEstado() {
  const nuevoEstado = document.getElementById("t-estado-sel").value;
  const nuevaPrioridad = document.getElementById("t-prioridad-sel").value;
  const nuevaCategoria = document.getElementById("t-categoria-sel").value;
  const payload = {};
  if (nuevoEstado) payload.estado = nuevoEstado;
  if (nuevaPrioridad) payload.prioridad = nuevaPrioridad;
  if (nuevaCategoria) payload.categoria = nuevaCategoria;

  const r = await fetch(`${API}/api/tickets/${selPanelId}/estado`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const d = await r.json();
  toast("💾 " + (d.mensaje || d.error));
  loadPanel();
  if (document.getElementById("screen-tickets").classList.contains("active")) loadTickets();
}

async function cerrarTicket() {
  const sol = document.getElementById("t-sol").value.trim();
  if (!sol) { toast("⚠ Ingresa la solución aplicada"); return }
  const r = await fetch(`${API}/api/tickets/${selPanelId}/cerrar`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ diagnostico: document.getElementById("t-diag").value, solucion: sol })
  });
  const d = await r.json();
  toast("✅ " + d.mensaje);
  document.getElementById("close-panel").style.display = "none";
  loadPanel();
  if (document.getElementById("screen-tickets").classList.contains("active")) loadTickets();
}

async function escalarTicket() {
  const rUsers = await fetch(API + "/api/usuarios");
  const users = await rUsers.json();
  const tiMembers = users.filter(u => u.rol === "areati");
  const elegido = tiMembers[Math.floor(Math.random() * tiMembers.length)];
  if (!elegido) { toast("⚠ No hay personal de Área TI disponible"); return }
  const tecnico = elegido.nombre;
  const r = await fetch(`${API}/api/tickets/${selPanelId}/escalar`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tecnico })
  });
  const d = await r.json();
  toast("⬆ " + d.mensaje);
  document.getElementById("close-panel").style.display = "none";
  loadPanel();
  if (document.getElementById("screen-tickets").classList.contains("active")) loadTickets();
}

// ── DETALLE ──
async function showDet(id) {
  document.querySelectorAll("#tbl-tickets tr").forEach(r => r.classList.remove("sel"));
  document.getElementById("row-" + id)?.classList.add("sel");
  const r = await fetch(`${API}/api/tickets/${id}`); const d = await r.json();
  const t = d.ticket;
  document.getElementById("det-id").textContent = t.numero + " — " + t.descripcion;
  document.getElementById("det-est").innerHTML = bEst(t.estado);
  document.getElementById("det-desc").textContent = t.descripcion;
  document.getElementById("det-tec").textContent = t.tecnico || "Por asignar";
  document.getElementById("det-cat").innerHTML = bCat(t.categoria);
  document.getElementById("det-prio").innerHTML = bPrio(t.prioridad);
  document.getElementById("det-adj").innerHTML = t.adjunto
    ? `<a href="${API}/uploads/${t.adjunto}" target="_blank" style="color:var(--blue);font-weight:600">📎 Ver archivo</a>`
    : `<span style="color:var(--muted)">— sin adjunto —</span>`;
  const steps = ["Pendiente", "En Proceso", "Resuelto"];
  const cur = t.estado === "Escalado" ? 1 : steps.indexOf(t.estado);
  document.getElementById("det-tl").innerHTML = steps.map((s, i) => `
    ${i > 0 ? `<div class="tlln ${i <= cur ? 'done' : ''}"></div>` : ""}
    <div class="tls"><div class="tld ${i < cur ? 'done' : ''} ${i === cur && t.estado !== 'Escalado' ? 'active' : ''}"></div><div class="tll">${s}</div></div>`).join("") +
    (t.estado === "Escalado" ? `<div class="tlln done"></div><div class="tls"><div class="tld done"></div><div class="tll">Escalado</div></div>` : "");
  document.getElementById("det-hist").innerHTML = d.historial.map(h => `
    <div class="hi"><span class="ts">${fmtFecha(h.fecha)}</span><span>${h.evento}</span></div>`).join("") || "<div style='color:var(--muted);font-size:13px'>Sin historial</div>";
  document.getElementById("det-panel").style.display = "block";
  document.getElementById("det-panel").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ── BASE CONOCIMIENTO ──
async function loadKB() {
  const q = document.getElementById("kb-q").value;
  const cat = document.getElementById("kb-cat").value;
  const r = await fetch(`${API}/api/conocimiento?q=${encodeURIComponent(q)}&categoria=${encodeURIComponent(cat)}`);
  const items = await r.json();
  document.getElementById("kb-list").innerHTML = items.length === 0
    ? `<div style="color:var(--muted);text-align:center;padding:40px">No se encontraron resultados</div>`
    : items.map(k => `
    <div class="kbcard">
      <div class="kbhead">
        <strong style="font-size:15px;color:var(--navy)">${k.titulo}</strong>
        ${bCat(k.categoria)}
        <span class="chip" style="margin-left:auto">🔁 Reutilizado ${k.usos} veces</span>
      </div>
      <div class="kbmute">${k.descripcion || ""}</div>
      <div class="kbsol">${k.solucion}</div>
    </div>`).join("");
}

// ── FEATURES (X) ──
function getSelectedFeatures() {
  const ids = ["feat-categoria", "feat-area", "feat-prioridad", "feat-sistema", "feat-mes"];
  const names = ["Categoría", "Área", "Prioridad", "Sistema", "Mes"];
  const selected = [];
  ids.forEach((id, i) => {
    if (document.getElementById(id).checked) selected.push(names[i]);
  });
  return selected;
}

function onFeatureChange() {
  const sel = getSelectedFeatures();
  document.getElementById("feat-info").textContent = "Features actuales: " + (sel.length ? sel.join(", ") : "Ninguna (usará Categoría por defecto)");
}

// ── MACHINE LEARNING ──
async function loadML() {
  const raw = getSelectedFeatures();
  const features = raw.length ? raw : null;
  document.getElementById("ml-content").innerHTML = `<div class="loading" style="grid-column:1/-1">⏳ Entrenando modelos...</div>`;
  try {
    const body = {
      features_clasif: features,
      features_reg: features ? (features.includes("Prioridad") || features.includes("Categoría") || features.includes("Mes") ? features : ["Categoría", "Prioridad", "Mes"]) : null,
      features_rf: features
    };
    const r = await fetch(API + "/api/ml/resumen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    const ac = d.arbol_clasificacion;
    const ar = d.arbol_regresion;
    const rf = d.random_forest;

    document.getElementById("ml-content").innerHTML = `
      <!-- ÁRBOL CLASIFICACIÓN -->
      <div class="mlcard" style="border-top:3px solid #7b1fa2">
        <div class="mltitle" style="color:#7b1fa2">🌳 Árbol de Clasificación — Prioridad del Ticket</div>
        <div class="mlsub">DecisionTreeClassifier · Features: ${(ac.features_usadas||[]).join(", ")}</div>
        <div class="metric"><span class="mk">Accuracy Train</span><span class="mv" style="color:#7b1fa2">${ac.accuracy_train_pct}</span></div>
        <div class="metric"><span class="mk">Accuracy Test</span><span class="mv">${ac.accuracy_test_pct}</span></div>
        <div class="metric"><span class="mk">Profundidad máxima</span><span class="mv">${ac.max_depth}</span></div>
        <div class="metric"><span class="mk">Clases</span><span class="mv">${ac.clases?.join(", ")}</span></div>
        <div style="margin-top:10px">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Importancia de variables</div>
          ${ac.importancia_features?.map(f => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span style="font-size:12px;width:80px">${f.feature}</span>
              <div style="flex:1;background:#edf1f6;border-radius:10px;height:12px;overflow:hidden">
                <div style="height:100%;background:#7b1fa2;border-radius:10px;width:${Math.round(f.importancia * 100)}%"></div>
              </div>
              <span style="font-size:12px;font-weight:700">${Math.round(f.importancia * 100)}%</span>
            </div>`).join("") || ""}
        </div>
        <div style="margin-top:12px">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Estructura del Árbol (primeros nodos)</div>
          <pre style="font-size:10px;background:#fafafa;padding:10px;border-radius:6px;overflow-x:auto;border:1px solid #edf1f6;line-height:1.6">${ac.arbol_texto?.join("\n") || ""}</pre>
        </div>
      </div>
      <!-- ÁRBOL REGRESIÓN -->
      <div class="mlcard" style="border-top:3px solid #e65100">
        <div class="mltitle" style="color:#e65100">🌲 Árbol de Regresión — Tiempo de Resolución</div>
        <div class="mlsub">DecisionTreeRegressor · Features: ${(ar.features_usadas||[]).join(", ")}</div>
        <div class="metric"><span class="mk">MAE Train</span><span class="mv" style="color:#e65100">${ar.mae_train} horas</span></div>
        <div class="metric"><span class="mk">MAE Test</span><span class="mv">${ar.mae_test} horas</span></div>
        <div class="metric"><span class="mk">R² Train</span><span class="mv">${ar.r2_train}</span></div>
        <div class="metric"><span class="mk">R² Test</span><span class="mv">${ar.r2_test}</span></div>
        <div class="metric"><span class="mk">Profundidad máxima</span><span class="mv">${ar.max_depth}</span></div>
        <div style="margin-top:10px">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Importancia de variables</div>
          ${ar.importancia_features?.map(f => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span style="font-size:12px;width:80px">${f.feature}</span>
              <div style="flex:1;background:#edf1f6;border-radius:10px;height:12px;overflow:hidden">
                <div style="height:100%;background:#e65100;border-radius:10px;width:${Math.round(f.importancia * 100)}%"></div>
              </div>
              <span style="font-size:12px;font-weight:700">${Math.round(f.importancia * 100)}%</span>
            </div>`).join("") || ""}
        </div>
        <div style="margin-top:12px;overflow-x:auto">
          <table style="font-size:11px;width:100%">
            <thead><tr><th>Categoría</th><th>Prioridad</th><th>Horas estimadas</th></tr></thead>
            <tbody>${ar.comparacion?.map(r => `
              <tr><td>${r.categoria}</td><td>${bPrio(r.prioridad)}</td>
              <td style="font-weight:700;color:#e65100">${r.horas_arbol}h</td></tr>`).join("") || ""}</tbody>
          </table>
        </div>
      </div>
      <!-- RANDOM FOREST -->
      <div class="mlcard" style="border-top:3px solid #2e7d32;grid-column:1/-1">
        <div class="mltitle" style="color:#2e7d32">🌿 Random Forest — Ensamble de Árboles</div>
        <div class="mlsub">RandomForestClassifier · 100 árboles · Features: ${(rf.features_usadas||[]).join(", ")}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div>
            <div class="metric"><span class="mk">RF Accuracy Train</span><span class="mv" style="color:#2e7d32;font-size:20px">${rf.acc_rf_train_pct}</span></div>
            <div class="metric"><span class="mk">RF Accuracy Test</span><span class="mv">${rf.acc_rf_test_pct}</span></div>
            <div class="metric"><span class="mk">Árbol Accuracy Train</span><span class="mv">${rf.acc_dt_train_pct}</span></div>
            <div class="metric"><span class="mk">Árbol Accuracy Test</span><span class="mv">${rf.acc_dt_test_pct}</span></div>
            <div class="metric"><span class="mk">Mejora del RF vs Árbol</span><span class="mv" style="color:${rf.mejora_pct >= 0 ? '#2e7d32' : '#c0392b'}">${rf.mejora_pct >= 0 ? '+' : ''}${rf.mejora_pct}%</span></div>
            <div class="metric"><span class="mk">N° de árboles</span><span class="mv">${rf.n_estimadores}</span></div>
            <div class="metric"><span class="mk">Profundidad máxima</span><span class="mv">${rf.max_depth}</span></div>
            <div style="margin-top:12px;font-size:12px;color:var(--muted);background:#f7fdf7;padding:10px;border-radius:8px;border-left:3px solid #2e7d32">
              💡 <strong>¿Por qué Random Forest es mejor?</strong><br>
              En lugar de confiar en un solo árbol, entrena 100 árboles distintos y cada uno vota.
              La clase con más votos gana. Esto reduce el sobreajuste y mejora la generalización.
            </div>
            <div style="margin-top:12px;font-size:12px;color:var(--muted);background:#f0f7ff;padding:10px;border-radius:8px;border-left:3px solid #1565c0">
              💡 <strong>Comparativa Train vs Test:</strong><br>
              Si el accuracy en Train es mucho mayor que en Test, el modelo está sobreajustado (overfitting).
              Si ambos son similares, el modelo generaliza bien.
            </div>
            <div style="margin-top:10px">
              <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Importancia de variables</div>
              ${rf.importancia_features?.map(f => `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                  <span style="font-size:12px;width:80px">${f.feature}</span>
                  <div style="flex:1;background:#edf1f6;border-radius:10px;height:12px;overflow:hidden">
                    <div style="height:100%;background:#2e7d32;border-radius:10px;width:${Math.round(f.importancia * 100)}%"></div>
                  </div>
                  <span style="font-size:12px;font-weight:700">${Math.round(f.importancia * 100)}%</span>
                </div>`).join("") || ""}
            </div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:8px">RF vs Árbol — Predicciones comparadas</div>
            <table style="font-size:11px;width:100%">
              <thead><tr><th>Categoría / Área</th><th>RF 🌿</th><th>Árbol 🌳</th></tr></thead>
              <tbody>${rf.predicciones_demo?.map(d => `
                <tr><td style="font-size:10px">${d.categoria.replace(" Corporativo","").replace(" / Internet","")} / ${d.area.split(" ")[0]}</td>
                <td>${bPrio(d.prioridad_rf)} <span style="font-size:10px;color:var(--muted)">${d.confianza_rf}</span></td>
                <td>${bPrio(d.prioridad_dt)}</td></tr>`).join("") || ""}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  } catch (e) { console.error(e); document.getElementById("ml-content").innerHTML = `<div style="color:var(--red);padding:20px;grid-column:1/-1">❌ Error conectando al servidor Flask.</div>` }
}

async function runPredictor() {
  const cat = document.getElementById("ml-cat").value;
  const area = document.getElementById("ml-area").value;
  const prio = document.getElementById("ml-prio").value;
  const [r1, r2, r3] = await Promise.all([
    fetch(API + "/api/ml/predecir_tiempo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoria: cat, prioridad: prio }) }),
    fetch(API + "/api/ml/predecir_arbol", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoria: cat, area, prioridad: prio }) }),
    fetch(API + "/api/ml/predecir_rf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoria: cat, area }) }),
  ]);
  const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
  document.getElementById("pr-time").textContent = d1.horas_estimadas;
  document.getElementById("pr-prio-arbol").textContent = d2.prioridad_predicha;
  document.getElementById("pr-conf-arbol").textContent = " (" + d2.confianza + ")";
  document.getElementById("pr-prio").textContent = d3.prioridad_predicha;
  document.getElementById("pr-conf").textContent = " (" + d3.confianza + ")";
  document.getElementById("pred-result").style.display = "block";
}

// ── ADMIN ──
async function loadAdmin() {
  const r = await fetch(API + "/api/usuarios");
  const users = await r.json();
  document.getElementById("tbl-usuarios").innerHTML = users.map(u => `
    <tr>
      <td>${u.username}</td>
      <td>${u.nombre}</td>
      <td><span class="badge ${u.rol}">${u.rol}</span></td>
      <td>${u.area || "—"}</td>
      <td>
        <button class="btn bp bsm" onclick="editarUsuario('${u.tabla}',${u.id},'${u.nombre.replace(/'/g, "\\'")}')">✏️</button>
        ${u.username !== "admin" ? `<button class="btn br bsm" onclick="eliminarUsuario('${u.tabla}',${u.id},'${u.nombre.replace(/'/g, "\\'")}')">🗑</button>` : "—"}
      </td>
    </tr>
  `).join("");
}

let editandoUsuario = null;

async function editarUsuario(tabla, id, nombre) {
  editandoUsuario = { tabla, id };
  document.getElementById("adm-edit-nombre").value = nombre;
  document.getElementById("adm-edit-pass").value = "";
  document.getElementById("adm-edit-area").value = "";
  document.getElementById("adm-edit-box").style.display = "block";
  document.getElementById("adm-edit-err").style.display = "none";
}

async function guardarEdicion() {
  const errEl = document.getElementById("adm-edit-err");
  errEl.style.display = "none";
  const data = {};
  const nombre = document.getElementById("adm-edit-nombre").value.trim();
  const password = document.getElementById("adm-edit-pass").value;
  const area = document.getElementById("adm-edit-area").value.trim();
  if (nombre) data.nombre = nombre;
  if (password) data.password = password;
  if (area) data.area = area;
  if (Object.keys(data).length === 0) { errEl.textContent = "⚠ Cambia al menos un campo"; errEl.style.display = "block"; return }
  try {
    const r = await fetch(API + "/api/usuarios/" + editandoUsuario.tabla + "/" + editandoUsuario.id, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    });
    const d = await r.json();
    if (!r.ok) { errEl.textContent = "⛔ " + (d.error || "Error"); errEl.style.display = "block"; return }
    document.getElementById("adm-edit-box").style.display = "none";
    editandoUsuario = null;
    toast("✅ Usuario actualizado");
    loadAdmin();
  } catch (e) { errEl.textContent = "❌ Error de conexión"; errEl.style.display = "block" }
}

async function crearUsuario() {
  const errEl = document.getElementById("adm-err");
  errEl.style.display = "none";
  const data = {
    username: document.getElementById("adm-username").value.trim(),
    password: document.getElementById("adm-password").value,
    nombre: document.getElementById("adm-nombre").value.trim(),
    rol: document.getElementById("adm-rol").value,
    area: document.getElementById("adm-area").value.trim() || null,
  };
  if (!data.username || !data.password || !data.nombre) { errEl.textContent = "⚠ Completa usuario, contraseña y nombre"; errEl.style.display = "block"; return }
  try {
    const r = await fetch(API + "/api/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const d = await r.json();
    if (!r.ok) { errEl.textContent = "⛔ " + (d.error || "Error"); errEl.style.display = "block"; return }
    document.getElementById("adm-username").value = "";
    document.getElementById("adm-password").value = "";
    document.getElementById("adm-nombre").value = "";
    document.getElementById("adm-area").value = "";
    toast("✅ Usuario creado");
    loadAdmin();
  } catch (e) { errEl.textContent = "❌ Error de conexión"; errEl.style.display = "block" }
}

async function eliminarUsuario(tabla, id, nombre) {
  if (!confirm("¿Eliminar a " + nombre + "?")) return;
  const r = await fetch(API + "/api/usuarios/" + tabla + "/" + id, { method: "DELETE" });
  const d = await r.json();
  toast(d.mensaje || d.error);
  loadAdmin();
}

// ── DASHBOARD TI ──
async function loadDashTI() {
  document.getElementById("dash-fecha-ti").textContent = new Date().toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  try {
    const r = await fetch(API + "/api/kpis?equipo=Area+TI");
    const d = await r.json();
    document.getElementById("kgrid-ti").innerHTML = `
      <div class="kcard r"><div class="kl">Tickets Abiertos</div><div class="kv">${d.abiertos}</div><div class="ks">Total: ${d.total}</div><div class="kic">🎫</div></div>
      <div class="kcard g"><div class="kl">Cerrados Hoy</div><div class="kv">${d.cerrados_hoy}</div><div class="ks">Histórico registrado</div><div class="kic">✅</div></div>
      <div class="kcard b"><div class="kl">Tpo. Prom. Resolución</div><div class="kv">${d.tpo_prom_horas}h</div><div class="ks">Promedio histórico</div><div class="kic">⏱</div></div>
      <div class="kcard y"><div class="kl">Satisfacción</div><div class="kv">${d.satisfaccion}%</div><div class="ks">Encuestas piloto</div><div class="kic">⭐</div></div>`;
    const cats = d.por_categoria; const maxv = Math.max(...cats.map(c => c.total), 1);
    const colors = ["#3949ab", "#0277bd", "#7b1fa2", "#2e7d32", "#e65100", "#795548"];
    document.getElementById("chart-cat-ti").innerHTML = cats.map((c, i) => `
      <div class="bc">
        <div class="bv">${c.total}</div>
        <div class="bar" style="height:${Math.max(8, c.total / maxv * 130)}px;background:${colors[i % colors.length]}"></div>
        <div class="bl">${catCode(c.categoria)}</div>
      </div>`).join("");
    const tecs = d.por_tecnico; const maxt = Math.max(...tecs.map(t => t.total), 1);
    document.getElementById("chart-tec-ti").innerHTML = tecs.map(t => `
      <div class="hr">
        <div class="hn">${t.tecnico.split(" ")[0]} ${(t.tecnico.split(" ")[1] || "").charAt(0)}.</div>
        <div class="ht"><div class="hf" style="width:${Math.round(t.total / maxt * 100)}%"></div></div>
        <div class="hnum">${t.total}</div>
      </div>`).join("");
    document.getElementById("dash-tbl-ti").innerHTML = d.recientes.map(t => `
      <tr>
        <td><strong>${t.numero}</strong></td><td>${t.descripcion.substring(0, 45)}</td>
        <td>${bCat(t.categoria)}</td><td>${bPrio(t.prioridad)}</td><td>${bEst(t.estado)}</td>
        <td>${t.tecnico || "–"}</td><td>${fmtFecha(t.fecha_creacion)}</td>
      </tr>`).join("");
    const pend = d.por_estado.find(e => e.estado === "Pendiente" || e.estado === "En Proceso");
    document.getElementById("badge-ti").textContent = pend ? pend.total : 0;
  } catch (e) { document.getElementById("kgrid-ti").innerHTML = `<div style="color:var(--red);padding:20px;grid-column:1/-1">❌ Error</div>` }
}

// ── TICKETS TI ──
async function loadTicketsTI() {
  const est = document.getElementById("f-estado-ti").value;
  const params = new URLSearchParams();
  if (est) params.set("estado", est);
  params.set("equipo", "Area TI");
  const r = await fetch(API + "/api/tickets?" + params.toString());
  const tickets = await r.json();
  document.getElementById("tbl-tickets-ti").innerHTML = tickets.map(t => `
    <tr>
      <td><strong>${t.numero}</strong></td><td>${t.descripcion.substring(0, 45)}</td>
      <td>${bCat(t.categoria)}</td><td>${bPrio(t.prioridad)}</td><td>${bEst(t.estado)}</td>
      <td>${t.tecnico || "–"}</td><td>${fmtFecha(t.fecha_creacion)}</td>
      <td>
        ${t.estado === "Resuelto" ? `<span class="badge Resuelto" style="font-size:12px">✅ Atendido</span>` :
          `<button class="btn bp bsm" onclick="openCloseFromTickets(${t.id},'${t.numero}','${t.descripcion.replace(/'/g, "\\'")}','${t.estado}','${t.prioridad}','${t.categoria}')">Atender</button>`}
      </td>
    </tr>
  `).join("");
  const pend = tickets.filter(t => t.estado === "Pendiente" || t.estado === "En Proceso");
  document.getElementById("badge-ti").textContent = pend.length;
}
function filterTicketsTI() {
  const input = document.getElementById("search-tickets-ti");
  const filter = input.value.toLowerCase();
  const rows = document.querySelectorAll("#tbl-tickets-ti tr");
  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(filter) ? "" : "none";
  });
}

// ── PANEL TI ──
async function loadPanelTI() {
  document.getElementById("panel-ti-nombre").textContent = currentUser ? currentUser.nombre : "";
  const r = await fetch(API + "/api/kpis?equipo=Area+TI");
  const d = await r.json();
  const byEst = Object.fromEntries(d.por_estado.map(e => [e.estado, e.total]));
  document.getElementById("pt-pend").textContent = byEst["Pendiente"] || 0;
  document.getElementById("pt-proc").textContent = byEst["En Proceso"] || 0;
  document.getElementById("pt-cerr").textContent = d.cerrados_hoy;
  document.getElementById("pt-alta").textContent = 0;

  const r2 = await fetch(API + "/api/tickets?equipo=Area+TI&limit=50");
  const tickets = await r2.json();
  const open = tickets.filter(t => t.estado !== "Resuelto");
  document.getElementById("pt-alta").textContent = open.filter(t => t.prioridad === "Alta").length;

  if (!tecnicosCache) {
    try {
      const rt = await fetch(API + "/api/tecnicos");
      tecnicosCache = await rt.json();
    } catch (e) { tecnicosCache = [] }
  }

  document.getElementById("tbl-panel-ti").innerHTML = open.map(t => `
    <tr>
      <td><strong>${t.numero}</strong></td><td>${t.descripcion.substring(0, 45)}</td>
      <td>${bCat(t.categoria)}</td><td>${bPrio(t.prioridad)}</td><td>${bEst(t.estado)}</td>
    </tr>
  `).join("");
}
function filterPanelTI() {
  const input = document.getElementById("search-panel-ti");
  const filter = input.value.toLowerCase();
  const rows = document.querySelectorAll("#tbl-panel-ti tr");
  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(filter) ? "" : "none";
  });
}

// Init
initAuth();
