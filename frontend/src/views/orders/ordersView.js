import { brandHeader } from "../components.js";

function ordersTemplate(user) {
  const patientName = user?.name || "Paciente";

  return `
    <main class="min-h-screen bg-slate-50 px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <section class="mx-auto flex w-full max-w-5xl flex-col gap-4 lg:flex-row lg:items-start">
        <div class="w-full rounded-[32px] bg-white p-4 shadow-xl shadow-emerald-900/10 ring-1 ring-slate-200 sm:p-6 lg:flex-1">
          <header class="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Pharma Link</p>
              <h1 class="mt-1 text-2xl font-semibold text-[#0D4D44]">Órdenes y reservas</h1>
            </div>
            <a href="/patient" class="inline-flex items-center rounded-[24px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">Volver</a>
          </header>

          <div class="mt-5 overflow-hidden rounded-[28px] bg-emerald-700 text-white shadow-xl shadow-slate-400/20">
            <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div class="sm:max-w-[60%]">
                <p class="text-[11px] uppercase tracking-[0.32em] text-emerald-200">Seguimiento</p>
                <h2 class="mt-3 text-2xl font-semibold leading-tight">Hola, ${patientName}. Tu dispensación está organizada.</h2>
                <p class="mt-3 text-sm text-emerald-100">Consulta tus órdenes activas, revisa la farmacia asignada y confirma la hora de retiro sin filas ni llamadas.</p>
              </div>
              <img class="h-24 w-full rounded-[24px] object-cover sm:h-28 sm:w-28" src="/assets/images/landingImg.png" alt="Atención farmacéutica" />
            </div>
          </div>

          <section class="mt-5 grid gap-3 md:grid-cols-2">
            <article class="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-slate-900">Orden #3821</p>
                <span class="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">Listo para retirar</span>
              </div>
              <p class="mt-3 text-sm text-slate-600">Metformina 850 mg · 2 unidades</p>
              <div class="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>Farmacia Central</span>
                <span>Hoy · 14:30</span>
              </div>
            </article>

            <article class="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-slate-900">Reserva #4410</p>
                <span class="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600">Pendiente</span>
              </div>
              <p class="mt-3 text-sm text-slate-600">Amoxicilina cápsulas · 1 presentación</p>
              <div class="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>Farmacia Norte</span>
                <span>Mañana · 09:00</span>
              </div>
            </article>
          </section>

          <section class="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-slate-900">Historial reciente</p>
              <span class="text-xs text-slate-400">4 medicamentos</span>
            </div>

            <div class="mt-4 space-y-3">
              <article class="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
                <div>
                  <p class="text-sm font-semibold text-slate-900">Paracetamol 500 mg</p>
                  <p class="text-xs text-slate-500">Entregado · 12/07/2026</p>
                </div>
                <span class="text-sm font-semibold text-emerald-700">Confirmado</span>
              </article>

              <article class="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
                <div>
                  <p class="text-sm font-semibold text-slate-900">Vitamina D3</p>
                  <p class="text-xs text-slate-500">Retiro programado · 14/07/2026</p>
                </div>
                <span class="text-sm font-semibold text-slate-700">Programado</span>
              </article>
            </div>
          </section>
        </div>

        <aside class="w-full rounded-[32px] bg-white p-4 shadow-xl shadow-emerald-900/10 ring-1 ring-slate-200 sm:p-6 lg:max-w-sm">
          ${brandHeader()}

          <div class="mt-6 rounded-[24px] bg-slate-50 p-4">
            <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Próximo paso</p>
            <h3 class="mt-3 text-lg font-semibold text-slate-900">Confirma tu farmacia y hora de retiro</h3>
            <p class="mt-2 text-sm text-slate-600">Tu solicitud se actualizará automáticamente cuando el farmacéutico confirme la entrega.</p>
          </div>

          <div class="mt-4 rounded-[24px] border border-slate-200 p-4">
            <p class="text-sm font-semibold text-slate-900">Estado de atención</p>
            <div class="mt-3 h-2 rounded-full bg-slate-100">
              <div class="h-2 w-[72%] rounded-full bg-emerald-600"></div>
            </div>
            <p class="mt-3 text-sm text-slate-500">72% de tu proceso completado</p>
          </div>
        </aside>
      </section>
    </main>
  `;
}

export function renderOrders({ navigate, user }) {
  document.getElementById("app").innerHTML = ordersTemplate(user);
}
