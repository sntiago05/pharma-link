import * as adminApi from "../../services/admin.js";
import { loadContext } from "../../services/auth.js";
import { getContext } from "../../services/session.js";
import {
  dataTable,
  emptyState,
  errorState,
  escapeHtml,
  formatDate,
  loadingState,
  panel,
  primaryButton,
  roleShell,
  secondaryButton,
  selectField,
  statCard,
  statusBadge,
  textField,
  toast
} from "../components.js";
import { bindLogout, quickLinks, sectionFromPath, userCard } from "../shell.js";

/**
 * Admin panel.
 *
 * Manages the catalog the rest of the platform depends on (EPS, pharmacies,
 * medicines), the EPS-pharmacy contracts that decide where a patient may
 * reserve, and the audit trail.
 */

const SECTIONS = ["dashboard", "eps", "pharmacies", "medicines", "audit", "profile"];

const NAV = (active) => [
  { label: "Dashboard", href: "/admin/dashboard", active: active === "dashboard" },
  { label: "EPS", href: "/admin/eps", active: active === "eps" },
  { label: "Farmacias", href: "/admin/pharmacies", active: active === "pharmacies" },
  { label: "Medicamentos", href: "/admin/medicines", active: active === "medicines" },
  { label: "Auditoría", href: "/admin/audit", active: active === "audit" },
  { label: "Perfil", href: "/admin/profile", active: active === "profile" }
];

function paint({ user, section, body }) {
  document.getElementById("app").innerHTML = roleShell({
    title: "Panel de administración",
    subtitle: "Gestiona EPS, farmacias, medicamentos y auditoría.",
    navItems: NAV(section),
    content: `<div id="adminContent">${body}</div>`,
    sideContent: `
      ${userCard({ user })}
      ${quickLinks([
        { label: "Registrar farmacia", href: "/admin/pharmacies" },
        { label: "Registrar medicamento", href: "/admin/medicines" },
        { label: "Ver auditoría", href: "/admin/audit" }
      ])}
    `
  });
}

const setContent = (html) => {
  const node = document.getElementById("adminContent");
  if (node) node.innerHTML = html;
};

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

async function renderDashboard() {
  setContent(loadingState("Cargando resumen..."));

  const [epsList, pharmacies, medicines] = await Promise.all([
    adminApi.listCatalog("eps"),
    adminApi.listCatalog("pharmacies"),
    adminApi.listCatalog("medicines")
  ]);

  // One dashboard per EPS; there is no cross-EPS aggregate endpoint, and summing
  // them client-side would double-count patients who belong to more than one.
  const epsDashboards = await Promise.all(
    epsList.map((eps) =>
      adminApi
        .getEpsDashboard(eps.id)
        .then((data) => ({ eps, data }))
        .catch(() => null)
    )
  );

  const rows = epsDashboards.filter(Boolean);

  setContent(`
    <div class="mt-5 grid gap-3 md:grid-cols-3">
      ${statCard("EPS registradas", String(epsList.length), `${epsList.filter((eps) => eps.active).length} activas`)}
      ${statCard("Farmacias", String(pharmacies.length), `${pharmacies.filter((pharmacy) => pharmacy.active).length} activas`)}
      ${statCard("Medicamentos", String(medicines.length), "En catálogo")}
    </div>

    ${panel({
      title: "Actividad por EPS",
      body: rows.length
        ? dataTable({
            headers: ["EPS", "Órdenes", "Entregadas", "Pendientes", "Vencidas", "Pacientes atendidos"],
            rows: rows.map(({ eps, data }) => [
              escapeHtml(eps.name),
              String(data.orders.created),
              String(data.orders.delivered),
              String(data.orders.pending),
              String(data.orders.expired),
              String(data.patients.served)
            ])
          })
        : emptyState("Sin EPS registradas todavía.")
    })}

    ${panel({
      title: "Farmacias",
      action: `<a href="/admin/pharmacies" class="text-sm font-medium text-emerald-700">Gestionar</a>`,
      body: pharmacies.length
        ? dataTable({
            headers: ["Farmacia", "Ciudad", "NIT", "Estado", "Panel"],
            rows: pharmacies.map((pharmacy) => [
              escapeHtml(pharmacy.name),
              escapeHtml(pharmacy.city || "-"),
              escapeHtml(pharmacy.nit || "-"),
              statusBadge(pharmacy.active ? "Activa" : "Inactiva", pharmacy.active ? "emerald" : "red"),
              `<a href="/pharmacy/dashboard?pharmacyId=${pharmacy.id}" class="text-sm font-medium text-emerald-700">Abrir</a>`
            ])
          })
        : emptyState("Sin farmacias registradas.")
    })}
  `);
}

