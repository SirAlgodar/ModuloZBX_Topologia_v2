/*
  Adapter inspirado na API de tkrajina/leaflet-editable-polyline
  Fornece uma classe PolylineEditor com recursos básicos:
  - markers de pontos editáveis (drag, right-click para remover com confirmação)
  - markers de pontos médios para adicionar novos pontos
  - visibilidade condicionada por maxMarkers e pontos dentro dos bounds
  - getPoints() retorna lista com latLng e context
*/
(function () {
  function createMiddleMarker(map, latlngA, latlngB, onCreatePoint) {
    const mid = L.latLng((latlngA.lat + latlngB.lat) / 2, (latlngA.lng + latlngB.lng) / 2);
    const m = L.circleMarker(mid, { radius: 5, color: '#f59e0b', weight: 2 });
    m.on('mousedown', function () {
      // arrastar para criar novo ponto
      function onMove(e) {
        const newLatLng = e.latlng;
        onCreatePoint(newLatLng);
        map.off('mousemove', onMove);
      }
      map.on('mousemove', onMove);
    });
    m.on('contextmenu', function (e) {
      // split: cria um novo ponto no meio
      onCreatePoint(e.latlng);
    });
    return m;
  }

  function defineEditor() {
    L.Polyline = L.Polyline || {};
    L.Polyline.PolylineEditor = function (coordinates, options, contexts) {
      const opts = Object.assign({ color: '#2563eb', weight: 3, maxMarkers: 100 }, options || {});
      const polyline = L.polyline(coordinates || [], opts);
      const points = (coordinates || []).map((c, i) => ({ latlng: L.latLng(c[0], c[1]), context: contexts ? contexts[i] || null : null }));
      const markers = [];
      const middleMarkers = [];
      let mapRef = null;

    function refreshPolyline() {
      polyline.setLatLngs(points.map(p => p.latlng));
      refreshMarkers();
    }

    function inBoundsCount() {
      if (!mapRef) return 0;
      const b = mapRef.getBounds();
      return points.filter(p => b.contains(p.latlng)).length;
    }

    function clearMarkers() {
      markers.forEach(m => m.remove());
      markers.length = 0;
      middleMarkers.forEach(m => m.remove());
      middleMarkers.length = 0;
    }

    function refreshMarkers() {
      clearMarkers();
      if (!mapRef) return;
      if (inBoundsCount() > opts.maxMarkers) return; // não mostra se excede
      const latlngs = points.map(p => p.latlng);
      latlngs.forEach((ll, idx) => {
        const mk = L.circleMarker(ll, { radius: 6, color: '#111827', weight: 2, fillColor: '#fff', fillOpacity: 1 })
          .on('drag', () => {})
          .on('contextmenu', function (e) {
            if (window.confirm('Confirmar exclusão do ponto?')) {
              points.splice(idx, 1);
              refreshPolyline();
            }
          })
          .on('mousedown', function () {
            mk.dragging.enable();
          })
          .on('mouseup', function () {
            mk.dragging.disable();
            const newPos = mk.getLatLng();
            points[idx].latlng = newPos;
            refreshPolyline();
          });
        mk.dragging = new L.Handler.MarkerDrag(mk);
        mk.addTo(mapRef);
        markers.push(mk);
      });
      // middle markers
      for (let i = 0; i < latlngs.length - 1; i++) {
        const mm = createMiddleMarker(mapRef, latlngs[i], latlngs[i + 1], function (newLL) {
          const newPoint = { latlng: newLL, context: { originalPointNo: i + 1, originalPolylineNo: 0 } };
          points.splice(i + 1, 0, newPoint);
          refreshPolyline();
        });
        mm.addTo(mapRef);
        middleMarkers.push(mm);
      }
    }

    polyline.addToMap = function (map) {
      mapRef = map;
      polyline.addTo(map);
      refreshMarkers();
      map.on('moveend zoomend', refreshMarkers);
      return polyline;
    };

    polyline.getPoints = function () {
      return points.map(p => ({ getLatLng: () => p.latlng, context: p.context }));
    };

    polyline.addPointStart = function () {
      if (!mapRef) return;
      const c = mapRef.getCenter();
      points.unshift({ latlng: c, context: { originalPointNo: 0, originalPolylineNo: 0 } });
      refreshPolyline();
    };

    polyline.addPointEnd = function () {
      if (!mapRef) return;
      const c = mapRef.getCenter();
      points.push({ latlng: c, context: { originalPointNo: points.length, originalPolylineNo: 0 } });
      refreshPolyline();
    };

    polyline.remove = function () {
      clearMarkers();
      if (mapRef) {
        mapRef.off('moveend zoomend', refreshMarkers);
      }
      polyline.remove();
    };

    polyline.__pointsRef = points; // para acesso interno

      return polyline;
    };
  }

  function ensureDefined() {
    if (typeof window.L === 'undefined') {
      const timer = setInterval(function () {
        if (typeof window.L !== 'undefined') {
          clearInterval(timer);
          try { defineEditor(); } catch (e) { console.error('Falha ao definir PolylineEditor', e); }
        }
      }, 50);
    } else {
      defineEditor();
    }
  }

  ensureDefined();
})();