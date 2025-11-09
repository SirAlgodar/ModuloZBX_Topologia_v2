<?php
// Testes básicos do backend PHP
// Execute via: php tests/php/test_api.php

function req($route, $method = 'GET', $body = null) {
  $url = __DIR__ . '/../../backend/api.php?route=' . $route;
  $_GET['route'] = $route;
  $_SERVER['REQUEST_METHOD'] = $method;
  if ($body !== null) {
    $GLOBALS['__input'] = json_encode($body);
    stream_wrapper_unregister('php');
    stream_wrapper_register('php', 'MockPhpStream');
  }
  ob_start();
  include __DIR__ . '/../../backend/api.php';
  $out = ob_get_clean();
  if ($body !== null) { stream_wrapper_restore('php'); }
  return json_decode($out, true);
}

class MockPhpStream {
  private $index;
  private $length;
  private $data;
  function stream_open($path, $mode, $options, &$opened_path) {
    $this->data = $GLOBALS['__input'];
    $this->length = strlen($this->data);
    $this->index = 0; return true;
  }
  function stream_read($count) {
    $ret = substr($this->data, $this->index, $count);
    $this->index += strlen($ret); return $ret;
  }
  function stream_eof() { return $this->index >= $this->length; }
}

// Pulse
$pulse = req('pulse');
assert($pulse['ok'] === true);

// Save config
$saveCfg = req('config', 'POST', ['config' => ['logLevel' => 'debug']]);
assert($saveCfg['ok'] === true);

// Save line
$line = ['id' => 'php_line', 'name' => 'Linha PHP', 'coords' => [[0,0],[1,1]], 'hosts' => [['id'=>'h1','name'=>'A'], ['id'=>'h2','name'=>'B']]];
$saveLine = req('lines', 'POST', ['action' => 'save', 'line' => $line]);
assert($saveLine['ok'] === true);

// Get topology
$topo = req('topology');
assert(is_array($topo['nodes']) && is_array($topo['edges']));

echo "Tests OK\n";