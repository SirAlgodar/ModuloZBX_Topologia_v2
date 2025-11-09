# Manual do Usuário — Mapa Backbone

## Visão Geral

O módulo "Mapa Backbone" permite desenhar rotas entre equipamentos e interfaces, visualizar topologia derivada e configurar parâmetros do módulo.

## Aba Backbone

- Mapa interativo (Leaflet) para criação, edição e exclusão de linhas.
- Painel lateral de configuração:
  - Nome da linha
  - Seleção de host (com busca)
  - Seleção de interface (in/out/soma)
  - Configuração de traceroute para alarmes
  - Itens adicionais de monitoramento
- Camadas de rotas com visualização seletiva.
- Interações:
  - Clique para iniciar/estender uma linha
  - Arraste pontos para reposicionar
  - Clique direito em ponto para remover (com confirmação)
  - Arraste o marcador médio para adicionar novo ponto entre dois pontos
  - Tooltips dinâmicos com porcentagem de tráfego, itens e status de alarmes (mock nesta versão)

## Aba Topologia

- Geração automática de diagrama com base nas linhas salvas.
- Agrupamento por camada ou host.
- Exibe informações consistentes com a aba Backbone (mock nesta versão).

## Aba Configuração

- Acesso restrito a usuários admin.
- Parâmetros:
  - Log, fonte de hosts (Zabbix API ou custom), centro/zoom do mapa e maxMarkers
- Versionamento de configurações com opção de rollback.

## Aba Banco de Dados

- Exibe host, nome do banco e usuário atuais (do `.env`).
- Permite editar e testar a conexão antes de salvar.
- Ao salvar, a senha é criptografada e gravada como `DB_PASS_ENC` usando `ENV_SECRET`.
- Dica: mantenha o `.env` fora do diretório servindo a UI e não comite em VCS.

## Dicas

- Utilize `?role=admin` na URL para simular perfil admin neste protótipo.
- Os hosts de exemplo são mock; integração com Zabbix API pode ser habilitada no backend.