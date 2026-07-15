export function admin_controller() {
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
