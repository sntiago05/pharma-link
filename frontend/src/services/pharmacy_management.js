import { getElementById, hasNumberORSymbol, isOnlyNumbers, confirmation } from "../utils/functions";

export function pharmacy_controller(){
    const form_add_pharmacy = getElementById("add_pharmacy_form");
    const form_add_branch = getElementById("add_branch_form");
    const branchSelect = getElementById("branch_pharmacy_select");
    const searchInput = getElementById("pharmacy_search_input");
    const searchButton = getElementById("pharmacy_search_btn");
    const searchResult = getElementById("pharmacy_search_result");
    const pharmacies = [];
    const branches = []; // almacenar sedes por separado, relacionadas por `pharmacyNit`
    const printBtn = getElementById("print_pharmacies_btn");
    const printOutput = getElementById("print_pharmacies_output");

    function refreshPharmacyOptions(){
        if (!branchSelect) return;
        branchSelect.innerHTML = "";
        const defaultOpt = document.createElement('option');
        defaultOpt.value = "";
        defaultOpt.textContent = "-- Seleccione --";
        branchSelect.appendChild(defaultOpt);
        pharmacies.forEach((p) => {
            const opt = document.createElement('option');
            // usar NIT como identificador temporal hasta persistir en backend
            opt.value = p.nit || p.name;
            opt.textContent = p.name;
            branchSelect.appendChild(opt);
        });
    }

    const searchPharmaciesAndBranches = () => {
        if (!searchResult) return;
        const query = (searchInput?.value || "").trim().toLowerCase();
        if (!query) {
            searchResult.innerHTML = `<span class="border border-yellow-600 bg-yellow-400 text-yellow-700">Ingrese un nombre de farmacia o sede para buscar.</span>`;
            return;
        }

        const pharmacyMatches = pharmacies.filter((pharmacy) => String(pharmacy.name || "").toLowerCase().includes(query));
        const branchMatches = branches.filter((branch) => {
            const branchName = String(branch.name || branch.address || "").toLowerCase();
            return branchName.includes(query);
        });

        if (pharmacyMatches.length === 0 && branchMatches.length === 0) {
            searchResult.innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">No se encontró ninguna farmacia o sede con ese criterio.</span>`;
            return;
        }

        const html = [];
        if (pharmacyMatches.length > 0) {
            html.push(`<div class="mb-2"><strong>Farmacias encontradas</strong></div>`);
            pharmacyMatches.forEach((pharmacy) => {
                const relatedBranches = branches.filter((branch) => String(branch.pharmacyNit) === String(pharmacy.nit));
                const branchList = relatedBranches.length > 0 ? relatedBranches.map((branch) => `<li class="ml-4">${branch.name || branch.address}</li>`).join("") : "<li class=\"ml-4\">Sin sedes registradas</li>";
                html.push(`<div class="mb-2 border border-slate-500 bg-slate-700 p-2"><strong>${pharmacy.name}</strong><ul>${branchList}</ul></div>`);
            });
        }

        if (branchMatches.length > 0) {
            html.push(`<div class="mb-2"><strong>Sedes encontradas</strong></div>`);
            branchMatches.forEach((branch) => {
                const pharmacy = pharmacies.find((item) => String(item.nit) === String(branch.pharmacyNit));
                html.push(`<div class="mb-2 border border-slate-500 bg-slate-700 p-2"><strong>${branch.name || branch.address}</strong><div>Farmacéutica: ${pharmacy?.name || "No encontrada"}</div></div>`);
            });
        }

        searchResult.innerHTML = html.join("");
    };

    if (searchButton) {
        searchButton.addEventListener("click", searchPharmaciesAndBranches);
    }

    if (searchInput) {
        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                searchPharmaciesAndBranches();
            }
        });
    }

    if (form_add_pharmacy) {
        form_add_pharmacy.addEventListener("submit", (e) => {
            e.preventDefault();
                const data = Object.fromEntries(new FormData(form_add_pharmacy).entries());
                const name = (data.pharmacy_name || "").trim();
                const nit = (data.pharmacy_nit || "").trim();
                const address = (data.pharmacy_address || "").trim();
                const city = (data.pharmacy_city || "").trim();
                const phone = (data.pharmacy_phone || "").trim();

                // Validaciones
                if (!name || !nit || !address || !city || !phone) {
                    getElementById("add_pharmacy_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">Todos los campos son obligatorios.</span>`;
                    setTimeout(()=>{getElementById("add_pharmacy_message").innerHTML = ``;}, 1500);
                    return;
                }

                // NIT: 9 números, guion, 1 número
                const nitRegex = /^\d{9}-\d$/;
                if (!nitRegex.test(nit)) {
                    getElementById("add_pharmacy_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">NIT inválido. Formato esperado: 123456789-1</span>`;
                    setTimeout(()=>{getElementById("add_pharmacy_message").innerHTML = ``;}, 1500);
                    return;
                }

                // Ciudad: no puede contener números ni símbolos (solo letras y espacios)
                if (hasNumberORSymbol(city)) {
                    getElementById("add_pharmacy_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">Ciudad inválida. No puede contener números ni símbolos.</span>`;
                    setTimeout(()=>{getElementById("add_pharmacy_message").innerHTML = ``;}, 1500);
                    return;
                }

                // Teléfono: solo números
                if (!isOnlyNumbers(phone)) {
                    getElementById("add_pharmacy_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">Número de teléfono inválido. Solo números permitidos.</span>`;
                    setTimeout(()=>{getElementById("add_pharmacy_message").innerHTML = ``;}, 1500);
                    return;
                }

                // Unicidad: NIT, nombre y teléfono no deben repetirse
                const nitExists = pharmacies.some(p => String(p.nit) === String(nit));
                if (nitExists) {
                    getElementById("add_pharmacy_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">El NIT ya está registrado.</span>`;
                    setTimeout(()=>{getElementById("add_pharmacy_message").innerHTML = ``;}, 1500);
                    return;
                }

                const nameExists = pharmacies.some(p => String(p.name).toLowerCase() === String(name).toLowerCase());
                if (nameExists) {
                    getElementById("add_pharmacy_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">El nombre de la farmacéutica ya existe.</span>`;
                    setTimeout(()=>{getElementById("add_pharmacy_message").innerHTML = ``;}, 1500);
                    return;
                }

                const phoneExists = pharmacies.some(p => String(p.phone) === String(phone));
                if (phoneExists) {
                    getElementById("add_pharmacy_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">El número de teléfono ya está registrado.</span>`;
                    setTimeout(()=>{getElementById("add_pharmacy_message").innerHTML = ``;}, 1500);
                    return;
                }

                    // solicitar confirmación por contraseña antes de crear
                    const createConfirmation = confirmation("Vas a crear una nueva farmacéutica. Esta acción requiere tu contraseña para continuar.");
                    if (createConfirmation === false) {
                        getElementById("add_pharmacy_message").innerHTML = `<span class="border border-yellow-600 bg-yellow-400 text-yellow-700">Acción cancelada.</span>`;
                        setTimeout(()=>{getElementById("add_pharmacy_message").innerHTML = ``;}, 1500);
                        return;
                    }
                    if (createConfirmation === null) {
                        getElementById("add_pharmacy_message").innerHTML = `<span class="border border-yellow-600 bg-yellow-400 text-yellow-700">Contraseña requerida para continuar.</span>`;
                        setTimeout(()=>{getElementById("add_pharmacy_message").innerHTML = ``;}, 1500);
                        return;
                    }

                    // No asignar `id` localmente; se generará en el backend al persistir
                    const newPharmacy = { name, nit, address, city, phone };
                pharmacies.push(newPharmacy);
                refreshPharmacyOptions();
                getElementById("add_pharmacy_message").innerHTML = `<span class="border border-green-600 bg-green-400 text-green-700">Farmacéutica agregada.</span>`;
                setTimeout(()=>{getElementById("add_pharmacy_message").innerHTML = ``;}, 1500);
                form_add_pharmacy.reset();
        });
    }

    if (form_add_branch) {
        form_add_branch.addEventListener("submit", (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form_add_branch).entries());
            const pharmacyId = data.branch_pharmacy;
            const branchName = (data.branch_name || "").trim();
            const address = (data.branch_address || "").trim();

            if (!pharmacyId) {
                getElementById("add_branch_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">Seleccione una farmacéutica.</span>`;
                setTimeout(()=>{getElementById("add_branch_message").innerHTML = ``;}, 1500);
                return;
            }

            if (!address) {
                getElementById("add_branch_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">Ingrese la dirección de la sede.</span>`;
                setTimeout(()=>{getElementById("add_branch_message").innerHTML = ``;}, 1500);
                return;
            }

                // buscar por NIT (o por nombre si por alguna razón no hay NIT)
                const pharmacy = pharmacies.find(p => String(p.nit) === String(pharmacyId) || p.name === pharmacyId);
            if (!pharmacy) {
                getElementById("add_branch_message").innerHTML = `<span class="border border-red-600 bg-red-400 text-red-700">Farmacéutica no encontrada.</span>`;
                setTimeout(()=>{getElementById("add_branch_message").innerHTML = ``;}, 1500);
                return;
            }
                // No asignar `id` a la sede localmente; se generará en backend
                // solicitar confirmación por contraseña antes de agregar sede
                const branchConfirmation = confirmation("Vas a agregar una nueva sede a la farmacéutica. Esta acción requiere tu contraseña para continuar.");
                if (branchConfirmation === false) {
                    getElementById("add_branch_message").innerHTML = `<span class="border border-yellow-600 bg-yellow-400 text-yellow-700">Acción cancelada.</span>`;
                    setTimeout(()=>{getElementById("add_branch_message").innerHTML = ``;}, 1500);
                    return;
                }
                if (branchConfirmation === null) {
                    getElementById("add_branch_message").innerHTML = `<span class="border border-yellow-600 bg-yellow-400 text-yellow-700">Contraseña requerida para continuar.</span>`;
                    setTimeout(()=>{getElementById("add_branch_message").innerHTML = ``;}, 1500);
                    return;
                }

                const newBranch = { pharmacyNit: pharmacy.nit, name: branchName || address, address };
                branches.push(newBranch);
            getElementById("add_branch_message").innerHTML = `<span class="border border-green-600 bg-green-400 text-green-700">Sede agregada a ${pharmacy.name}.</span>`;
            setTimeout(()=>{getElementById("add_branch_message").innerHTML = ``;}, 1500);
            form_add_branch.reset();
            refreshPharmacyOptions();
        });
    }

    // botón para imprimir farmacias y sedes
    if (printBtn) {
        printBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Pharmacies:", pharmacies);
            console.log("Branches:", branches);
            if (!printOutput) return;
            if (pharmacies.length === 0) {
                printOutput.innerHTML = `<div class="border p-2">No hay farmacéuticas registradas.</div>`;
                return;
            }
            const html = pharmacies.map(p => {
                const pharmacyBranches = branches.filter(b => String(b.pharmacyNit) === String(p.nit));
                const branchesHtml = (pharmacyBranches || []).map(b => `<li class=\"ml-4\">${b.address}</li>`).join("");
                return `<div class=\"mb-2\"><strong>${p.name}</strong><ul>${branchesHtml}</ul></div>`;
            }).join("");
            printOutput.innerHTML = html;
        });
    }

    // inicializar select
    refreshPharmacyOptions();
}
