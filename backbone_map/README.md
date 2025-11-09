# Zabbix Módulo — Mapa Backbone

Protótipo de módulo para Zabbix 7.0 LTS com três abas:

- Backbone: desenho, edição e camadas de rotas sobre geomapa interativo (Leaflet), painéis de configuração e tooltips.
- Topologia: diagrama gerado a partir do mapa backbone, com visualização hierárquica simples e informações consistentes.
- Configuração: parâmetros gerais, visualização padrão e permissões, restrito a admin com versionamento de mudanças.

## Requisitos Técnicos

- Estrutura inspirada no projeto `leaflet-editable-polyline` (API do editor de polilinhas)
- Compatibilidade com Zabbix 7.0 LTS (UI protótipo)
- Testes unitários para funcionalidades principais (QUnit para JS, script de teste para PHP)
- Documentação de API, instalação e manual do usuário
- Versionamento de configurações em arquivo JSON

## Como rodar localmente

- Servir a pasta `backbone_map/` com um servidor web (por exemplo Python `http.server` ou Apache/Nginx).
- Acessar `index.html` (use `?role=admin` para testar a aba Configuração).

## Estrutura

- `index.html` UI principal
- `css/` estilos
- `js/` lógica das abas e adapter de polilinhas
- `backend/` API PHP protótipo
- `data/` persistência JSON (criado automaticamente)
- `docs/` documentação técnica e usuário
- `tests/` testes unitários