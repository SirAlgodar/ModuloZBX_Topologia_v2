// Mock mínimo de Leaflet para ambientes sem CDN
window.L = (function () {
  function Evented() {
    this._events = {};
  }
  Evented.prototype.on = function (name, cb) { (this._events[name] = this._events[name] || []).push(cb); return this; };
  Evented.prototype.off = function (name, cb) { if (!this._events[name]) return this; this._events[name] = this._events[name].filter(f => f !== cb); return this; };
  Evented.prototype.emit = function (name, e) { (this._events[name] || []).forEach(f => f(e)); };

  function latLng(lat, lng) { return { lat, lng }; }

  function Map(id) {
    Evented.call(this);
    this._center = latLng(0, 0);
    this._zoom = 5;
    this._layers = [];
    this._el = document.getElementById(id);
    // canvas simples para visualização mock
    this._canvas = document.createElement('canvas');
    this._canvas.style.width = '100%';
    this._canvas.style.height = '100%';
    this._canvas.width = this._el.clientWidth || 600;
    this._canvas.height = this._el.clientHeight || 400;
    this._el.appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d');
    const self = this;
    window.addEventListener('resize', function(){
      self._canvas.width = self._el.clientWidth || 600;
      self._canvas.height = self._el.clientHeight || 400;
      self._draw();
    });
    this._canvas.addEventListener('mousemove', function(ev){
      const rect = self._canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const ll = self._pointToLatLng(x, y);
      self.emit('mousemove', { latlng: ll });
    });
    this._draw();
  }
  Map.prototype = Object.create(Evented.prototype);
  Map.prototype._degPerPx = function(){ return 0.002; };
  Map.prototype._latLngToPoint = function(ll){
    const cx = this._canvas.width/2;
    const cy = this._canvas.height/2;
    const dpp = this._degPerPx();
    const dx = (ll.lng - this._center.lng) / dpp;
    const dy = (ll.lat - this._center.lat) / dpp;
    return { x: cx + dx, y: cy - dy };
  };
  Map.prototype._pointToLatLng = function(x,y){
    const cx = this._canvas.width/2;
    const cy = this._canvas.height/2;
    const dpp = this._degPerPx();
    const lng = this._center.lng + (x - cx) * dpp;
    const lat = this._center.lat - (y - cy) * dpp;
    return latLng(lat, lng);
  };
  Map.prototype._draw = function(){
    const ctx = this._ctx;
    if(!ctx) return;
    ctx.clearRect(0,0,this._canvas.width,this._canvas.height);
    // fundo
    ctx.fillStyle = '#eef2ff';
    ctx.fillRect(0,0,this._canvas.width,this._canvas.height);
    // grade simples
    ctx.strokeStyle = '#c7d2fe';
    ctx.lineWidth = 1;
    for(let x=0; x<this._canvas.width; x+=40){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,this._canvas.height); ctx.stroke(); }
    for(let y=0; y<this._canvas.height; y+=40){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(this._canvas.width,y); ctx.stroke(); }
    // centro
    const cpt = this._latLngToPoint(this._center);
    ctx.fillStyle = '#111827';
    ctx.beginPath(); ctx.arc(cpt.x, cpt.y, 4, 0, Math.PI*2); ctx.fill();
    // desenhar camadas
    this._layers.forEach(l => {
      if(l && l._latlngs){
        ctx.strokeStyle = l._opts?.color || '#2563eb';
        ctx.lineWidth = l._opts?.weight || 3;
        ctx.beginPath();
        l._latlngs.forEach((ll, idx)=>{
          const p = this._latLngToPoint(ll);
          if(idx===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }
      if(l && l._ll){
        const p = this._latLngToPoint(l._ll);
        ctx.fillStyle = l._opts?.color || '#111827';
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
      }
    });
  };
  Map.prototype.setView = function (c, z) { this._center = latLng(c[0], c[1]); this._zoom = z; this._draw(); return this; };
  Map.prototype.getBounds = function () { return { contains: function () { return true; } }; };
  Map.prototype.latLngToContainerPoint = function (ll) { const p = this._latLngToPoint(ll); return { x: p.x, y: p.y }; };
  Map.prototype.getCenter = function () { return this._center; };
  Map.prototype.addLayer = function (l) { this._layers.push(l); this._draw(); return this; };

  function TileLayer() { }
  TileLayer.prototype.addTo = function (map) { map.addLayer(this); return this; };

  function layerGroup() { return { addTo: function (map) { map.addLayer(this); }, remove: function () {} }; }

  function Polyline(latlngs, opts) { Evented.call(this); this._latlngs = (latlngs || []).map(c => latLng(c[0], c[1])); this._opts = opts || {}; }
  Polyline.prototype = Object.create(Evented.prototype);
  Polyline.prototype.setLatLngs = function (lls) { this._latlngs = lls; return this; };
  Polyline.prototype.addTo = function (map) { map.addLayer(this); return this; };
  Polyline.prototype.remove = function () { };

  function CircleMarker(ll, opts) { Evented.call(this); this._ll = ll; this._opts = opts || {}; this.dragging = { enable() {}, disable() {} }; }
  CircleMarker.prototype = Object.create(Evented.prototype);
  CircleMarker.prototype.addTo = function (map) { map.addLayer(this); return this; };
  CircleMarker.prototype.getLatLng = function () { return this._ll; };
  CircleMarker.prototype.remove = function () { };

  const Handler = { MarkerDrag: function () {} };

  return {
    map: function (id) { return new Map(id); },
    tileLayer: function () { return new TileLayer(); },
    layerGroup,
    polyline: function (lls, opts) { return new Polyline(lls, opts); },
    circleMarker: function (ll, opts) { return new CircleMarker(ll, opts); },
    latLng,
    Handler
  };
})();