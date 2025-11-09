<?php
// Leitura/escrita de arquivo .env

$ENV_PATH = realpath(__DIR__ . '/../../.env');

function env_parse($content) {
  $lines = preg_split('/\r?\n/', $content);
  $out = [];
  foreach ($lines as $line) {
    $line = trim($line);
    if ($line === '' || str_starts_with($line, '#')) continue;
    $parts = explode('=', $line, 2);
    if (count($parts) === 2) $out[$parts[0]] = $parts[1];
  }
  return $out;
}

function env_stringify($arr) {
  $keys = ['DB_HOST','DB_NAME','DB_USER','DB_PASS','DB_PASS_ENC','ENV_SECRET'];
  $buf = [];
  foreach ($keys as $k) {
    if (isset($arr[$k])) $buf[] = $k . '=' . $arr[$k];
  }
  return implode("\n", $buf) . "\n";
}

function env_read() {
  global $ENV_PATH;
  if (!file_exists($ENV_PATH)) return [];
  $c = file_get_contents($ENV_PATH);
  return env_parse($c);
}

function env_write($arr) {
  global $ENV_PATH;
  $c = env_stringify($arr);
  file_put_contents($ENV_PATH, $c, LOCK_EX);
  @chmod($ENV_PATH, 0600); // restrito
}