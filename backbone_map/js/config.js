// Lógica da aba Configuração: controle de acesso admin, parâmetros e versionamento
const ConfigPage = (function () {
  async function renderPermissions(cfg) {
    const list = document.getElementById('permissions-list');
    list.innerHTML = '';
    const admins = cfg.permissions?.admins || [];
    const row = document.createElement('div');
    row.textContent = 'Admins: ' + (admins.join(', ') || 'Nenhum');
    list.appendChild(row);
  }

  async function loadConfig() {
    const cfg = await ModuleAPI.getConfig();
    document.getElementById('log-level').value = cfg.logLevel || 'info';
    document.getElementById('host-source').value = cfg.hostSource || 'zabbix_api';
    document.getElementById('default-map-center').value = (cfg.mapCenter || []).join(',');
    document.getElementById('default-map-zoom').value = cfg.mapZoom || 5;
    document.getElementById('default-max-markers').value = cfg.maxMarkers || 100;
    renderPermissions(cfg);
    return cfg;
  }

  async function saveConfig() {
    const cfg = {
      logLevel: document.getElementById('log-level').value,
      hostSource: document.getElementById('host-source').value,
      mapCenter: document.getElementById('default-map-center').value.split(',').map(Number),
      mapZoom: Number(document.getElementById('default-map-zoom').value),
      maxMarkers: Number(document.getElementById('default-max-markers').value)
    };
    await ModuleAPI.saveConfig(cfg);
  if(window.showToast) showToast('success','Configurações salvas (versionadas).'); else alert('Configurações salvas (versionadas).');
  }

  async function rollback() {
    const cfg = await ModuleAPI.getConfig();
    const idx = (cfg.versions?.length || 0) - 2; // reverter para penúltima
  if (idx < 0) { if(window.showToast) showToast('info','Sem versões anteriores para reverter.'); else alert('Sem versões anteriores para reverter.'); return; }
    await ModuleAPI.rollbackConfig(idx);
  if(window.showToast) showToast('success','Configuração revertida.'); else alert('Configuração revertida.');
    await loadConfig();
  }

  async function init() {
    const adminWarn = document.getElementById('admin-warning');
    const form = document.getElementById('config-form');
    if (!Permissions.isAdmin()) {
      adminWarn.classList.remove('hidden');
      form.classList.add('hidden');
      return;
    }
    adminWarn.classList.add('hidden');
    form.classList.remove('hidden');
    await loadConfig();
    document.getElementById('save-config').addEventListener('click', saveConfig);
    document.getElementById('rollback-config').addEventListener('click', rollback);
  }

  return { init, loadConfig };
})();