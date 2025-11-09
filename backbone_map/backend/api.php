<?php
// Backend simples para o módulo Mapa Backbone (protótipo)
// Observação: em um módulo Zabbix real, utilize sessões e ACLs do Zabbix.

header('Content-Type: application/json');

$root = __DIR__;
$ENV_FILE = realpath($root . '/../../.env');
require_once __DIR__ . '/env.php';
require_once __DIR__ . '/crypto.php';

$dataDir = __DIR__ . '/../data';
if (!is_dir($dataDir)) {
  mkdir($dataDir, 0777, true);
}

$route = $_GET['route'] ?? 'pulse';

function require_admin_or_super(){
  $env = env_read();
  $secret = $env['ENV_SECRET'] ?? '';
  $role = isset($_SERVER['HTTP_X_ROLE']) ? strtolower($_SERVER['HTTP_X_ROLE']) : '';
  $auth = $_SERVER['HTTP_X_AUTH'] ?? '';
  if (!in_array($role, ['admin','superadmin']) || $secret === '' || $auth !== $secret) {
    http_response_code(403);
    echo json_encode(['error' => 'forbidden']);
    exit;
  }
}

function db_pdo(){
  $env = env_read();
  $host = $env['DB_HOST'] ?? '';
  $name = $env['DB_NAME'] ?? '';
  $user = $env['DB_USER'] ?? '';
  $pass = $env['DB_PASS'] ?? '';
  $enc = $env['DB_PASS_ENC'] ?? '';
  $secret = $env['ENV_SECRET'] ?? '';
  if ($pass === '' && $enc !== '' && $secret !== '') {
    $pass = crypto_decrypt($enc, $secret);
  }
  if ($host === '' || $name === '' || $user === '') return null;
  try {
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $host, $name);
    $opt = [ PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false ];
    return new PDO($dsn, $user, $pass, $opt);
  } catch (Throwable $e) { return null; }
}

function readJson($path, $fallback) {
  if (file_exists($path)) {
    $c = file_get_contents($path);
    $j = json_decode($c, true);
    if ($j !== null) return $j;
  }
  return $fallback;
}

