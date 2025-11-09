<?php declare(strict_types=1);

namespace SirAlgodar\BackboneMap\Actions;

use CControllerResponseData;

/**
 * Controlador de visualização do Backbone Map.
 * Estrutura inspirada na documentação de Actions do Zabbix 7.0.
 *
 * Métodos esperados pelo framework:
 *  - checkInput(): valida parâmetros da requisição
 *  - checkPermissions(): checa permissões do usuário
 *  - doAction(): prepara dados e cria a resposta (CControllerResponseData)
 */
class BackboneView /* extends CController */ {
    protected array $input = [];

    /**
     * Simula getInput do framework.
     */
    protected function getInput(string $key, $default = null) {
        return $this->input[$key] ?? $default;
    }

    /**
     * Placeholder: validação de parâmetros.
     */
    protected function checkInput(): bool {
        // Ex.: validar filtros/estado. Aqui aceitamos sem validação rígida.
        return true;
    }

    /**
     * Placeholder: verifica se usuário é admin do Zabbix.
     */
    protected function checkPermissions(): bool {
        // Em produção: return $this->getUserType() >= USER_TYPE_ZABBIX_ADMIN;
        return true;
    }

    /**
     * Executa a ação e cria resposta.
     */
    protected function doAction(): void {
        $data = [
            'name' => 'Backbone Map',
            'contacts' => [],
            'message' => 'Protótipo de módulo Backbone Map — assets carregados via manifest.'
        ];

        // Em produção: $this->setResponse(new CControllerResponseData($data));
        // Aqui apenas deixamos os dados que serão usados pela view.
        $this->response = new CControllerResponseData($data);
    }
}