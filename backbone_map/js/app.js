// Inicialização das abas e módulos
(function () {
  const tabs = document.querySelectorAll('.tab-button');
  const panels = document.querySelectorAll('.tab-panel');

  function switchTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    panels.forEach(p => p.classList.toggle('active', p.id === `tab-${name}`));
    if (name === 'backbone') initBackbone();
    if (name === 'topologia') Topology.init();
    if (name === 'configuracao') ConfigPage.init();
    if (name === 'db') DBConfigPage.init();
    if (name === 'mapcenter') MapCenterPage.init();
  }

  tabs.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  async function initBackbone() {
    const cfg = await ModuleAPI.getConfig();
    await ensureDrawPlugin();
    BackboneMap.init(cfg);
  }

  // Fallback: se Leaflet não carregou, use mock local
  function ensureLeafletReady() {
    if (typeof window.L === 'undefined') {
      const s = document.createElement('script');
      s.src = 'js/mock-leaflet.js';
      document.head.appendChild(s);
    }
  }

  async function ensureDrawPlugin(){
    return new Promise((resolve)=>{
      // Carrega Leaflet.draw apenas se Leaflet real estiver disponível
      const isRealLeaflet = typeof window.L !== 'undefined' && typeof L.Handler === 'function' && typeof L.Handler.extend === 'function';
      if(!isRealLeaflet) return resolve();
      if(typeof L.Control !== 'undefined' && typeof L.Control.Draw !== 'undefined') return resolve();
      const scr = document.createElement('script');
      scr.src = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js';
      scr.onload = () => resolve();
      scr.onerror = () => resolve();
      document.head.appendChild(scr);
    });
  }

  ensureLeafletReady();
  // Inicializa painel de incidentes e expõe switchTab
  if (window.IncidentsPanel && typeof IncidentsPanel.init === 'function') {
    IncidentsPanel.init();
  }
  window.switchTab = switchTab;
  // Aba inicial
  switchTab('backbone');
})();