function landingTemplate(user) {
  return `
  <main class="min-h-screen bg-slate-50 px-4 py-6 flex items-center justify-center lg:px-8 lg:py-10">
    <section class="w-full max-w-[390px] min-h-[844px] overflow-hidden rounded-[32px] bg-white shadow-xl ring-1 ring-slate-200 relative lg:max-w-6xl lg:min-h-[640px] lg:flex lg:items-center lg:overflow-visible lg:p-8">
      <div class="absolute left-1/2 top-[62.63px] -translate-x-1/2 flex flex-col items-center text-center lg:left-[8%] lg:top-[8%] lg:translate-x-0 lg:items-start lg:text-left">
        <div class="flex items-center gap-2">
          <img class="w-25 h-14" src="./img/logo horizontal.png" alt="Pharma Link logo" />
        </div>
      </div>

      <div class="absolute left-1/2 top-[147px] w-[85%] -translate-x-1/2 text-center lg:left-[8%] lg:top-[24%] lg:w-[45%] lg:translate-x-0 lg:text-left">
        <h1 class="text-black text-2xl font-medium font-['Poppins'] lg:text-4xl">Create your account</h1>
        <p class="mt-3 text-black text-sm font-normal font-['Montserrat'] lg:text-base lg:max-w-md">Join Pharma Link and take care of your health easily.</p>
      </div>

      <img class="absolute left-1/2 top-[233px] w-44 h-36 -translate-x-1/2 lg:left-[58%] lg:top-[18%] lg:w-[420px] lg:h-[320px] lg:translate-x-0" src="https://placehold.co/179x138" alt="App preview" />

      <div class="absolute left-1/2 top-[400px] w-[78%] -translate-x-1/2 space-y-4 text-black lg:left-[8%] lg:top-[54%] lg:w-[46%] lg:translate-x-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        <div class="rounded-2xl bg-emerald-50/60 p-3 lg:p-4">
          <h2 class="text-sm font-semibold font-['Poppins']">Medication Inventory</h2>
          <p class="mt-1 text-[7.77px] font-normal font-['Montserrat'] lg:text-sm">Browse available medications and check stock availability in real time.</p>
        </div>
        <div class="rounded-2xl bg-emerald-50/60 p-3 lg:p-4">
          <h2 class="text-sm font-semibold font-['Poppins']">Easy and fast reservations</h2>
          <p class="mt-1 text-[9.42px] font-normal font-['Montserrat'] lg:text-sm">Reserve your medications in just a few steps.</p>
        </div>
        <div class="rounded-2xl bg-emerald-50/60 p-3 lg:p-4 lg:col-span-2">
          <h2 class="text-sm font-semibold font-['Poppins']">Your health, our priority</h2>
          <p class="mt-1 text-[7.77px] font-normal font-['Montserrat'] lg:text-sm">We are here to help you live better every day.</p>
        </div>
      </div>

      <div class="absolute left-1/2 bottom-[90px] w-[78%] -translate-x-1/2 lg:left-[58%] lg:bottom-[12%] lg:w-[28%] lg:translate-x-0">
        <a href="/register" class="flex h-10 w-full items-center justify-center rounded-lg bg-gradient-to-r from-emerald-800 to-emerald-600 text-white text-sm font-medium shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] lg:h-12">Create account</a>
        <p class="mt-4 text-center text-[15px] text-stone-400 font-normal font-['Montserrat'] lg:text-sm">Already have an account? <a href="/login" class="font-semibold text-emerald-800 hover:text-emerald-900">Log in</a></p>
      </div>
    </section>
  </main>
  `;
}

export function renderLanding({ navigate, user }) {
  document.getElementById("app").innerHTML = landingTemplate(user);
}