/* -------------------------------------------------------------------------- */
/* Generic catalog CRUD                                                        */
/* -------------------------------------------------------------------------- */

/** Field definitions per catalog type, matching the create endpoints. */
const CATALOG_FORMS = {
  eps: {
    title: "EPS",
    columns: ["Nombre", "NIT", "Estado"],
    toRow: (item) => [
      escapeHtml(item.name),
      escapeHtml(item.nit),
      statusBadge(item.active ? "Activa" : "Inactiva", item.active ? "emerald" : "red")
    ],
    fields: [
      { id: "name", label: "Nombre", type: "text" },
      { id: "nit", label: "NIT", type: "text" },
      // The plaintext key is hashed server-side and never returned again.
      { id: "apiKey", label: "API key (mínimo 8 caracteres)", type: "text" }
    ]
  },
  pharmacies: {
    title: "Farmacias",
    columns: ["Nombre", "Ciudad", "Dirección", "NIT", "Estado"],
    toRow: (item) => [
      escapeHtml(item.name),
      escapeHtml(item.city || "-"),
      escapeHtml(item.address || "-"),
      escapeHtml(item.nit || "-"),
      statusBadge(item.active ? "Activa" : "Inactiva", item.active ? "emerald" : "red")
    ],
    fields: [
      { id: "name", label: "Nombre", type: "text" },
      { id: "nit", label: "NIT", type: "text" },
      { id: "address", label: "Dirección", type: "text" },
      { id: "city", label: "Ciudad", type: "text" },
      { id: "inventoryApiUrl", label: "URL de inventario", type: "text", value: "internal://inventory" },
      { id: "apiKey", label: "API key", type: "text" }
    ]
  },
  medicines: {
    title: "Medicamentos",
    columns: ["Código", "Nombre", "Presentación", "Descripción"],
    toRow: (item) => [
      escapeHtml(item.code),
      escapeHtml(item.name),
      escapeHtml(item.presentation || "-"),
      escapeHtml(item.description || "-")
    ],
    fields: [
      { id: "code", label: "Código", type: "text" },
      { id: "name", label: "Nombre", type: "text" },
      { id: "presentation", label: "Presentación", type: "text" },
      { id: "description", label: "Descripción", type: "text" }
    ]
  }
};

/**
 * Renders list + create form for one catalog type.
 *
 * The three catalogs share this renderer because the backend exposes them
 * through one parameterised controller with the same contract.
 */
