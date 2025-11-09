// UI/UX complementos: menu de configuração à direita e acessibilidade
(function(){
  function onReady(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  onReady(function(){
    const menuToggle = document.getElementById('config-menu-toggle');
    const dropdown = document.getElementById('config-dropdown');
    if(menuToggle && dropdown){
      // Gating dos itens do menu de configuração
      const gateSettingsMenu = () => {
        const isAllowed = Permissions && typeof Permissions.isAdminOrSuper === 'function' ? Permissions.isAdminOrSuper() : false;
        const items = dropdown.querySelectorAll('.dropdown-item');
        items.forEach(it => {
          const tab = it.dataset.tab;
          const requiresAdmin = (tab === 'configuracao' || tab === 'db' || tab === 'mapcenter');
          it.style.display = requiresAdmin && !isAllowed ? 'none' : '';
        });
      };
      gateSettingsMenu();
      document.addEventListener('editing:change', gateSettingsMenu);

      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = dropdown.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      dropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const tab = item.dataset.tab;
          dropdown.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
          if(typeof window.switchTab === 'function'){
            window.switchTab(tab);
          } else {
            const btn = document.querySelector(`.tab-button[data-tab="${tab}"]`);
            if(btn) btn.click();
          }
        });
      });
      document.addEventListener('click', () => {
        dropdown.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
      document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape'){
          dropdown.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  });
})();