import { confirmation, getElementById, hasNumberORSymbol, validateEmail} from "../utils/functions";

export function admin_controller(){
    const form_add_user = getElementById("add_user_form");
    const form_disable_user = getElementById("disable_user_form");
    const form_enable_user = getElementById("enable_user_form");
    const users = [];

    form_add_user.addEventListener("submit", async (e)=>{
        e.preventDefault();
        const userData = Object.fromEntries(new FormData(form_add_user).entries());
        if (!userData.name || !userData.role || !userData.email || !userData.password) {
            getElementById("add_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">You need to fill everything!</span>`;
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
            }

            const userToSave = {
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