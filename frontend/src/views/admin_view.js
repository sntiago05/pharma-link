import { admin_controller } from "../services/user_management";
import { pharmacy_controller } from "../services/pharmacy_management";

export function adminView() {
  document.getElementById("app").innerHTML = `
        <div id="container" class="h-screen flex justify-around bg-slate-700">
          <div class="h-full flex flex-col justify-center items-center p-1">
            <form id="add_user_form" class="flex flex-col w-50 gap-1">
              <label for="name">Name:</label>
              <input name="name" class="border" type="text" placeholder="name" >
              <label for="role">User role:</label>
              <select name="role" class="border" placeholder="Select an option" >
                <option value="1">Admin</option>
                <option value="2">Client</option>
                <option value="3">Pharmacy personel</option>
                <option value="4">EPS personel</option>
              </select>
              <label for="email">User email:</label>
              <input name="email" class="border" type="text" placeholder="email" >
              <label for="password">User password:</label>
              <input name="password" class="border" type="password" placeholder="password" >
              <div id="add_message"></div>
              <button id="add_user_btn">Add user</button>
            </form>
          </div>
          <div class="h-full flex flex-col justify-center items-center p-1">
            <form id="add_pharmacy_form" class="flex flex-col w-50 gap-1">
              <h3 class="text-lg">Crear farmacéutica</h3>
              <label for="pharmacy_name">Nombre:</label>
              <input name="pharmacy_name" class="border" type="text" placeholder="Nombre de la farmacéutica">
              <label for="pharmacy_nit">NIT (9 dígitos-guion-1 dígito):</label>
              <input name="pharmacy_nit" class="border" type="text" placeholder="123456789-1">
              <label for="pharmacy_address">Dirección:</label>
              <input name="pharmacy_address" class="border" type="text" placeholder="Dirección de la farmacéutica">
              <label for="pharmacy_city">Ciudad:</label>
              <input name="pharmacy_city" class="border" type="text" placeholder="Ciudad">
              <label for="pharmacy_phone">Número de teléfono:</label>
              <input name="pharmacy_phone" class="border" type="text" placeholder="3001234567">
              <div id="add_pharmacy_message"></div>
              <button id="add_pharmacy_btn">Agregar farmacéutica</button>
            </form>
            <form id="add_branch_form" class="flex flex-col w-50 gap-1 mt-4">
              <h3 class="text-lg">Agregar sede</h3>
              <label for="branch_pharmacy">Seleccionar farmacéutica:</label>
              <select name="branch_pharmacy" id="branch_pharmacy_select" class="border"></select>
              <label for="branch_address">Dirección:</label>
              <input name="branch_address" class="border" type="text" placeholder="Dirección de la sede">
              <div id="add_branch_message"></div>
              <button id="add_branch_btn">Agregar sede</button>
            </form>
            <div class="mt-3">
              <button id="print_pharmacies_btn" type="button" class="border px-2 py-1">Mostrar farmacias y sedes</button>
              <div id="print_pharmacies_output" class="mt-2 text-sm"></div>
            </div>
          </div>
          <div class="h-full flex flex-col justify-center items-center p-1"></div>
          <div class="h-full flex flex-col justify-center items-center p-1">
            <form id="disable_user_form" class="flex flex-col w-50 gap-1">
                <label for="user_email">User email:</label>
                <input name="user_email" class="border" placeholder="email" >
                <div id="disable_message"></div>
                <button id="disable_user_btn">Disable user</button>
            </form>
          </div>
          <div class="h-full flex flex-col justify-center items-center p-1">
            <form id="enable_user_form" class="flex flex-col w-50 gap-1">
                <label for="enable_user_email">User email:</label>
                <input name="enable_user_email" class="border" placeholder="email" >
                <div id="enable_message"></div>
                <button id="enable_user_btn">Enable user</button>
            </form>
          </div>
        </div>`;
  admin_controller();
  pharmacy_controller();
}