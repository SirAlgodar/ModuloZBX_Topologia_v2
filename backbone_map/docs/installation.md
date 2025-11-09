# Módulo Zabbix "Mapa Backbone" — Instalação e Configuração

Este protótipo implementa um módulo de UI para Zabbix 7.0 LTS com três abas: Backbone, Topologia e Configuração. Ele utiliza Leaflet para o mapa e uma API backend em PHP simples para persistência.

## Pré-requisitos

- Zabbix 7.0 LTS (servidor e frontend)
- PHP 8.x com web server (Nginx/Apache) habilitado para servir este módulo
- Permissões para criar um módulo na UI do Zabbix (admin)
- MariaDB (ou MySQL compatível) acessível para o módulo

## Instalação (protótipo)

1. Copie a pasta `backbone_map/` para um local acessível pelo web server do Zabbix, por exemplo: `/usr/share/zabbix/modules/backbone_map/`.
2. Configure o virtual host para servir `index.html` e permitir `backend/api.php`.
3. Opcional: integre o módulo ao menu do Zabbix, adicionando uma entrada em "Relatórios" ou "Mapas" com link para a URL do módulo.
4. Crie e configure o arquivo `.env` no diretório raiz do projeto (não dentro de `backbone_map/`), com:

```
DB_HOST=localhost
DB_NAME=modulebackbone_dev
DB_USER=modulebackbone_dev
DB_PASS=modulebackbone_dev
ENV_SECRET=troque_esta_chave
```

Observação: O `.env` não é servido pelo web server (fica fora de `backbone_map/`) e está listado em `.gitignore` para evitar commit.

Observação: Em um módulo UI integrado oficialmente, a página seria registrada no sistema de módulos do Zabbix conforme a documentação do arquivo `Zabbix_Documentation_7.0.en.pdf` (extensão de UI). Este protótipo foca na funcionalidade e estrutura.

## Configuração Inicial

1. Acesse a aba "Configuração" com um usuário admin (`?role=admin` pode ser usado neste protótipo para simular). 
2. Defina:
   - Centro e zoom padrão do mapa
   - Máx. de marcadores editáveis
   - Nível de log
3. Salve as configurações (versionamento automático).
4. Configure a aba "Banco de Dados": informe host, nome, usuário e senha. Use "Testar conexão" antes de salvar.

## Atualizações

- Versionamento de configurações é mantido em `backbone_map/data/config.json`.
- Linhas salvas em `backbone_map/data/lines.json`.

## Compatibilidade

- Desenvolvido visando Zabbix 7.0 LTS.
- UI baseada em Leaflet 1.9.x; editor de polilinhas inspirado em `leaflet-editable-polyline`.
- Backend com PDO para MariaDB (MySQL), com tratamento de erros e criptografia de senha no `.env` (armazenada como `DB_PASS_ENC` quando salva via UI).