async function renderCatalog(type, ctx) {
  const config = CATALOG_FORMS[type];
  setContent(loadingState(`Cargando ${config.title.toLowerCase()}...`));

  const items = await adminApi.listCatalog(type);

  setContent(`
    ${panel({
      title: `Registrar ${config.title.toLowerCase()}`,
      body: `
        <form id="catalogForm" class="grid gap-3 md:grid-cols-2" novalidate>
          ${config.fields
            .map((field) =>
              textField({
                id: field.id,
                label: field.label,
                type: field.type,
                value: field.value || ""
              })
            )
            .join("")}
          <div class="md:col-span-2">
            <p id="catalogError" class="min-h-5 text-sm font-medium text-red-600"></p>
            ${primaryButton(`Crear ${config.title.toLowerCase()}`, { type: "submit" })}
          </div>
        </form>
      `
    })}

    ${panel({
      title: config.title,
      action: `<span class="text-sm text-slate-400">${items.length} registro(s)</span>`,
      body: items.length
        ? dataTable({
            headers: [...config.columns, "Acciones"],
            rows: items.map((item) => [
              ...config.toRow(item),
              secondaryButton("Eliminar", { tone: "red", attrs: `data-delete="${item.id}"` })
            ])
          })
        : emptyState(`Sin ${config.title.toLowerCase()} registrados.`)
    })}

    ${type === "pharmacies" ? linkPanel(items) : ""}
  `);

  document.getElementById("catalogForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const errorNode = document.getElementById("catalogError");
    errorNode.textContent = "";

    const payload = Object.fromEntries(
      config.fields.map((field) => [field.id, document.getElementById(field.id).value.trim()])
    );

    try {
      await adminApi.createCatalog(type, payload);
      toast(`${config.title} creado correctamente.`);
      await renderCatalog(type, ctx);
    } catch (error) {
      errorNode.textContent = error.detail || error.message;
    }
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("¿Eliminar este registro? La acción no se puede deshacer.")) return;

      try {
        await adminApi.deleteCatalog(type, button.dataset.delete);
        toast("Registro eliminado.");
        await renderCatalog(type, ctx);
      } catch (error) {
        // Usually 409: the row is still referenced by orders or reservations.
        toast(error.detail || error.message, "red");
      }
    });
  });

  if (type === "pharmacies") await bindLinkPanel(items, () => renderCatalog(type, ctx));
}

/**
 * EPS-pharmacy contracts.
 *
 * This link is what makes a pharmacy visible to a patient: reservations are
 * rejected unless the pharmacy is contracted by the order's EPS.
 */
function linkPanel(pharmacies) {
  return panel({
    title: "Asociar EPS y farmacia",
    body: `
      <p class="mb-4 text-sm text-slate-500">
        Un paciente solo puede reservar en farmacias asociadas a la EPS que emitió su orden.
      </p>
      <form id="linkForm" class="grid gap-3 md:grid-cols-3" novalidate>
        <div id="epsSelectSlot"></div>
        ${selectField({
          id: "linkPharmacyId",
          label: "Farmacia",
          options: pharmacies.map((pharmacy) => ({ value: pharmacy.id, label: pharmacy.name }))
        })}
        <div class="flex items-end">${primaryButton("Asociar", { type: "submit" })}</div>
        <p id="linkError" class="min-h-5 text-sm font-medium text-red-600 md:col-span-3"></p>
      </form>
    `
  });
}

