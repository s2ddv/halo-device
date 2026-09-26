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

## Segunda sessão — janela inicial sem emissão

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

Conclusão limitada ao trecho inicial: conexão GATT, leituras e habilitação de NOTIFY
funcionaram, mas a assinatura isolada não reproduziu o fluxo anterior.
Inicialização por comandos ou estado previamente configurado são hipóteses;
não enviar comandos deduzidos só dos bytes recebidos.

### Continuação da segunda sessão — notificações tardias

O log ampliado até 23:33:40.899 contém quatro notificações em `6e400003…`,
entre 23:30:16.137 e 23:32:15.827. O analisador offline confirmou que todas têm
16 bytes, checksum válido e tipo `0x73`. O significado e o gatilho desses eventos
continuam desconhecidos. Portanto, a ausência de emissão descrita acima vale
somente para a janela inicial, não para toda a conexão.

Não existe registro de `writeCharacteristic` nesse arquivo: as escritas são no
descritor CCCD `0x2902`. A consulta de bateria `0x03` ainda não foi comprovadamente
enviada. Um byte `03` dentro do payload de um pacote `73` não muda seu tipo.

Após desabilitar e reabilitar notificações, leituras do CCCD retornam apenas
um byte `00`, que o nRF Connect sinaliza como comprimento incorreto (esperava
16 bits). Em seguida aparecem chamadas locais para desabilitar notificações.
O último estado registrado, às 23:33:40.899, é de notificações desabilitadas.
A causa da resposta curta do descritor não está determinada pelo log.

Para repetir o teste, reabilitar NOTIFY em `6e400003…` e escrever o comando na
característica `6e400002…`, não no descritor `0x2902`. Evitar ler o CCCD durante
essa tentativa para não repetir a sequência que terminou com NOTIFY desativado.

## Pesquisa pública: correspondência com Colmi/QRing

Consulta em 25/09/2026. Fontes são implementações/documentação de seus autores;
compatibilidade declarada para anéis não equivale a teste desta pulseira RS25.

