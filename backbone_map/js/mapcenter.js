// Aba Centro Inicial do Mapa: inputs com validação, preview e salvamento
const MapCenterPage = (function(){
  let previewMap;
  let marker;

  function setPreview(lat, lng){
    if(!previewMap){
      previewMap = L.map('mc-preview-map').setView([lat, lng], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(previewMap);
    } else {
      previewMap.setView([lat, lng], previewMap.getZoom());
    }
    if(!marker){ marker = L.marker([lat, lng]).addTo(previewMap); }
    else { marker.setLatLng([lat, lng]); }
  }

  function bindInputs(){
    const latEl = document.getElementById('mc-lat');
    const lngEl = document.getElementById('mc-lng');
    const update = () => {
      const lat = parseFloat(latEl.value);
      const lng = parseFloat(lngEl.value);
      if(Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180){
        setPreview(lat, lng);
      }
    };
    latEl.addEventListener('input', update);
    lngEl.addEventListener('input', update);
  }

  async function loadCurrent(){
    try {
      const d = await ModuleAPI.getMapCenter();
      document.getElementById('mc-lat').value = d.lat;
      document.getElementById('mc-lng').value = d.lng;
      setPreview(d.lat, d.lng);
    } catch (e) {}
  }

  async function save(){
    const lat = parseFloat(document.getElementById('mc-lat').value);
    const lng = parseFloat(document.getElementById('mc-lng').value);
    if(!Number.isFinite(lat) || !Number.isFinite(lng)) { if(window.showToast) showToast('error','Valores inválidos.'); else alert('Valores inválidos.'); return; }
    if(lat < -90 || lat > 90 || lng < -180 || lng > 180) { if(window.showToast) showToast('error','Coordenadas fora do intervalo.'); else alert('Coordenadas fora do intervalo.'); return; }
    const r = await ModuleAPI.saveMapCenter(lat, lng);
    if(r && r.ok){ if(window.showToast) showToast('success','Centro do mapa salvo.'); else alert('Centro do mapa salvo.'); }
    else { const msg = 'Falha ao salvar' + (r && r.error ? ': ' + r.error : ''); if(window.showToast) showToast('error', msg); else alert(msg); }
  }

  function gateAccess(){
    const warn = document.getElementById('mapcenter-admin-warning');
    const form = document.getElementById('mapcenter-form');
    const allowed = Permissions && typeof Permissions.isAdminOrSuper==='function' ? Permissions.isAdminOrSuper() : false;
    if(!allowed){ warn.classList.remove('hidden'); form.classList.add('hidden'); }
    else { warn.classList.add('hidden'); form.classList.remove('hidden'); }
  }

  async function init(){
    gateAccess();
    if(!(Permissions && Permissions.isAdminOrSuper())) return;
    await loadCurrent();
    bindInputs();
    document.getElementById('mc-save').addEventListener('click', save);
  }

  return { init };
})();