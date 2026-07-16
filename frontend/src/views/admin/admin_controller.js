import { adminView, renderPharmaciesServiceView, renderUsersServiceView } from './admin_view';
import { admin_controller as initUserService } from '../../services/user_management';
import { pharmacy_controller as initPharmacyService } from '../../services/pharmacy_management';

export function admin_controller() {
  adminView();

  const content = document.getElementById('admin_service_content');
  const navButtons = Array.from(document.querySelectorAll('[data-service]'));

  const setActiveNav = (service) => {
    navButtons.forEach((button) => {
      const isActive = button.dataset.service === service;
      button.classList.toggle('bg-slate-600', isActive);
      button.classList.toggle('text-white', isActive);
      button.classList.toggle('font-semibold', isActive);
    });
  };

  const renderService = (service) => {
    if (!content) return;

    setActiveNav(service);

    if (service === 'pharmacies') {
      content.innerHTML = renderPharmaciesServiceView();
      initPharmacyService();
      return;
    }

    content.innerHTML = renderUsersServiceView();
    initUserService();
  };

  navButtons.forEach((button) => {
    button.addEventListener('click', () => renderService(button.dataset.service));
  });

  renderService('users');
}
