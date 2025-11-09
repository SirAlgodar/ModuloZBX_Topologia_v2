<?php
// Funções de criptografia para dados sensíveis
// Usa AES-256-CBC com IV aleatório. Saída: base64(iv:cipher)

function crypto_key_from_secret($secret) {
  return hash('sha256', $secret, true); // 32 bytes
}

function crypto_encrypt($plaintext, $secret) {
  $key = crypto_key_from_secret($secret);
  $iv = random_bytes(16);
  $cipher = openssl_encrypt($plaintext, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
  return base64_encode($iv . ':' . $cipher);
}

function crypto_decrypt($encoded, $secret) {
  $key = crypto_key_from_secret($secret);
  $raw = base64_decode($encoded, true);
  if ($raw === false) return null;
  $parts = explode(':', $raw);
  if (count($parts) !== 2) return null;
  [$iv, $cipher] = $parts;
  $plain = openssl_decrypt($cipher, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
  return $plain === false ? null : $plain;
}