<?php declare(strict_types=1);

/**
 * View do Backbone Map: recebe $data do controller e constrói HTML.
 * Usa classes de UI do Zabbix quando disponíveis (CWidget, CColHeader, etc.).
 */

/** @var CView $this */

$this->includeJsFile('backbone.view.js.php');

// Em ambiente Zabbix real:
// (new CWidget())
//     ->setTitle(_('Backbone Map'))
//     ->addItem(new CDiv($data['message']))
//     ->addItem(new CDiv([ 'id' => 'bbmap-root' ]))
//     ->show();

// Fallback simplificado: apenas marca o container esperado
echo '<div class="zbx-backbone-map">';
echo '<h2>Backbone Map</h2>';
echo '<div id="bbmap-root" style="min-height:380px;border:1px solid #e5e7eb;border-radius:8px;">';
echo '<!-- Conteúdo do mapa será inicializado via JS em assets/js/backbone.view.js.php -->';
echo '</div>';
echo '</div>';