- [DaFitDesktop](https://github.com/arklnd/DaFitDesktop): cliente Windows/C++ para
  Da Fit/MOYOUNG V2, testado pelo autor com Marv Neo. Documenta `FEEA` e
  características `FEE1/FEE2/FEE3`, com comandos iniciados por `AB`.
  Esses identificadores e esse envelope diferem dos observados na HALO BAND;
  o projeto é uma referência de método, não um driver diretamente confirmado.
- [colmi_r02_client](https://github.com/tahnok/colmi_r02_client): cliente Python
  para Colmi R02/R06/R10, com heurística de compatibilidade baseada no app QRing.
  O serviço `6e40fff0…` e as características `6e400002…`/`6e400003…` coincidem
  exatamente com o inventário da pulseira.
- [packet.py](https://github.com/tahnok/colmi_r02_client/blob/main/colmi_r02_client/packet.py):
  implementação de pacotes de 16 bytes com soma dos bytes e máscara `& 255`,
  equivalente a módulo 256. O comentário que menciona módulo 255 é impreciso;
  o código coincide com o checksum dos 190 pacotes capturados.
- [battery.py](https://github.com/tahnok/colmi_r02_client/blob/main/colmi_r02_client/battery.py):
  consulta de bateria com comando `0x03`; resposta interpreta byte 1 como nível
  e byte 2 como estado de carga. Essa semântica ainda precisa de teste na RS25.
- [openring](https://github.com/robinojw/openring): implementação TypeScript com
  adaptador Web Bluetooth, canal de comandos `6e40fff0…` e canal de históricos
  `de5bf728…`, ambos presentes na HALO BAND. Candidato a referência para o PWA,
  ainda não instalado nem validado com nosso hardware.
- [Colmi BLE API](https://colmi.puxtril.com/): documentação de RE do QRing,
  testada pelo autor no Colmi R03; útil para comparar comandos e respostas.

Conclusão: há evidência forte de protocolo compartilhado com a família
Colmi/QRing. Isso não identifica o fabricante OEM da HALO BAND, o chipset,
a cadeia comercial da HALO Ltda nem compatibilidade integral. Não foi encontrada
nesta pesquisa uma confirmação específica do firmware `RS25_1.00.29_251106`.

## Próximo teste: consulta de bateria documentada

Teste de compatibilidade pendente no dispositivo físico, sem instalação de
biblioteca externa e sem alteração automática do app:

1. QRing desativado; conectar no nRF Connect.
2. No serviço `6e40fff0-b5a3-f393-e0a9-e50e24dcca9e`, habilitar notificações em
   `6e400003-b5a3-f393-e0a9-e50e24dcca9e` e confirmar a assinatura no log.
3. Escrever uma única vez em `6e400002-b5a3-f393-e0a9-e50e24dcca9e`, usando
   entrada hexadecimal (não texto), o pacote documentado de consulta de bateria:

```text
03 00 00 00 00 00 00 00 00 00 00 00 00 00 00 03
```

4. Exportar o log incluindo escrita e eventual resposta. Confirmar tipo `03`,
   comprimento de 16 bytes, checksum e plausibilidade dos campos; comparar o
   nível com o QRing em uma sessão posterior, separada.

Esse pacote tem 14 bytes centrais zerados. O último `03` é o checksum.
Uma resposta positiva valida essa consulta, não todos os comandos da família.
Os pacotes `03` da primeira captura são compatíveis com a interpretação pública
de bateria, mas não houve comparação independente para confirmar seu significado.

Se a consulta falhar ou houver divergência, seguir com captura Bluetooth HCI de
uma sessão normal do QRing. Identificar modelo do telefone e Android para orientar
a coleta. Registrar os horários de conexão, sincronização e uma solicitação de
medição por vez, com nRF Connect desconectado.

A coleta HCI é descrita na
[documentação Android](https://source.android.com/docs/core/connect/bluetooth/verifying_debugging).
A extração depende do telefone. Manter relatórios completos fora do Git e
extrair só o tráfego necessário; desativar a coleta ao terminar.

## Limites da implementação atual

Por decisão do proprietário, `colmi_r02_client` passa a ser a hipótese de
compatibilidade adotada para implementar o MVP. Isso não confirma a identidade
OEM nem a semântica de todas as métricas na RS25.

O wrapper `band-ble.ts` agora conecta ao serviço proprietário `6e40fff0…`,
assina `6e400003…` e envia a consulta de bateria `0x03` em `6e400002…` com
escrita sem resposta, seguindo o cliente de referência. A seleção aceita o
serviço anunciado ou nomes iniciados por `Y25`; o serviço é solicitado
explicitamente mesmo quando o anúncio contém apenas o nome.

No perfil, conectar inicia uma consulta de bateria; o botão Consultar bateria
permite repetir. Respostas exigem tipo `03`, 16 bytes, checksum correto e nível
entre 0 e 100. O byte seguinte indica carga (zero = não carregando). Há limite
de dez segundos por consulta, rejeição de consultas simultâneas e limpeza de
listeners/consulta pendente ao desconectar ou cancelar. Eventos desconhecidos,
incluindo `73`, não são interpretados como bateria nem como medições.

A implementação substitui o experimento anterior com o serviço padrão de HR.
Não grava medições de saúde a partir do protocolo Colmi: históricos, medições
em tempo real e o canal secundário continuam pendentes. A conexão GATT e uma
resposta de bateria não validam os demais comandos.

Validação automatizada usa dispositivos simulados e pacotes sintéticos. Ainda
é necessário testar no Chrome Android em HTTPS com QRing e nRF desconectados:
conectar, confirmar bateria contra QRing em sessão separada, repetir consulta,
desconectar e reconectar. Ausência de resposta mostra erro sem inventar valor
nem alimentar o Health Score. Não há reconexão automática em segundo plano.

Referência para operação do aplicativo:
[documentação do nRF Connect](https://github.com/nordicsemi/Android-nRF-Connect/blob/main/documentation/README.md#connection).
