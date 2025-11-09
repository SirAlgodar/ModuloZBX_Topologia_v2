// Lógica da aba Backbone: mapa Leaflet, edição de linhas, camadas e tooltips
const BackboneMap = (function () {
  let map;
  let currentLine = null; // objeto do editor
  let currentLineData = null; // metadados da linha
  const layers = new Map(); // nome -> group layer
  const polylines = new Map(); // id -> { editor, data }
  let tooltipEl;
  let isEditing = false;
  let layerOrder = [];

  function initMap(cfg) {
    const center = cfg.mapCenter || [-23.55, -46.63];
    const zoom = cfg.mapZoom || 5;
    map = L.map('map').setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    // Grupo para desenhos Leaflet.draw (polígonos/regiões)
    try {
      if (L && L.FeatureGroup) {
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        if (L.Control && L.Control.Draw) {
          const drawControl = new L.Control.Draw({
            edit: { featureGroup: drawnItems },
            draw: {
              polygon: { showArea: true, allowIntersection: false },
              polyline: false,
              rectangle: true,
              circle: false,
              marker: false,
              circlemarker: false
            }
          });
          map.addControl(drawControl);
          map.on(L.Draw.Event.CREATED, function (e) {
            drawnItems.addLayer(e.layer);
          });
          map.on(L.Draw.Event.EDITED, function () { /* futuras integrações */ });
          map.on(L.Draw.Event.DELETED, function () { /* futuras integrações */ });
        }
      }
    } catch (err) { console.warn('Leaflet.draw não disponível', err); }
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'tooltip';
    tooltipEl.style.display = 'none';
    document.body.appendChild(tooltipEl);
  }

  function showTooltip(html, latlng) {
    tooltipEl.innerHTML = html;
    const p = map.latLngToContainerPoint(latlng);
    tooltipEl.style.left = `${p.x + 12}px`;
    tooltipEl.style.top = `${p.y + 12}px`;
    tooltipEl.style.display = 'block';
  }

  function hideTooltip() {
    tooltipEl.style.display = 'none';
  }

  function createLayer(name) {
    if (layers.has(name)) return layers.get(name);
    const g = L.layerGroup();
    layers.set(name, g);
    g.addTo(map);
    if(!layerOrder.includes(name)) layerOrder.push(name);
    renderLayersPanel();
    return g;
  }

  function renderLayersPanel() {
    const el = document.getElementById('layers-panel');
    el.innerHTML = '';
    const order = layerOrder.length ? layerOrder : Array.from(layers.keys());
    order.forEach(name => {
      const group = layers.get(name);
      if(!group) return;
      const row = document.createElement('div');
      row.className = 'legend-item';
      const colorBox = document.createElement('span');
      colorBox.className = 'legend-color';
      colorBox.style.background = '#2563eb';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = map.hasLayer(group);
      cb.onchange = () => {
        if (cb.checked) { group.addTo(map); } else { if(group.removeFrom) group.removeFrom(map); else map.removeLayer(group); }
        applyLayerOrder();
      };
      const label = document.createElement('span');
      label.textContent = name;
      const controls = document.createElement('span');
      controls.className = 'layer-order-controls';
      const up = document.createElement('button'); up.className='order-btn'; up.title='Subir'; up.innerHTML='<i class="fa-solid fa-chevron-up"></i>';
      const down = document.createElement('button'); down.className='order-btn'; down.title='Descer'; down.innerHTML='<i class="fa-solid fa-chevron-down"></i>';
      up.onclick = () => { moveLayer(name, -1); };
      down.onclick = () => { moveLayer(name, 1); };
      controls.appendChild(up); controls.appendChild(down);
      row.appendChild(colorBox);
      row.appendChild(cb);
      row.appendChild(label);
      row.appendChild(controls);
      el.appendChild(row);
    });
  }

  function moveLayer(name, delta){
    const idx = layerOrder.indexOf(name);
    if(idx < 0) return;
    const newIdx = Math.max(0, Math.min(layerOrder.length-1, idx + delta));
    if(newIdx === idx) return;
    layerOrder.splice(idx, 1);
    layerOrder.splice(newIdx, 0, name);
    renderLayersPanel();
    applyLayerOrder();
  }

  function applyLayerOrder(){
    // Aplica bringToFront na ordem definida para manter hierarquia de sobreposição
    layerOrder.forEach(name => {
      polylines.forEach(entry => {
        if(entry.data.layer === name){
          if(typeof entry.editor.bringToFront === 'function') entry.editor.bringToFront();
        }
      });
    });
  }

  function bindForm(cfg) {
    const nameEl = document.getElementById('line-name');
    const hostSearchEl = document.getElementById('host-search');
    const hostSelectEl = document.getElementById('host-select');
    const ifaceEl = document.getElementById('interface-select');
    const tracerTargetEl = document.getElementById('traceroute-target');
    const tracerHopsEl = document.getElementById('traceroute-hops');
    const itemsEl = document.getElementById('items-checkboxes');

    ModuleAPI.getItems().then(items => {
      itemsEl.innerHTML = '';
      items.forEach(it => {
        const row = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = it.key;
        row.appendChild(cb);
        row.appendChild(document.createTextNode(' ' + it.label));
        itemsEl.appendChild(row);
      });
    });

    hostSearchEl.addEventListener('input', async function () {
      const list = await ModuleAPI.getHosts(hostSearchEl.value);
      hostSelectEl.innerHTML = '';
      list.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h.id; opt.textContent = h.name; hostSelectEl.appendChild(opt);
      });
    });

    document.getElementById('save-line').addEventListener('click', async function () {
      if (!currentLine) {
  if(window.showToast) showToast('info','Nenhuma linha em edição. Clique no mapa para iniciar uma linha.'); else alert('Nenhuma linha em edição. Clique no mapa para iniciar uma linha.');
        return;
      }
      const points = currentLine.getPoints().map(p => p.getLatLng());
      const items = Array.from(itemsEl.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
      const hostsSel = [];
      Array.from(hostSelectEl.selectedOptions).forEach(opt => hostsSel.push({ id: opt.value, name: opt.textContent }));
      currentLineData = Object.assign(currentLineData || {}, {
        id: currentLineData?.id || `line_${Date.now()}`,
        name: nameEl.value || 'Linha sem nome',
        ifaceMode: ifaceEl.value,
        traceroute: { target: tracerTargetEl.value, hops: Number(tracerHopsEl.value || 30) },
        items,
        hosts: hostsSel,
        coords: points.map(ll => [ll.lat, ll.lng]),
        layer: currentLineData?.layer || 'default',
      });
      await ModuleAPI.saveLine(currentLineData);
      polylines.set(currentLineData.id, { editor: currentLine, data: currentLineData });
  if(window.showToast) showToast('success','Linha salva com sucesso.'); else alert('Linha salva com sucesso.');
      renderLayersPanel();
      // Encerrar modo de edição e voltar aos incidentes
      currentLine = null; currentLineData = null; isEditing = false;
      document.dispatchEvent(new CustomEvent('editing:change', { detail: { isEditing, hosts: getActiveHosts() } }));
    });

    document.getElementById('delete-line').addEventListener('click', async function () {
  if (!currentLineData) { if(window.showToast) showToast('info','Nenhuma linha selecionada para exclusão.'); else alert('Nenhuma linha selecionada para exclusão.'); return; }
      if (!confirm('Confirmar exclusão desta linha?')) return;
      await ModuleAPI.deleteLine(currentLineData.id);
      const entry = polylines.get(currentLineData.id);
      if (entry) {
        entry.editor.remove();
      }
      polylines.delete(currentLineData.id);
      currentLine = null; currentLineData = null;
  if(window.showToast) showToast('success','Linha excluída.'); else alert('Linha excluída.');
      isEditing = false;
      document.dispatchEvent(new CustomEvent('editing:change', { detail: { isEditing, hosts: getActiveHosts() } }));
    });

    document.getElementById('add-layer').addEventListener('click', function () {
      const name = document.getElementById('new-layer-name').value.trim();
      if (!name) return;
      createLayer(name);
      document.getElementById('new-layer-name').value = '';
      // Ao adicionar nova camada, limpar o mapa para edição desta camada
      clearMapForNewLayer(name);
    });
  }

  function loadExistingLines(cfg) {
    ModuleAPI.getLines().then(lines => {
      lines.forEach(line => {
        const layerGroup = createLayer(line.layer || 'default');
        const editor = L.Polyline.PolylineEditor(line.coords, { maxMarkers: cfg.maxMarkers || 100, color: '#2563eb' });
        editor.addToMap(map);
        editor.addTo(layerGroup);
        editor.on('mouseover', function (e) {
          const trafficPct = Math.floor(Math.random() * 80) + 10; // mock
          const alarms = Math.random() < 0.2 ? 'Alarme ativo' : 'OK';
          const html = `<strong>${line.name}</strong><br/>Tráfego: ${trafficPct}%<br/>Itens: ${line.items?.join(', ') || '—'}<br/>Alarmes: ${alarms}`;
          showTooltip(html, e.latlng || editor.__pointsRef[0]?.latlng || map.getCenter());
        });
        editor.on('mouseout', hideTooltip);
        polylines.set(line.id, { editor, data: line });
      });
      // Ativar camada principal por padrão
      const main = layers.get('default') || createLayer('default');
      if (!map.hasLayer(main)) main.addTo(map);
    });
  }

  function setupMapInteractions(cfg) {
    // Clique simples: iniciar nova linha se não houver
    map.on('click', function (e) {
      if (!currentLine) {
        currentLine = L.Polyline.PolylineEditor([[e.latlng.lat, e.latlng.lng]], { maxMarkers: cfg.maxMarkers || 100 });
        currentLine.addToMap(map);
        currentLineData = { name: '', layer: 'default', items: [], hosts: [] };
        isEditing = true;
        document.dispatchEvent(new CustomEvent('editing:change', { detail: { isEditing } }));
      } else {
        // adicionar ponto no final ao clicar
        currentLine.addPointEnd();
      }
    });

    // Duplo clique: criar nova linha
    map.on('dblclick', function () {
      currentLine = null; currentLineData = null;
      isEditing = false;
      document.dispatchEvent(new CustomEvent('editing:change', { detail: { isEditing, hosts: getActiveHosts() } }));
    });
  }

  function clearMapForNewLayer(layerName){
    // Remove todos polylines do mapa, prepara edição na camada nova
    polylines.forEach(entry => { entry.editor.remove(); });
    polylines.clear();
    layers.forEach(g => { g.remove(); });
    const g = createLayer(layerName);
    g.addTo(map);
    isEditing = true;
    document.dispatchEvent(new CustomEvent('editing:change', { detail: { isEditing } }));
  }

  function getActiveHosts(){
    const set = new Set();
    polylines.forEach(entry => (entry.data.hosts||[]).forEach(h => set.add(h.name || h.id)));
    return Array.from(set);
  }

  function startNewLineFromModal(payload){
    // Pré-cria metadados e inicia editor na camada atual (default)
    currentLineData = {
      id: `line_${Date.now()}`,
      name: payload.name,
      ifaceMode: payload.iface,
      traceroute: payload.traceroute,
      items: [],
      hosts: [{ id: payload.host, name: payload.host }],
      coords: [],
      layer: 'default'
    };
    const c = map.getCenter();
    currentLine = L.Polyline.PolylineEditor([[c.lat, c.lng]], { maxMarkers: 100, color: '#2563eb' });
    currentLine.addToMap(map);
    const grp = createLayer('default');
    currentLine.addTo(grp);
    isEditing = true;
    document.dispatchEvent(new CustomEvent('editing:change', { detail: { isEditing } }));
    // Preenchimento no editor lateral
    const nameEl = document.getElementById('line-name');
    const ifaceEl = document.getElementById('interface-select');
    const tracerTargetEl = document.getElementById('traceroute-target');
    const tracerHopsEl = document.getElementById('traceroute-hops');
    if(nameEl) nameEl.value = payload.name;
    if(ifaceEl) ifaceEl.value = payload.iface;
    if(tracerTargetEl) tracerTargetEl.value = payload.traceroute?.target || '';
    if(tracerHopsEl) tracerHopsEl.value = String(payload.traceroute?.hops || 30);
  }

  function init(cfg) {
    initMap(cfg);
    bindForm(cfg);
    renderLayersPanel();
    setupMapInteractions(cfg);
    loadExistingLines(cfg);
    // Sinaliza estado inicial (não editando) para mostrar incidentes
    isEditing = false;
    document.dispatchEvent(new CustomEvent('editing:change', { detail: { isEditing, hosts: getActiveHosts() } }));
  }

  return { init, startNewLineFromModal };
})();