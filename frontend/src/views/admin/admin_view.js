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
              <input name="email" class="border" type="email" placeholder="email" >
              <label for="password">User password:</label>
              <input name="password" class="border" type="password" placeholder="password" >
              <div id="add_message"></div>
              <button id="add_user_btn" type="submit">Add user</button>
            </form>
          </div>
          <div class="h-full flex flex-col justify-center items-center p-1"></div>
          <div class="h-full flex flex-col justify-center items-center p-1">
            <form id="disable_user_form" class="flex flex-col w-50 gap-1">
                <label for="user_email">User email:</label>
                <input name="user_email" class="border" placeholder="email" >
                <div id="disable_message"></div>
                <button id="disable_user_btn" type="submit">Disable user</button>
            </form>
          </div>
        </div>`;

  // Inline event handlers originally in frontend/src/controllers/admin_controller.js
  const addForm = document.getElementById("add_user_form");
  const disableForm = document.getElementById("disable_user_form");

  if (addForm) {
    addForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(addForm).entries());
      const message = document.getElementById("add_message");

      if (!data.name || !data.role || !data.email || !data.password) {
        message.innerHTML = `<p class="text-sm text-red-600">Please fill in all fields.</p>`;
        return;
      }

      message.innerHTML = `<p class="text-sm text-emerald-700">User ${data.name} added (demo mode).</p>`;
      addForm.reset();
    });
  }

  if (disableForm) {
    disableForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = disableForm.user_email?.value;
      const message = document.getElementById("disable_message");

      if (!email) {
        message.innerHTML = `<p class="text-sm text-red-600">Please enter an email to disable.</p>`;
        return;
      }

      message.innerHTML = `<p class="text-sm text-emerald-700">User ${email} disabled (demo mode).</p>`;
      disableForm.reset();
    });
  }
}