function writeJson($path, $data) {
  file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

switch ($route) {
  case 'pulse':
    echo json_encode(['ok' => true]);
    break;
  case 'dbconfig':
    // Lê dados do .env; não expõe senha em claro
    $env = env_read();
    $resp = [
      'host' => $env['DB_HOST'] ?? '',
      'name' => $env['DB_NAME'] ?? '',
      'user' => $env['DB_USER'] ?? '',
      'hasPass' => isset($env['DB_PASS']) || isset($env['DB_PASS_ENC']),
    ];
    echo json_encode($resp);
    break;
  case 'dbsave':
    require_admin_or_super();
    // Salva configurações no .env com criptografia da senha
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'method not allowed']); break; }
    $payload = json_decode(file_get_contents('php://input'), true);
    $host = trim($payload['host'] ?? '');
    $name = trim($payload['name'] ?? '');
    $user = trim($payload['user'] ?? '');
    $pass = $payload['pass'] ?? '';
    $env = env_read();
    $secret = $env['ENV_SECRET'] ?? 'change_me';
    if ($host === '' || $name === '' || $user === '') { http_response_code(400); echo json_encode(['error'=>'invalid fields']); break; }
    $env['DB_HOST'] = $host;
    $env['DB_NAME'] = $name;
    $env['DB_USER'] = $user;
    if ($pass !== '') {
      $env['DB_PASS_ENC'] = crypto_encrypt($pass, $secret);
      unset($env['DB_PASS']);
    }
    env_write($env);
    echo json_encode(['ok' => true]);
    break;
  case 'dbtest':
    // Testa conexão PDO ao MariaDB
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'method not allowed']); break; }
    $payload = json_decode(file_get_contents('php://input'), true);
    $host = trim($payload['host'] ?? '');
    $name = trim($payload['name'] ?? '');
    $user = trim($payload['user'] ?? '');
    $pass = $payload['pass'] ?? '';
    try {
      $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $host, $name);
      $opt = [ PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false ];
      $pdo = new PDO($dsn, $user, $pass, $opt);
      $stmt = $pdo->query('SELECT 1');
      $ok = $stmt !== false;
      echo json_encode(['ok' => $ok]);
    } catch (Throwable $e) {
      http_response_code(200);
      echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
    }
    break;
  case 'lines':
    $path = $dataDir . '/lines.json';
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
      echo json_encode(readJson($path, []));
      break;
    }
    $payload = json_decode(file_get_contents('php://input'), true);
    if (!is_array($payload)) { http_response_code(400); echo json_encode(['error' => 'invalid']); break; }
    $action = $payload['action'] ?? '';
    $lines = readJson($path, []);
    if ($action === 'save') {
      $line = $payload['line'] ?? null;
      if (!$line || !isset($line['id'])) { http_response_code(400); echo json_encode(['error' => 'missing id']); break; }
      $found = false;
      foreach ($lines as &$l) { if ($l['id'] === $line['id']) { $l = $line; $found = true; break; } }
      if (!$found) $lines[] = $line;
      writeJson($path, $lines);
      echo json_encode(['ok' => true, 'line' => $line]);
      break;
    }
    if ($action === 'delete') {
      $id = $payload['id'] ?? '';
      $out = array_filter($lines, fn($l) => $l['id'] !== $id);
      writeJson($path, array_values($out));
      echo json_encode(['ok' => true]);
      break;
    }
    http_response_code(400); echo json_encode(['error' => 'unknown action']);
    break;
  case 'config':
    $path = $dataDir . '/config.json';
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
      $def = ['logLevel' => 'info', 'hostSource' => 'zabbix_api', 'mapCenter' => [-23.55, -46.63], 'mapZoom' => 5, 'maxMarkers' => 100, 'permissions' => ['admins' => ['Admin']], 'versions' => []];
      echo json_encode(readJson($path, $def));
      break;
    }
    require_admin_or_super();
    $payload = json_decode(file_get_contents('php://input'), true);
    $cfg = $payload['config'] ?? [];
    $prev = readJson($path, []);
    $prev['versions'] = $prev['versions'] ?? [];
    $prev['versions'][] = ['ts' => round(microtime(true) * 1000), 'cfg' => $cfg];
    $merged = array_merge($prev, $cfg);
    writeJson($path, $merged);
    echo json_encode(['ok' => true, 'version' => end($prev['versions'])]);
    break;
  case 'mapcenter':
    // GET/POST persiste em MariaDB quando disponível, senão arquivo
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
      // Restringe leitura a admins/superadmins
      require_admin_or_super();
      $pdo = db_pdo();
      if ($pdo) {
        $pdo->exec('CREATE TABLE IF NOT EXISTS module_settings (`key` VARCHAR(64) PRIMARY KEY, `value` TEXT NOT NULL)');
        $stmt = $pdo->prepare('SELECT `value` FROM module_settings WHERE `key` = :k');
        $stmt->execute([':k' => 'map_center']);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
          $val = json_decode($row['value'], true);
          echo json_encode(['lat' => $val['lat'] ?? -23.55, 'lng' => $val['lng'] ?? -46.63]);
          break;
        }
      }
      $def = readJson($dataDir . '/config.json', ['mapCenter' => [-23.55, -46.63]]);
      echo json_encode(['lat' => $def['mapCenter'][0], 'lng' => $def['mapCenter'][1]]);
      break;
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
      require_admin_or_super();
      $payload = json_decode(file_get_contents('php://input'), true);
      $lat = floatval($payload['lat'] ?? 0);
      $lng = floatval($payload['lng'] ?? 0);
      if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) { http_response_code(400); echo json_encode(['error' => 'invalid range']); break; }
      $pdo = db_pdo();
      if ($pdo) {
        $pdo->exec('CREATE TABLE IF NOT EXISTS module_settings (`key` VARCHAR(64) PRIMARY KEY, `value` TEXT NOT NULL)');
        $stmt = $pdo->prepare('INSERT INTO module_settings (`key`, `value`) VALUES (:k, :v) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)');
        $stmt->execute([':k' => 'map_center', ':v' => json_encode(['lat' => $lat, 'lng' => $lng])]);
        echo json_encode(['ok' => true, 'stored' => 'db']);
        break;
      }
      $cfg = readJson($dataDir . '/config.json', ['mapCenter' => [-23.55, -46.63]]);
      $cfg['mapCenter'] = [$lat, $lng];
      writeJson($dataDir . '/config.json', $cfg);
      echo json_encode(['ok' => true, 'stored' => 'file']);
      break;
    }
    http_response_code(405); echo json_encode(['error' => 'method not allowed']);
    break;
  case 'topology':
    $lines = readJson($dataDir . '/lines.json', []);
    $nodes = [];
    $edges = [];
    $nodeSet = [];
    foreach ($lines as $line) {
      $hosts = $line['hosts'] ?? [];
      foreach ($hosts as $h) { $nodeSet[$h['id']] = ['id' => $h['id'], 'name' => $h['name']]; }
      for ($i = 0; $i < count($hosts) - 1; $i++) {
        $edges[] = ['from' => $hosts[$i]['id'], 'to' => $hosts[$i + 1]['id'], 'layer' => $line['layer'] ?? 'default', 'name' => $line['name'] ?? ''];
      }
    }
    $nodes = array_values($nodeSet);
    echo json_encode(['nodes' => $nodes, 'edges' => $edges]);
    break;
  default:
    http_response_code(404);
    echo json_encode(['error' => 'not found']);
}