import { admin_controller } from "../../../src/controllers/admin_controller";

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
                <option value="3">EPS personel</option>
              </select>
              <label for="email">User email:</label>
              <input name="email" class="border" type="email" placeholder="email" >
              <label for="password">User password:</label>
              <input name="password" class="border" type="password" placeholder="password" >
              <div id="add_message"></div>
              <button id="add_user_btn">Add user</button>
            </form>
          </div>
          <div class="h-full flex flex-col justify-center items-center p-1"></div>
          <div class="h-full flex flex-col justify-center items-center p-1">
            <form id="add_user_form" class="flex flex-col w-50 gap-1">
                <label for="user_email">User email:</label>
                <input name="user_email" class="border" placeholder="email" >
                <div id="disable_message"></div>
                <button id="disable_user_btn">Disable user</button>
            </form>
          </div>
        </div>`;
  admin_controller();
}