# Protocolo BLE — HALO BAND

Status: **inventário GATT confirmado no log; formato parcial observado; métricas ainda não decodificadas**.

## Dispositivo e contexto

Informações fornecidas pelo proprietário em 25/09/2026:

- Marca: HALO Device (brasileira); modelo comercial: HALO BAND.
- App: QRing; versão do app pendente.
- Hardware lido em `0x2A27`: `RS25_V1.0`.
- Firmware lido em `0x2A26`: `RS25_1.00.29_251106`.
  Valores literais reportados pelo dispositivo, sem inferir fabricante do chipset
  ou data de compilação a partir do nome.
- Nome mostrado no nRF Connect: `Y25_<sufixo>` (identificador omitido).
- Android e pulseira disponíveis. O proprietário confirmou que o QRing estava
  desativado durante a captura; o log não permite determinar o estado interno
  anterior da pulseira nem a causa da emissão dos dados.

A primeira imagem era da aba SERVER, desconectada, e mostrava serviços locais.
As imagens seguintes e o log exportado mostram CLIENT, CONNECTED e NOT BONDED.
O log registra descoberta bem-sucedida sem vínculo de pareamento nessa sessão.
Isso não prova ausência de autenticação no protocolo de aplicação.

## Inventário GATT confirmado

Para os UUIDs curtos abaixo, o log usa a forma completa
`0000xxxx-0000-1000-8000-00805f9b34fb`.
Todas as características NOTIFY/INDICATE listadas têm descritor `0x2902`.

### Generic Access — `0x1800`

- `0x2A00` Device Name: READ, WRITE.

### Serviço `0xAE30`

- `0xAE01`: WRITE NO RESPONSE.
- `0xAE02`: NOTIFY.
- `0xAE03`: WRITE NO RESPONSE.
- `0xAE04`: NOTIFY.
- `0xAE05`: INDICATE.
- `0xAE10`: READ, WRITE.

O log confirmou o cabeçalho que estava cortado na terceira captura.

### Serviço `0xAE3A`

- `0xAE3B`: WRITE NO RESPONSE.
- `0xAE3C`: NOTIFY.

### Generic Attribute — `0x1801`

- `0x2A05` Service Changed: INDICATE.

### Serviço `0xAE00`

- `0xAE01`: WRITE NO RESPONSE.
- `0xAE02`: NOTIFY.

`AE01` e `AE02` existem em dois serviços. Selecionar sempre pelo par
serviço/característica, nunca somente pela característica.

### Canal com pacotes de 16 bytes

- Serviço: `6e40fff0-b5a3-f393-e0a9-e50e24dcca9e`.
- Escrita: `6e400002-b5a3-f393-e0a9-e50e24dcca9e` — WRITE, WRITE NO RESPONSE.
- Notificação: `6e400003-b5a3-f393-e0a9-e50e24dcca9e` — NOTIFY.

Preservar exatamente o serviço observado (`6e40fff0`), sem substituir por
outro UUID parecido. O nome RX/TX no log não estabelece a função das métricas.

### Canal com pacotes de comprimento variável

- Serviço: `de5bf728-d711-4e47-af26-65e3012a5dc7`.
- Escrita: `de5bf72a-d711-4e47-af26-65e3012a5dc7` — WRITE, WRITE NO RESPONSE.
- Notificação: `de5bf729-d711-4e47-af26-65e3012a5dc7` — NOTIFY.

### Device Information — `0x180A`

- `0x2A25` Serial Number String: READ.
- `0x2A27` Hardware Revision String: READ.
- `0x2A26` Firmware Revision String: READ.
- `0x2A23` System ID: READ.

Hardware e firmware foram lidos na segunda sessão (ver abaixo). Não versionar número de série,
System ID, endereço Bluetooth ou o histórico pessoal bruto.

## Análise do log exportado

O analisador considera somente linhas `I ... Notification received from ...`.
As linhas `A ... received` são outra representação do mesmo evento e não são
contadas novamente. Notificações repetidas de fato permanecem na contagem.

- `6e400003…`: 190 notificações, todas com 16 bytes, entre 18:05:51.740 e 18:10:19.837.
- `de5bf729…`: 16 notificações, entre 18:05:55.714 e 18:06:00.039.
  Comprimentos observados: 7 bytes (7 eventos), 56 (3), 57 (3), 113 (1),
  153 (1) e 182 (1). Não presumir que cada notificação seja uma mensagem completa.
- Nenhuma notificação de `AE02`, `AE04`, `AE05` ou `AE3C` consta deste arquivo.
- Houve `GATT CONN TIMEOUT` às 18:05:45.163, seguido de reconexão.
- A escrita do descritor `0x2902` com `01-00` para `AE02` foi confirmada às
  18:10:37.123. O registro termina logo depois da confirmação da assinatura:
  não contém uma janela de observação posterior de 30 segundos.
