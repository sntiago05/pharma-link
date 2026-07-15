function welcomeTemplate(user) {
  return `
  <main class="min-h-screen bg-slate-50 px-4 py-6 flex items-center justify-center">
    <section class="relative flex min-h-[844px] w-full max-w-[390px] lg:max-w-[1000px] lg:overflow-hidden lg:rounded-[32px] lg:bg-white lg:shadow-xl lg:ring-1 lg:ring-slate-200">
      <img class="absolute left-1/2 top-[147px] w-[85%] -translate-x-1/2 lg:left-[34%] lg:top-[18%] lg:w-[300px] lg:translate-x-0" src="/img/welcomeFigure.png" alt="Welcome image" />

      <section class="absolute inset-x-0 bottom-[180px] px-6 text-center">
        <h1 class="text-[35px] font-medium text-black font-['Poppins']">Welcome to</h1>
        <p class="mt-2 text-[30px] font-medium text-teal-900 font-['Poppins']">
          Pharma<span class="text-lime-600">Link!</span>
        </p>
        <p class="mx-auto mt-3 max-w-[300px] text-[20px] lg:text-[12px] font-normal leading-4 text-zinc-800 font-['Montserrat']">
          Your account has been created successfully.
        </p>
      </section>

      <footer class="absolute inset-x-0 bottom-[90px] flex justify-center px-6">
        <a href="/login" class="flex h-8 w-56 items-center justify-center rounded-md bg-gradient-to-r from-emerald-800 to-emerald-800 text-xs font-medium text-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          Login
        </a>
      </footer>
    </section>
  </main>
  `;
}
export function renderWelcome({ navigate, user }) {
  document.getElementById("app").innerHTML = welcomeTemplate(user);
}