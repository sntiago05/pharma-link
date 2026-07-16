function landingTemplate(user) {
  return `
  <main class="min-h-screen bg-slate-50 px-4 py-6 flex items-center justify-center lg:px-8 lg:py-10">
    <section class="w-full max-w-[390px] min-h-[844px] overflow-hidden lg:rounded-[32px] lg:bg-white lg:shadow-xl lg:ring-1 lg:ring-slate-200 relative lg:max-w-6xl lg:min-h-[640px] lg:flex lg:items-center lg:overflow-visible lg:p-8">
      <div class="absolute left-1/2 top-[62.63px] -translate-x-1/2 flex flex-col items-center text-center lg:left-[8%] lg:top-[8%] lg:translate-x-0 lg:items-start lg:text-left">
        <div class="flex items-center gap-2">
          <img class="w-25 h-14" src="/img/logo%20horizontal.png" alt="Pharma Link logo" />
        </div>
      </div>

      <div class="absolute left-1/2 top-[147px] w-[85%] -translate-x-1/2 text-center lg:left-[8%] lg:top-[24%] lg:w-[45%] lg:translate-x-0 lg:text-left">
        <h1 class="text-black text-2xl font-medium font-['Poppins'] lg:text-4xl">Create your account</h1>
        <p class="mt-3 text-black text-sm font-normal font-['Montserrat'] lg:text-base lg:max-w-md">Join Pharma Link and take care of your health easily.</p>
      </div>

      <img class="absolute left-1/2 top-[233px] w-44 -translate-x-1/2 lg:left-[58%] lg:top-[18%] lg:w-[320px] lg:translate-x-0" src="/img/landingImg.png" alt="App preview" />

      <div class="absolute left-1/2 top-[400px] w-[78%] -translate-x-1/2 space-y-4 text-black lg:left-[8%] lg:top-[54%] lg:w-[46%] lg:translate-x-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        
        <div class="flex gap-[10px] rounded-2xl bg-emerald-50/60 p-3 lg:p-4">
          <div data-svg-wrapper class="flex items-center justify-center">
            <svg width="45" height="40" viewBox="0 0 45 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.9399 0.186522C16.0959 0.275009 16.232 0.391741 16.3403 0.53005C16.4487 0.668359 16.5272 0.825535 16.5715 0.9926C16.6157 1.15967 16.6247 1.33335 16.5981 1.50372C16.5714 1.6741 16.5096 1.83783 16.4161 1.98557L9.36679 13.1129H34.9337L27.8816 1.98557C27.6929 1.68718 27.6371 1.33001 27.7264 0.992624C27.8157 0.655238 28.0428 0.365274 28.3579 0.186522C28.6729 0.00776999 29.05 -0.0451283 29.4062 0.0394642C29.7624 0.124057 30.0685 0.339211 30.2572 0.637595L38.1621 13.1129H42.9161C43.2833 13.1129 43.6354 13.251 43.895 13.4969C44.1546 13.7429 44.3005 14.0764 44.3005 14.4241V17.0467C44.3005 17.3944 44.1546 17.7279 43.895 17.9739C43.6354 18.2198 43.2833 18.3579 42.9161 18.3579H1.38439C1.01723 18.3579 0.665102 18.2198 0.405479 17.9739C0.145855 17.7279 0 17.3944 0 17.0467V14.4241C0 14.0764 0.145855 13.7429 0.405479 13.4969C0.665102 13.251 1.01723 13.1129 1.38439 13.1129H6.13839L14.0377 0.637595C14.1311 0.489826 14.2544 0.360939 14.4004 0.258294C14.5464 0.155649 14.7124 0.0812572 14.8888 0.0393691C15.0651 -0.00251891 15.2485 -0.0110829 15.4284 0.014166C15.6083 0.0394149 15.7839 0.097982 15.9399 0.186522ZM6.83335 37.8327L2.61096 20.9804H41.6895L37.4671 37.8327C37.3578 38.2617 37.0993 38.6434 36.7332 38.9165C36.3671 39.1895 35.9147 39.338 35.4487 39.338H8.85179C8.38535 39.3386 7.9323 39.1904 7.56563 38.9173C7.19896 38.6442 6.94281 38.2622 6.83335 37.8327Z" fill="#248657"/>
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-semibold font-['Poppins']">Medication Inventory</h2>
            <p class="mt-1 text-[7.77px] font-normal font-['Montserrat'] lg:text-sm">Browse available medications and check stock availability in real time.</p>
          </div>
        </div>

        <div class="flex gap-[10px] rounded-2xl bg-emerald-50/60 p-3 lg:p-4">
          <div class="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="43" height="41" fill="#0d4d2a" class="bi bi-shield-fill-check" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.8 11.8 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7 7 0 0 0 1.048-.625 11.8 11.8 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.54 1.54 0 0 0-1.044-1.263 63 63 0 0 0-2.887-.87C9.843.266 8.69 0 8 0m2.146 5.146a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793z"/>
            </svg>
          </div>
          
          <div>
            <h2 class="text-sm font-semibold font-['Poppins']">Easy and fast reservations</h2>
            <p class="mt-1 text-[9.42px] font-normal font-['Montserrat'] lg:text-sm">Reserve your medications in just a few steps.</p>
          </div>
        </div>

        <div class="flex gap-[10px] rounded-2xl bg-emerald-50/60 p-3 lg:p-4 lg:col-span-2">
          <div data-svg-wrapper class="">
            <svg width="43" height="41" viewBox="0 0 43 41" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M26.833 2.1971C26.1155 1.50161 25.2584 0.948974 24.3122 0.571669C23.366 0.194363 22.3497 0 21.3231 0C20.2964 0 19.2802 0.194363 18.334 0.571669C17.3877 0.948974 16.5307 1.50161 15.8132 2.1971L14.1551 3.80794L11.7827 3.78017C10.7558 3.76866 9.73676 3.95175 8.78562 4.31869C7.83447 4.68562 6.97038 5.22899 6.24417 5.91683C5.51796 6.60468 4.94429 7.42312 4.55689 8.32402C4.16949 9.22492 3.97619 10.1901 3.98834 11.1628L4.015 13.4099L2.31964 14.9803C1.58536 15.6599 1.0019 16.4717 0.603553 17.3679C0.205204 18.2642 0 19.2268 0 20.1992C0 21.1716 0.205204 22.1342 0.603553 23.0304C1.0019 23.9266 1.58536 24.7384 2.31964 25.418L4.01766 26.9884L3.98834 29.2355C3.97619 30.2082 4.16949 31.1734 4.55689 32.0743C4.94429 32.9752 5.51796 33.7937 6.24417 34.4815C6.97038 35.1693 7.83447 35.7127 8.78562 36.0796C9.73676 36.4466 10.7558 36.6297 11.7827 36.6182L14.1551 36.5929L15.8132 38.1987C16.5307 38.8942 17.3877 39.4468 18.334 39.8241C19.2802 40.2014 20.2964 40.3958 21.3231 40.3958C22.3497 40.3958 23.366 40.2014 24.3122 39.8241C25.2584 39.4468 26.1155 38.8942 26.833 38.1987L28.491 36.5904L30.8635 36.6182C31.8904 36.6297 32.9094 36.4466 33.8606 36.0796C34.8117 35.7127 35.6758 35.1693 36.402 34.4815C37.1282 33.7937 37.7019 32.9752 38.0893 32.0743C38.4767 31.1734 38.67 30.2082 38.6578 29.2355L38.6312 26.9884L40.3265 25.418C41.0608 24.7384 41.6443 23.9266 42.0426 23.0304C42.441 22.1342 42.6462 21.1716 42.6462 20.1992C42.6462 19.2268 42.441 18.2642 42.0426 17.3679C41.6443 16.4717 41.0608 15.6599 40.3265 14.9803L38.6285 13.4099L38.6578 11.1628C38.67 10.1901 38.4767 9.22492 38.0893 8.32402C37.7019 7.42312 37.1282 6.60468 36.402 5.91683C35.6758 5.22899 34.8117 4.68562 33.8606 4.31869C32.9094 3.95175 31.8904 3.76866 30.8635 3.78017L28.491 3.80542L26.833 2.1971ZM27.598 17.3057L19.6011 24.8802C19.4773 24.9978 19.3302 25.091 19.1683 25.1547C19.0063 25.2183 18.8327 25.2511 18.6574 25.2511C18.4821 25.2511 18.3085 25.2183 18.1466 25.1547C17.9847 25.091 17.8376 24.9978 17.7138 24.8802L13.7153 21.093C13.5914 20.9756 13.4931 20.8362 13.426 20.6829C13.359 20.5295 13.3244 20.3652 13.3244 20.1992C13.3244 20.0332 13.359 19.8688 13.426 19.7155C13.4931 19.5621 13.5914 19.4227 13.7153 19.3054C13.8392 19.188 13.9863 19.0949 14.1483 19.0314C14.3102 18.9678 14.4837 18.9352 14.659 18.9352C14.8342 18.9352 15.0077 18.9678 15.1697 19.0314C15.3316 19.0949 15.4787 19.188 15.6026 19.3054L18.6574 22.2014L25.7108 15.5181C25.961 15.2811 26.3005 15.1479 26.6544 15.1479C27.0083 15.1479 27.3478 15.2811 27.598 15.5181C27.8483 15.7552 27.9889 16.0767 27.9889 16.4119C27.9889 16.7472 27.8483 17.0687 27.598 17.3057Z" fill="#248657"/>
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-semibold font-['Poppins']">Your health, our priority</h2>
            <p class="mt-1 text-[7.77px] font-normal font-['Montserrat'] lg:text-sm">We are here to help you live better every day.</p>
          </div>
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