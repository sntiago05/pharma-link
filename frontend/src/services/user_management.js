import { confirmation, getElementById, hasNumberORSymbol, validateEmail} from "../utils/functions";

export function admin_controller(){
    const form_add_user = getElementById("add_user_form");
    const form_disable_user = getElementById("disable_user_form");
    const form_enable_user = getElementById("enable_user_form");
    const searchInput = getElementById("user_search_input");
    const searchButton = getElementById("user_search_btn");
    const searchResult = getElementById("user_search_result");
    const users = [];

    const searchUserById = () => {
        if (!searchResult) return;
        const query = (searchInput?.value || "").trim();
        if (!query) {
            searchResult.innerHTML = `<span class="border border-yellow-600 bg-yellow-400 text-yellow-700">Ingrese un ID para buscar.</span>`;
            return;
        }

        const userId = query;
        if (!/^\d{10}$/.test(userId)) {
            searchResult.innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">La cédula debe contener exactamente 10 números.</span>`;
            return;
        }

        const user = users.find((item) => String(item.userId || item.user_id) === userId);
        if (!user) {
            searchResult.innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">No se encontró ningún usuario con esa cédula.</span>`;
            return;
        }

        searchResult.innerHTML = `<div class="border border-slate-500 bg-slate-700 p-2">
            <p><strong>Cédula:</strong> ${user.userId || user.user_id}</p>
            <p><strong>Nombre:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Estado:</strong> ${user.active ? "Activo" : "Inactivo"}</p>
        </div>`;
    };

    if (searchButton) {
        searchButton.addEventListener("click", searchUserById);
    }

    if (searchInput) {
        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                searchUserById();
            }
        });
    }

    form_add_user.addEventListener("submit", async (e)=>{
        e.preventDefault();
        const userData = Object.fromEntries(new FormData(form_add_user).entries());
        if (!userData.name || !userData.user_id || !userData.role || !userData.email || !userData.password) {
            getElementById("add_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">You need to fill everything!</span>`;
            setTimeout(()=>{getElementById("add_message").innerHTML = ``;}, 1500);
        } else if (!/^\d{10}$/.test(userData.user_id)) {
            getElementById("add_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">The ID must contain exactly 10 numbers.</span>`;
            setTimeout(()=>{getElementById("add_message").innerHTML = ``;}, 1500);
        } else if (hasNumberORSymbol(userData.name)){
            getElementById("add_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">User name can't have any number or symbols!</span>`;
            setTimeout(()=>{getElementById("add_message").innerHTML = ``;}, 1500);
        } else if (!validateEmail(userData.email)){
            getElementById("add_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">Invalid email!</span>`;
            setTimeout(()=>{getElementById("add_message").innerHTML = ``;}, 1500);
        } else if (userData.password.length < 6) {
            getElementById("add_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">Password must have at least 6 characters!</span>`;
            setTimeout(()=>{getElementById("add_message").innerHTML = ``;}, 1500);
        } else {
            const isAdminRole = String(userData.role) === "1";

            if (isAdminRole) {
                const adminConfirmation = confirmation("You are about to create a new user with the Admin role. This action requires your current password to continue.");
                if (adminConfirmation === false) {
                    getElementById("add_message").innerHTML = `<span class="border border-yellow-600 bg-yellow-400 text-yellow-700">Action canceled.</span>`;
                    setTimeout(()=>{getElementById("add_message").innerHTML = ``;}, 1500);
                    return;
                }

                if (adminConfirmation === null) {
                    getElementById("add_message").innerHTML = `<span class="border border-yellow-600 bg-yellow-400 text-yellow-700">Password is required to continue.</span>`;
                    setTimeout(()=>{getElementById("add_message").innerHTML = ``;}, 1500);
                    return;
                }
            } else {
                getElementById("add_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">Only admin users can perform this action.</span>`;
                setTimeout(()=>{getElementById("add_message").innerHTML = ``;}, 1500);
                return;
            }

            const userToSave = {
                userId: userData.user_id,
                ...userData,
                role: Number(userData.role),
                active: true
            };
            users.push(userToSave);
            getElementById("add_message").innerHTML = `<span class="border border-green-600 bg-green-400 text-green-700">User added successfully!</span>`;
            setTimeout(()=>{getElementById("add_message").innerHTML = ``;}, 1500);
            form_add_user.reset();
        }
    });

    form_disable_user.addEventListener("submit", async (e)=>{
        e.preventDefault();
        const disableData = Object.fromEntries(new FormData(form_disable_user).entries());
        const userToDisable = users.find((user) => user.email === disableData.user_email);

        if (!disableData.user_email) {
            getElementById("disable_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">You need to fill the email!</span>`;
            setTimeout(()=>{getElementById("disable_message").innerHTML = ``;}, 1500);
        } else if (!validateEmail(disableData.user_email)){
            getElementById("disable_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">Invalid email!</span>`;
            setTimeout(()=>{getElementById("disable_message").innerHTML = ``;}, 1500);
        } else if (!userToDisable) {
            getElementById("disable_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">The email does not exist!</span>`;
            setTimeout(()=>{getElementById("disable_message").innerHTML = ``;}, 1500);
        } else if (userToDisable.active === false) {
            getElementById("disable_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">The user is already disabled!</span>`;
            setTimeout(()=>{getElementById("disable_message").innerHTML = ``;}, 1500);
        } else {
            const disableConfirmation = confirmation("You are about to disable another user. This action requires your current password to continue.");
            if (disableConfirmation === false) {
                getElementById("disable_message").innerHTML = `<span class="border border-yellow-600 bg-yellow-400 text-yellow-700">Action canceled.</span>`;
                setTimeout(()=>{getElementById("disable_message").innerHTML = ``;}, 1500);
                return;
            }

            if (disableConfirmation === null) {
                getElementById("disable_message").innerHTML = `<span class="border border-yellow-600 bg-yellow-400 text-yellow-700">Password is required to continue.</span>`;
                setTimeout(()=>{getElementById("disable_message").innerHTML = ``;}, 1500);
                return;
            }

            userToDisable.active = false;
            getElementById("disable_message").innerHTML = `<span class="border border-green-600 bg-green-400 text-green-700">User disabled successfully!</span>`;
            setTimeout(()=>{getElementById("disable_message").innerHTML = ``;}, 1500);
            form_disable_user.reset();
        }
    });

    form_enable_user.addEventListener("submit", async (e)=>{
        e.preventDefault();
        const enableData = Object.fromEntries(new FormData(form_enable_user).entries());
        const userToEnable = users.find((user) => user.email === enableData.enable_user_email);

        if (!enableData.enable_user_email) {
            getElementById("enable_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">You need to fill the email!</span>`;
            setTimeout(()=>{getElementById("enable_message").innerHTML = ``;}, 1500);
        } else if (!validateEmail(enableData.enable_user_email)){
            getElementById("enable_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">Invalid email!</span>`;
            setTimeout(()=>{getElementById("enable_message").innerHTML = ``;}, 1500);
        } else if (!userToEnable) {
            getElementById("enable_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">The email does not exist!</span>`;
            setTimeout(()=>{getElementById("enable_message").innerHTML = ``;}, 1500);
        } else if (userToEnable.active === true) {
            getElementById("enable_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">The user is already enabled!</span>`;
            setTimeout(()=>{getElementById("enable_message").innerHTML = ``;}, 1500);
        } else {
            const enableConfirmation = confirmation("You are about to enable another user. This action requires your current password to continue.");
            if (enableConfirmation === false) {
                getElementById("enable_message").innerHTML = `<span class="border border-yellow-600 bg-yellow-400 text-yellow-700">Action canceled.</span>`;
                setTimeout(()=>{getElementById("enable_message").innerHTML = ``;}, 1500);
                return;
            }

            if (enableConfirmation === null) {
                getElementById("enable_message").innerHTML = `<span class="border border-yellow-600 bg-yellow-400 text-yellow-700">Password is required to continue.</span>`;
                setTimeout(()=>{getElementById("enable_message").innerHTML = ``;}, 1500);
                return;
            }

            userToEnable.active = true;
            getElementById("enable_message").innerHTML = `<span class="border border-green-600 bg-green-400 text-green-700">User enabled successfully!</span>`;
            setTimeout(()=>{getElementById("enable_message").innerHTML = ``;}, 1500);
            form_enable_user.reset();
        }
    });
};