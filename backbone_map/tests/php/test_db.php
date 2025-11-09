<?php
// Testes das rotas de DB (não requer DB real para validar erros controlados)

function call($route, $method = 'GET', $payload = null) {
  $_GET['route'] = $route;
  $_SERVER['REQUEST_METHOD'] = $method;
  if ($payload !== null) {
    $GLOBALS['__input'] = json_encode($payload);
    stream_wrapper_unregister('php');
    stream_wrapper_register('php', 'MockPhpStream');
  }
  ob_start(); include __DIR__ . '/../../backend/api.php'; $out = ob_get_clean();
  if ($payload !== null) { stream_wrapper_restore('php'); }
  return json_decode($out, true);
}

class MockPhpStream {
  private $data; private $pos; private $len;
  function stream_open($p,$m,$o,&$op){ $this->data = $GLOBALS['__input']; $this->pos=0; $this->len=strlen($this->data); return true; }
  function stream_read($count){ $ret=substr($this->data,$this->pos,$count); $this->pos+=strlen($ret); return $ret; }
  function stream_eof(){ return $this->pos >= $this->len; }
}

$cfg = call('dbconfig');
assert(isset($cfg['host']) && isset($cfg['name']) && isset($cfg['user']));

$testFail = call('dbtest','POST',['host'=>'localhost','name'=>'db_not_exist','user'=>'nouser','pass'=>'nopass']);
assert(isset($testFail['ok']));

$save = call('dbsave','POST',['host'=>'localhost','name'=>'modulebackbone_dev','user'=>'modulebackbone_dev','pass'=>'modulebackbone_dev']);
assert($save['ok'] === true);

echo "DB routes tests OK\n";