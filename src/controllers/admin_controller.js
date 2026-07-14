import { getElementById, hasNumberORSymbol} from "../utils/functions";

export function admin_controller(){
    const form_add_user = getElementById("add_user_form");
    const form_disable_user = getElementById("disable_user_form");
    const users = [];

    form_add_user.addEventListener("submit", async (e)=>{
        e.preventDefault();
        const userData = Object.fromEntries(new FormData(form_add_user).entries());
        if (!userData.name || !userData.role || !userData.email || !userData.password) {
            getElementById("add_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">You need to fill everything!</span>`
        } 
    });
};