async function bindLinkPanel(pharmacies, refresh) {
  const epsList = await adminApi.listCatalog("eps");

  document.getElementById("epsSelectSlot").innerHTML = selectField({
    id: "linkEpsId",
    label: "EPS",
    options: epsList.map((eps) => ({ value: eps.id, label: eps.name }))
  });

  document.getElementById("linkForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const errorNode = document.getElementById("linkError");
    const epsId = document.getElementById("linkEpsId").value;
    const pharmacyId = document.getElementById("linkPharmacyId").value;
    errorNode.textContent = "";

    if (!epsId || !pharmacyId) {
      errorNode.textContent = "Selecciona una EPS y una farmacia.";
      return;
    }

    try {
      await adminApi.linkEpsPharmacy(Number(epsId), Number(pharmacyId));
      toast("EPS y farmacia asociadas.");
      await refresh();
    } catch (error) {
      errorNode.textContent = error.detail || error.message;
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Audit                                                                       */
/* -------------------------------------------------------------------------- */

async function renderAudit(ctx) {
  const params = new URLSearchParams(window.location.search);
  const table = params.get("table") || "";
  const action = params.get("action") || "";

  setContent(loadingState("Cargando auditoría..."));

  const logs = await adminApi.listAuditLogs({ table, action, limit: 100 });

  setContent(
    panel({
      title: "Registro de auditoría",
      action: `
        <div class="flex flex-wrap items-center gap-2">
          <input id="auditTable" type="search" value="${escapeHtml(table)}" placeholder="Tabla"
            class="w-32 rounded-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-600">
          <input id="auditAction" type="search" value="${escapeHtml(action)}" placeholder="Acción"
            class="w-36 rounded-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-600">
          ${secondaryButton("Filtrar", { attrs: "data-filter-audit" })}
        </div>
      `,
      body: logs.length
        ? dataTable({
            headers: ["Fecha", "Usuario", "Acción", "Tabla", "Registro", "Endpoint", "IP", "Estado"],
            rows: logs.map((log) => [
              formatDate(log.created_at),
              escapeHtml(log.user_full_name || "Sistema"),
              `<span class="font-semibold text-slate-900">${escapeHtml(log.action)}</span>`,
              escapeHtml(log.table_name || "-"),
              escapeHtml(log.record_id || "-"),
              `<span class="text-xs">${escapeHtml(log.http_method)} ${escapeHtml(log.endpoint || "")}</span>`,
              escapeHtml(log.ip_address || "-"),
              String(log.status_code)
            ])
          })
        : emptyState("Sin registros de auditoría.", "Las acciones sobre datos aparecerán aquí.")
    })
  );

  document.querySelector("[data-filter-audit]").addEventListener("click", () => {
    const query = new URLSearchParams();
    const tableValue = document.getElementById("auditTable").value.trim();
    const actionValue = document.getElementById("auditAction").value.trim();
    if (tableValue) query.set("table", tableValue);
    if (actionValue) query.set("action", actionValue);
    ctx.navigate(`/admin/audit${query.toString() ? `?${query}` : ""}`);
  });
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                     */
/* -------------------------------------------------------------------------- */

async function renderProfileSection({ user }) {
  setContent(
    panel({
      title: "Perfil del administrador",
      body: `
        <div class="space-y-3">
          ${[
            ["Nombre", user.fullName],
            ["Correo", user.email],
            ["Rol", "Administrador"]
          ]
            .map(
              ([label, value]) => `
              <div class="rounded-[20px] bg-slate-50 p-4">
                <p class="text-sm text-slate-500">${label}</p>
                <p class="mt-1 text-base font-semibold text-slate-900">${escapeHtml(value)}</p>
              </div>`
            )
            .join("")}
        </div>
        <p class="mt-4 rounded-[20px] bg-slate-50 p-4 text-sm text-slate-500">
          Como administrador puedes abrir el panel de cualquier farmacia o EPS desde el dashboard.
        </p>
      `
    })
  );
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                 */
/* -------------------------------------------------------------------------- */

const RENDERERS = {
  dashboard: renderDashboard,
  eps: (ctx) => renderCatalog("eps", ctx),
  pharmacies: (ctx) => renderCatalog("pharmacies", ctx),
  medicines: (ctx) => renderCatalog("medicines", ctx),
  audit: renderAudit,
  profile: renderProfileSection
};

export async function renderAdminDashboard({ navigate, user, currentPath }) {
  const section = sectionFromPath(currentPath, SECTIONS, "dashboard");

  paint({ user, section, body: loadingState() });
  bindLogout(navigate);

  let context = getContext();
  if (!context || context.role !== user.role) {
    try {
      context = await loadContext();
    } catch (error) {
      setContent(errorState(error.detail || error.message));
      return;
    }
  }

  try {
    await RENDERERS[section]({ navigate, user, currentPath, context });
  } catch (error) {
    if (error?.status === 401) throw error;
    setContent(errorState(error.detail || error.message));
    document
      .querySelector("[data-retry]")
      ?.addEventListener("click", () => renderAdminDashboard({ navigate, user, currentPath }));
  }
}
