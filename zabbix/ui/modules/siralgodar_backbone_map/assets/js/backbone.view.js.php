<?php
// JS de inicialização simples para a view Backbone Map.
?>
<script>
  (function () {
    const root = document.getElementById('bbmap-root');
    if (!root) return;
    root.innerHTML = '<div style="padding:12px; color:#374151;">Módulo Backbone Map carregado (protótipo). Integração com Leaflet e dados Zabbix será adicionada nesta área.</div>';
    console.info('[BackboneMap] View inicializada.');
  })();
</script>