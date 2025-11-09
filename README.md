# Módulo Zabbix Backbone Map

![License MIT](https://img.shields.io/badge/license-MIT-blue.svg)

## Descrição
- Objetivo: oferecer um módulo web para visualização e edição de linhas de backbone em um mapa interativo, geração automática de topologia e configuração administrativa (parâmetros, versão de configuração, credenciais de banco). O foco é facilitar operações de rede e manutenção de dados relacionados.
- Funcionalidades principais:
  - Mapa interativo (Leaflet) com edição de polilinhas, camadas, tooltips e painel de incidentes.
  - Topologia gerada automaticamente a partir das linhas salvas.
  - Aba de Configuração com versionamento, parâmetros do módulo e gestão de credenciais de banco (armazenadas com criptografia via backend PHP).
  - Fallback para armazenamento local quando o backend não está disponível.
  - Testes básicos (QUnit para frontend e scripts PHP para rotas backend).

Documentação complementar:
- Guia do usuário: https://github.com/SirAlgodar/ModuloZBX_Topologia_v2/blob/main/backbone_map/docs/user_manual.md
- API do backend: https://github.com/SirAlgodar/ModuloZBX_Topologia_v2/blob/main/backbone_map/docs/api.md
- Instalação: https://github.com/SirAlgodar/ModuloZBX_Topologia_v2/blob/main/backbone_map/docs/installation.md

## Pré‑requisitos
- Sistemas operacionais: macOS, Linux, Windows.
- Navegador: Chrome/Firefox/Edge (recente).
- Backend opcional (para rotas/API): PHP 8.1+.
- Git (para versionamento, contribuições e sincronização remota).

## Instalação
1) Clonar ou baixar o repositório
```
git clone https://github.com/SirAlgodar/ModuloZBX_Topologia_v2.git
cd ModuloZBX_Topologia_v2
```

2) Execução rápida (somente frontend, com fallback local)
- Abra `backbone_map/index.html` diretamente no navegador (duplo clique) ou sirva a pasta via servidor estático.
- Para acesso administrativo no protótipo, use: `index.html?role=admin`.

3) Execução completa (frontend + backend PHP)
- Use PHP embutido para servir frontend e backend em conjunto:
```
php -S localhost:8000 -t backbone_map
```
- Acesse `http://localhost:8000/index.html?role=admin`.
- As rotas do backend (ex.: `/backend/api.php?route=pulse`) ficam acessíveis via o mesmo host.

## Exemplos de uso
- Verificar disponibilidade do backend:
```
curl "http://localhost:8000/backend/api.php?route=pulse"
```
- Salvar linhas (via UI):
  - Abra `index.html?role=admin`, edite/adicione linhas no mapa, e utilize os botões de salvar.
- Testar configuração com fallback local (sem backend):
  - Abrir `index.html` sem servidor; dados são persistidos em `localStorage`.

## Configurações opcionais e variáveis de ambiente
- Arquivo `.env` (lido pelo backend em `backbone_map/backend/env.php`):
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=zabbix
DB_PASS=sua_senha
DB_NAME=zabbix
SECRET_KEY=uma_chave_secreta_segura
```
- Observações:
  - `SECRET_KEY` é usada para criptografar credenciais sensíveis via `crypto.php`.
  - Rotas de banco: `dbconfig`, `dbtest`, `dbsave` em `backend/api.php`.
  - Em produção, mantenha `.env` fora de commits e protegido (configure seu `.gitignore` adequadamente).

## Guia de contribuição
- Reportar bugs: abra issues com descrição, passos para reproduzir e ambiente.
- Fluxo de PRs:
  - Crie um branch a partir de `main` (ex.: `feature/editar-camadas`).
  - Siga o estilo do código existente; inclua testes quando aplicável.
  - Faça PR descrevendo a mudança, motivação e como testar.
- Commits:
  - Use mensagens claras (ex.: `feat: adiciona painel de incidentes`).
- Código de conduta:
  - Seja respeitoso e mantenha discussões técnicas objetivas.

## Licença
- Licença: MIT.
- Texto da licença: https://opensource.org/licenses/MIT

## Fluxo Git básico (referência)
```
# inicializar (se ainda não estiver)
git init
git checkout -B main

# configurar remoto
git remote add origin https://github.com/SirAlgodar/ModuloZBX_Topologia_v2.git

# adicionar, commitar e enviar
git add .
git commit -m "docs: adiciona README inicial"
git push -u origin main
```