// API do módulo: tenta usar backend PHP; fallback localStorage
const ModuleAPI = (function () {
  const base = 'backend/api.php';

  function isBackendAvailable() {
    // tentativa simples: HEAD/GET lines
    return fetch(`${base}?route=pulse`, { method: 'GET' })
      .then(r => r.ok)
      .catch(() => false);
  }

  async function getLines() {
    try {
      const r = await fetch(`${base}?route=lines`);
      if (r.ok) return r.json();
    } catch (e) {}
    const ls = localStorage.getItem('bb_lines');
    return ls ? JSON.parse(ls) : [];
  }

  async function saveLine(line) {
    try {
      const r = await fetch(`${base}?route=lines`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', line }) });
      if (r.ok) return r.json();
    } catch (e) {}
    const lines = await getLines();
    const idx = lines.findIndex(l => l.id === line.id);
    if (idx >= 0) lines[idx] = line; else lines.push(line);
    localStorage.setItem('bb_lines', JSON.stringify(lines));
    return { ok: true, line };
  }

  async function deleteLine(id) {
    try {
      const r = await fetch(`${base}?route=lines`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
      if (r.ok) return r.json();
    } catch (e) {}
    const lines = await getLines();
    const out = lines.filter(l => l.id !== id);
    localStorage.setItem('bb_lines', JSON.stringify(out));
    return { ok: true };
  }

  async function getHosts(query) {
    // mock: usar lista simples ou integrar com Zabbix API futuramente
    const hosts = [
      { id: 'h1', name: 'Core-SP' },
      { id: 'h2', name: 'Core-RJ' },
      { id: 'h3', name: 'PE-Edge-01' },
      { id: 'h4', name: 'DF-Edge-02' },
    ];
    if (!query) return hosts;
    return hosts.filter(h => h.name.toLowerCase().includes(query.toLowerCase()));
  }

  async function getItems() {
    // mock items
    return [
      { key: 'if.in.traffic', label: 'Tráfego In (%)' },
      { key: 'if.out.traffic', label: 'Tráfego Out (%)' },
      { key: 'if.errors', label: 'Erros de Interface' },
      { key: 'latency.rtt', label: 'Latência RTT' },
      { key: 'packet.loss', label: 'Perda de Pacotes' },
    ];
  }

  async function getConfig() {
    try {
      const r = await fetch(`${base}?route=config`);
      if (r.ok) return r.json();
    } catch (e) {}
    const ls = localStorage.getItem('bb_config');
    return ls ? JSON.parse(ls) : { logLevel: 'info', hostSource: 'zabbix_api', mapCenter: [-23.55, -46.63], mapZoom: 5, maxMarkers: 100, permissions: { admins: ['Admin'] }, versions: [] };
  }

  async function getMapCenter() {
    try {
      const r = await fetch(`${base}?route=mapcenter`, { headers: Object.assign({}, Permissions.getAuthHeaders()) });
      if (r.ok) return r.json();
    } catch (e) {}
    const cfg = await getConfig();
    const c = cfg.mapCenter || [-23.55, -46.63];
    return { lat: c[0], lng: c[1] };
  }

  async function saveMapCenter(lat, lng) {
    try {
      const headers = Object.assign({ 'Content-Type': 'application/json' }, Permissions.getAuthHeaders());
      const r = await fetch(`${base}?route=mapcenter`, { method: 'POST', headers, body: JSON.stringify({ lat, lng }) });
      if (r.ok) return r.json();
      const d = await r.json();
      return d;
    } catch (e) {}
    // Fallback local
    const cfg = await getConfig();
    cfg.mapCenter = [lat, lng];
    await saveConfig(cfg);
    return { ok: true };
  }

  async function saveConfig(cfg) {
    try {
      const r = await fetch(`${base}?route=config`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config: cfg }) });
      if (r.ok) return r.json();
    } catch (e) {}
    const prev = await getConfig();
    const version = { ts: Date.now(), cfg };
    prev.versions = prev.versions || [];
    prev.versions.push(version);
    const merged = Object.assign({}, prev, cfg);
    localStorage.setItem('bb_config', JSON.stringify(merged));
    return { ok: true, version };
  }

  async function rollbackConfig(index) {
    const cfg = await getConfig();
    if (!cfg.versions || index < 0 || index >= cfg.versions.length) return { ok: false };
    const target = cfg.versions[index].cfg;
    return saveConfig(target);
  }

  async function getTopology() {
    try {
      const r = await fetch(`${base}?route=topology`);
      if (r.ok) return r.json();
    } catch (e) {}
    const lines = await getLines();
    // construir grafo simples
    const nodes = new Map();
    const edges = [];
    lines.forEach(line => {
      const hs = Array.isArray(line.hosts) ? line.hosts : [];
      hs.forEach(h => nodes.set(h.id, { id: h.id, name: h.name }));
      for (let i = 0; i < hs.length - 1; i++) {
        edges.push({ from: hs[i].id, to: hs[i + 1].id, layer: line.layer || 'default', name: line.name });
      }
    });
    return { nodes: Array.from(nodes.values()), edges };
  }

  return { isBackendAvailable, getLines, saveLine, deleteLine, getHosts, getItems, getConfig, saveConfig, rollbackConfig, getTopology, getMapCenter, saveMapCenter };
})();