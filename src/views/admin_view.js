import { admin_controller } from "../controllers/admin_controller";

export function adminView() {
  document.getElementById("app").innerHTML = `
        <div id="container" class="h-screen flex justify-around">
          <div class="h-full flex flex-col justify-center items-center p-1">
            <form id="add_user_form" class="flex flex-col w-50 gap-1">
              <label for="user_name">Name:</label>
              <input name="user_name" class="border" type="text" placeholder="name">
              <label for="user_role">User role:</label>
              <select name="user_role" class="border" placeholder="role">
                <option value="0">Seleccione una opcion</option>
                <option value="1">Admin</option>
                <option value="2">Client</option>
                <option value="3">Pharmacy personel</option>
                <option value="3">EPS personel</option>
              </select>
              <label for="user_email">User email:</label>
              <input name="user_email" class="border" type="email" placeholder="email">
              <label for="user_password">User password:</label>
              <input name="user_password" class="border" type="password" placeholder="password">
              <button id="add_user_btn">Add user</button>
            </form>
          </div>
          <div class="h-full flex flex-col justify-center items-center p-1">
            <form id="add_user_form" class="flex flex-col w-50 gap-1">
                <label for="user_email">User email:</label>
                <input name="user_email" class="border" placeholder="email">
                <button id="disable_user_btn">Disable user</button>
            </form>
          </div>
        </div>`;
  admin_controller();
}
