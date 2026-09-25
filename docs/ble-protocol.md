# Protocolo BLE — Halo Band

Status: **aguardando hardware; protocolo proprietário desconhecido**.
O wrapper atual usa serviços padrão `heart_rate` e `battery_service`. Isso não
comprova que a Halo Band os anuncie ou implemente.

## Descoberta quando a pulseira chegar

1. Registrar modelo, revisão de hardware, firmware e versão do app oficial.
2. Fazer inventário GATT com um explorador BLE: UUIDs completos de serviços,
   características, propriedades (read/write/notify/indicate) e descritores.
3. Anotar se pareamento, autenticação ou comandos de inicialização são necessários.
4. Capturar notificações e operações do próprio dispositivo em condições controladas:
   medição parada, atividade, sincronização de histórico e reconexão.
5. Comparar os bytes com valores/horários apresentados no app oficial. Determinar
   endianness, unidade, escala, timestamp, fragmentação e checksum, se presentes.
6. Guardar amostras sanitizadas como fixtures e testar o decoder antes de ligar ao score.
7. Validar no navegador alvo: seleção, permissões dos serviços, leitura, notificações,
   desconexão e reconexão. Somente então marcar o protocolo como suportado.

Começar pelo inventário GATT; captura de tráfego só se necessária para esclarecer
comandos/payloads. UUIDs sozinhos não especificam o protocolo.

## Registro por característica

Preencher para cada métrica, bateria, controle e sincronização:

- Serviço UUID: pendente
- Característica UUID: pendente
- Propriedades e descritores: pendentes
- Requisitos de autenticação/inicialização: pendentes
- Comando de solicitação e resposta: pendentes
- Payload sanitizado e interpretação byte a byte: pendentes
- Unidade, escala e origem do timestamp: pendentes
- Frequência de emissão, limites e condições de validade: pendentes
- Firmware e evidência de validação: pendentes

Capturas privadas ficam em `docs/ble-captures/` (ignorado pelo Git). Não colocar
identificadores pessoais ou chaves de pareamento nas fixtures publicadas.

## Limites atuais

O filtro do experimento exige que `heart_rate` seja anunciado. Um dispositivo com
serviços proprietários pode não aparecer. Ajustar filtros e serviços permitidos
somente após a descoberta. Não há decoder proprietário nem sincronização de histórico.
