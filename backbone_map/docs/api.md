# Documentação da API do Módulo

Base URL: `/backbone_map/backend/api.php`

## Rotas

### GET `?route=pulse`
- Verifica disponibilidade do backend.
- Resposta: `{ ok: true }`

### GET `?route=lines`
- Retorna todas as linhas salvas.
- Resposta: `[{ id, name, ifaceMode, traceroute, items, hosts, coords, layer }]`

### POST `?route=lines`
- Corpo: `{ action: 'save', line }` para salvar; `{ action: 'delete', id }` para excluir.
- Resposta save: `{ ok: true, line }`
- Resposta delete: `{ ok: true }`

### GET `?route=config`
- Retorna configurações atuais com histórico de versões.
- Resposta: `{ logLevel, hostSource, mapCenter, mapZoom, maxMarkers, permissions, versions }`

### POST `?route=config`
- Corpo: `{ config: { ... } }`
- Salva nova versão e mescla parâmetros.
- Resposta: `{ ok: true, version }`

### GET `?route=topology`
- Calcula topologia a partir das linhas.
- Resposta: `{ nodes: [{id, name}], edges: [{from, to, layer, name}] }`

## Autenticação e Permissões

- Em uma integração real, respeite sessões e ACLs do Zabbix.
- Neste protótipo, a aba Configuração exige `role=admin` na URL ou via `localStorage`.

## Versionamento

- Configurações versionadas em `data/config.json`.
- Cada POST cria nova entrada em `versions` com `ts` e `cfg`.
### GET `?route=dbconfig`
- Lê host, nome e usuário do `.env` (não expõe senha).
- Resposta: `{ host, name, user, hasPass }`

### POST `?route=dbtest`
- Corpo: `{ host, name, user, pass }`
- Testa conexão PDO MariaDB.
- Resposta: `{ ok: boolean, error?: string }`

### POST `?route=dbsave`
- Corpo: `{ host, name, user, pass }`
- Salva valores no `.env`. Senha é criptografada e armazenada como `DB_PASS_ENC` com chave `ENV_SECRET`.
- Resposta: `{ ok: true }`