- Essa operação imprime apenas o UUID da característica; por existir `AE02`
  em dois serviços, o texto isolado não identifica em qual ocorreu a assinatura.
- Chamadas `setCharacteristicNotification` aparecem antes, mas não há escrita
  de CCCD registrada para os dois canais que emitiram dados. A recepção é
  comprovada; sua inicialização ainda não foi reproduzida a partir de estado conhecido.
- Não há `writeCharacteristic` no arquivo. Não é possível deduzir comandos de
  requisição apenas pelas respostas, nem atribuir as emissões ao QRing.

### Formato observado no primeiro canal

Nos 190 pacotes de 16 bytes, sem exceção nesta captura:

```text
byte[15] == (soma de byte[0] até byte[14]) & 0xFF
```

Isso sustenta uma validação experimental por checksum de 8 bits. Não é garantia
para outros firmwares, canais ou comprimentos. O primeiro byte é tratado como
um identificador de tipo opaco; bytes 1–14 permanecem como payload sem semântica.
Não inferir bateria ou frequência cardíaca só porque um byte parece um valor plausível.

`src/lib/ble/halo-protocol.ts` registra os dois canais e valida esse envelope.
Não gera comandos, não converte dados em métricas e não altera o Health Score.
Os testes usam pacotes sintéticos, sem valores pessoais extraídos da captura.

## Análise local reproduzível

```sh
npm run ble:inspect -- /caminho/para/log-nrf.txt
```

O comando mostra contagens, comprimentos, tipos opacos e validação de checksum.
Não imprime endereços do dispositivo, horários nem bytes brutos. Código de saída
2 indica ausência de linhas de notificação reconhecidas, não falha da pulseira.
As estatísticas são limitadas ao formato textual reconhecido pelo analisador.

Logs privados podem ficar em `docs/ble-captures/`, ignorado pelo Git. O arquivo
original recebido permanece fora do repositório; nenhum dump pessoal foi copiado
para fixtures ou documentação.

## Segunda sessão — assinatura sem emissão

Log de 25/09/2026, das 23:21:41.563 às 23:25:02.357:

- Conexão confirmada às 23:21:44.236.
- Falha de atualização dos parâmetros com status 31 às 23:21:44.238.
  Depois há atualização bem-sucedida às 23:21:44.501, descoberta de serviços
  com status 0 e outras atualizações de parâmetros. O erro inicial não impediu
  a descoberta, a assinatura ou as leituras posteriores; sua causa é desconhecida.
- Inventário de serviços e características consistente com o primeiro log.
- Assinatura de `6e400003…` confirmada às 23:22:16.520, após escrita do CCCD
  `0x2902` com `01-00` e confirmação de sucesso.
- Nenhuma linha de notificação recebida e nenhum evento de desconexão constam
  no trecho posterior, até 23:25:02.357: janela de 165,837 segundos.
- Firmware lido com sucesso às 23:25:01.880: `RS25_1.00.29_251106`.
- Hardware lido com sucesso às 23:25:02.357: `RS25_V1.0`.
- Não há comandos `writeCharacteristic` nem assinatura explícita de
  `de5bf729…` nessa sessão.

Conclusão limitada à sessão: conexão GATT, leituras e habilitação de NOTIFY
funcionaram, mas a assinatura isolada não reproduziu o fluxo anterior.
Inicialização por comandos ou estado previamente configurado são hipóteses;
não enviar comandos deduzidos só dos bytes recebidos.

## Próxima captura: sessão do QRing

Identificar modelo do telefone e versão do Android para orientar a coleta.
Usar o log Bluetooth HCI do Android para observar uma conexão/sincronização
normal do QRing, com o nRF Connect desconectado. Anotar os horários de conectar,
sincronizar e solicitar uma medição, uma ação por vez. A captura deve permitir
correlacionar escritas ATT, UUIDs/handles e respostas, em vez de presumir comandos.

A ativação do log HCI e a coleta via relatório de bug são descritas na
[documentação de depuração Bluetooth do Android](https://source.android.com/docs/core/connect/bluetooth/verifying_debugging).
A disponibilidade e o caminho de extração dependem do telefone. Relatórios de
bug podem conter dados de outros apps; manter o relatório completo fora do Git
e extrair somente o tráfego necessário. Desativar a coleta ao terminar.

## Limites da implementação atual

O wrapper `band-ble.ts` ainda exige o serviço padrão `heart_rate`, ausente do
inventário recebido. Portanto, ele ainda não implementa a conexão com esta HALO BAND.
Os módulos novos analisam logs offline. A próxima integração deverá usar os UUIDs
confirmados, coletar dados brutos separadamente de medições validadas e testar a
assinatura/reconexão com o hardware antes de alimentar gráficos ou score.

Referência para operação do aplicativo:
[documentação do nRF Connect](https://github.com/nordicsemi/Android-nRF-Connect/blob/main/documentation/README.md#connection).
