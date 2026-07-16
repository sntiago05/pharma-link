

export function adminView() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div id="container" class="min-h-screen flex flex-col md:flex-row gap-4 bg-slate-700 p-4 text-slate-100">
      <aside class="w-full md:w-64 shrink-0 rounded-xl bg-slate-800 p-4 shadow-lg">
        <h2 class="text-xl font-semibold mb-4">Panel de administración</h2>
        <nav class="flex flex-col gap-2">
          <button data-service="users" class="admin-nav-btn rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-left transition hover:bg-slate-600">Administrar usuarios</button>
          <button data-service="pharmacies" class="admin-nav-btn rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-left transition hover:bg-slate-600">Administrar farmacias</button>
        </nav>
      </aside>
      <section id="admin_service_content" class="flex-1 rounded-xl bg-slate-800 p-4 shadow-lg"></section>
    </div>
  `;
}

export function renderUsersServiceView() {
  return `
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-lg border border-slate-600 p-4 lg:col-span-2">
        <h3 class="mb-3 text-lg font-semibold">Buscar usuario por cédula</h3>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input id="user_search_input" class="flex-1 border border-slate-500 bg-slate-700 p-2" type="text" placeholder="Ingrese la cédula del usuario">
          <button id="user_search_btn" type="button" class="rounded bg-slate-600 px-3 py-2 text-white">Buscar</button>
        </div>
        <div id="user_search_result" class="mt-2 text-sm"></div>
      </div>
      <div class="rounded-lg border border-slate-600 p-4">
        <h3 class="mb-3 text-lg font-semibold">Crear usuario</h3>
        <form id="add_user_form" class="flex flex-col gap-2">
          <label for="name">Name:</label>
          <input name="name" class="border border-slate-500 bg-slate-700 p-2" type="text" placeholder="name" >
          <label for="user_id">Cédula:</label>
          <input id="user_id_input" name="user_id" class="border border-slate-500 bg-slate-700 p-2" type="text" inputmode="numeric" pattern="[0-9]{10}" maxlength="10" placeholder="1234567890" >
          <label for="role">User role:</label>
          <select name="role" class="border border-slate-500 bg-slate-700 p-2">
            <option value="1">Admin</option>
            <option value="2">Client</option>
            <option value="3">Pharmacy personel</option>
            <option value="4">EPS personel</option>
          </select>
          <label for="email">User email:</label>
          <input name="email" class="border border-slate-500 bg-slate-700 p-2" type="text" placeholder="email" >
          <label for="password">User password:</label>
          <input name="password" class="border border-slate-500 bg-slate-700 p-2" type="password" placeholder="password" >
          <div id="add_message"></div>
          <button id="add_user_btn" class="rounded bg-emerald-600 px-3 py-2 text-white">Add user</button>
        </form>
      </div>
      <div class="rounded-lg border border-slate-600 p-4">
        <h3 class="mb-3 text-lg font-semibold">Deshabilitar usuario</h3>
        <form id="disable_user_form" class="flex flex-col gap-2">
          <label for="user_email">User email:</label>
          <input name="user_email" class="border border-slate-500 bg-slate-700 p-2" placeholder="email" >
          <div id="disable_message"></div>
          <button id="disable_user_btn" class="rounded bg-amber-600 px-3 py-2 text-white">Disable user</button>
        </form>
      </div>
      <div class="rounded-lg border border-slate-600 p-4 lg:col-span-2">
        <h3 class="mb-3 text-lg font-semibold">Habilitar usuario</h3>
        <form id="enable_user_form" class="flex flex-col gap-2">
          <label for="enable_user_email">User email:</label>
          <input name="enable_user_email" class="border border-slate-500 bg-slate-700 p-2" placeholder="email" >
          <div id="enable_message"></div>
          <button id="enable_user_btn" class="rounded bg-sky-600 px-3 py-2 text-white">Enable user</button>
        </form>
      </div>
    </div>
  `;
}

export function renderPharmaciesServiceView() {
  return `
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-lg border border-slate-600 p-4 lg:col-span-2">
        <h3 class="mb-3 text-lg font-semibold">Buscar farmacia o sede</h3>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input id="pharmacy_search_input" class="flex-1 border border-slate-500 bg-slate-700 p-2" type="text" placeholder="Ingrese el nombre de la farmacia o sede">
          <button id="pharmacy_search_btn" type="button" class="rounded bg-slate-600 px-3 py-2 text-white">Buscar</button>
        </div>
        <div id="pharmacy_search_result" class="mt-2 text-sm"></div>
      </div>
      <div class="rounded-lg border border-slate-600 p-4">
        <h3 class="mb-3 text-lg font-semibold">Crear farmacéutica</h3>
        <form id="add_pharmacy_form" class="flex flex-col gap-2">
          <label for="pharmacy_name">Nombre:</label>
          <input name="pharmacy_name" class="border border-slate-500 bg-slate-700 p-2" type="text" placeholder="Nombre de la farmacéutica">
          <label for="pharmacy_nit">NIT (9 dígitos-guion-1 dígito):</label>
          <input name="pharmacy_nit" class="border border-slate-500 bg-slate-700 p-2" type="text" placeholder="123456789-1">
          <label for="pharmacy_address">Dirección:</label>
          <input name="pharmacy_address" class="border border-slate-500 bg-slate-700 p-2" type="text" placeholder="Dirección de la farmacéutica">
          <label for="pharmacy_city">Ciudad:</label>
          <input name="pharmacy_city" class="border border-slate-500 bg-slate-700 p-2" type="text" placeholder="Ciudad">
          <label for="pharmacy_phone">Número de teléfono:</label>
          <input name="pharmacy_phone" class="border border-slate-500 bg-slate-700 p-2" type="text" placeholder="3001234567">
          <div id="add_pharmacy_message"></div>
          <button id="add_pharmacy_btn" class="rounded bg-emerald-600 px-3 py-2 text-white">Agregar farmacéutica</button>
        </form>
      </div>
      <div class="rounded-lg border border-slate-600 p-4">
        <h3 class="mb-3 text-lg font-semibold">Agregar sede</h3>
        <form id="add_branch_form" class="flex flex-col gap-2">
          <label for="branch_pharmacy">Seleccionar farmacéutica:</label>
          <select name="branch_pharmacy" id="branch_pharmacy_select" class="border border-slate-500 bg-slate-700 p-2"></select>
          <label for="branch_name">Nombre de la sede:</label>
          <input name="branch_name" class="border border-slate-500 bg-slate-700 p-2" type="text" placeholder="Nombre de la sede">
          <label for="branch_address">Dirección:</label>
          <input name="branch_address" class="border border-slate-500 bg-slate-700 p-2" type="text" placeholder="Dirección de la sede">
          <div id="add_branch_message"></div>
          <button id="add_branch_btn" class="rounded bg-sky-600 px-3 py-2 text-white">Agregar sede</button>
        </form>
      </div>
    </div>
  `;
}