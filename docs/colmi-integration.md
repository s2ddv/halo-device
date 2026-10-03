# Integração Colmi/QRing no HALO

Referência: [tahnok/colmi_r02_client](https://github.com/tahnok/colmi_r02_client),
commit `19e70aa502749b87d57e3dba0156dfd67ddc0d4a`, consultado em 03/10/2026.
Licença MIT, Copyright 2024 Wesley Ellis, preservada em
[public/licenses/colmi-r02-client.txt](../public/licenses/colmi-r02-client.txt),
também distribuída no build em `/licenses/colmi-r02-client.txt`.

## Arquitetura e escopo

O upstream é um cliente Python/Bleak que se comunica diretamente com o dispositivo
BLE; não é uma API HTTP hospedada. O HALO adapta os comandos ao Web Bluetooth,
sem exigir um servidor Python próximo do telefone. A persistência equivalente
é local, no IndexedDB já existente, e não no SQLite do cliente Python.

- Bateria (`03`), HR e SpO₂ ao vivo (`69`/`6A`): integração existente preservada.
- Novas medições ao vivo são salvas; HR permanece instantâneo, nunca HR de repouso.
- Histórico cardíaco (`15`): montagem de múltiplos pacotes, slots de cinco minutos,
  descarte de zeros e slots futuros, validação da data retornada.
- Histórico de passos (`43`): data BCD, slots de 15 minutos, passos little-endian.
- Importação manual de um dia, entre hoje e seis dias atrás, no painel de perfil.
- Respostas completas são salvas juntas; IDs por dispositivo, métrica e instante
  impedem duplicação ao importar o mesmo dia. Falha em qualquer consulta não salva
  uma importação parcial. Falha de escrita local é exibida ao usuário.
- Somente uma operação BLE por vez; timeout de 15 segundos por histórico e
  desconexão após falha impedem reaproveitar fragmentos atrasados na mesma sessão.
- Filtro de descoberta aceita o serviço e nomes Y25/R02/R06/R10.

O código do protocolo está em `src/lib/ble/colmi-history.ts`, o transporte em
`src/lib/band-ble.ts` e a conversão para o modelo local em `src/lib/health/colmi.ts`.
O parser acrescenta checksums e rejeição de pacotes fora de ordem ao comportamento
upstream. Intervalos diferentes de cinco minutos são rejeitados, sem adivinhação.

## Relógio e limitações

O upstream configura e interpreta o relógio em UTC. Esta integração **não altera
automaticamente o relógio** nem a configuração de coleta da pulseira. A importação
pressupõe que o relógio já está em UTC; o painel explicita essa condição. Registros
produzidos com relógio local do QRing podem apresentar deslocamento de horário.
Validar a convenção antes de importar dados reais. A janela de sete dias é um
limite do HALO, não uma garantia de retenção do firmware.

Não foram portados comandos de reboot, comandos arbitrários, idioma, LEDs,
configuração de coleta nem ajuste de relógio. Sono, histórico de SpO₂, temperatura,
HRV e estresse não têm implementação utilizável nesse cliente para integrar aqui.
O canal secundário permanece sem decodificação. Não há backend remoto, conta,
backup em nuvem ou coleta em segundo plano. Os gráficos demonstrativos e o Health
Score não passam a ser dados reais por causa desta importação.

A correspondência de UUIDs com a HALO BAND não substitui validação física da RS25.

## Validação e revisão do proprietário

- `npm test`: 39 testes passaram, incluindo vetor público upstream para passos,
  pacotes sintéticos de HR, corrupção, ordem, datas e timeout do transporte.
- `npm run typecheck`: passou.
- `npm run lint`: zero erros; seis avisos preexistentes de Fast Refresh.
- `NITRO_PRESET=netlify npm run build`: passou.
- Chromium com Bluetooth simulado, viewport 390 × 844: conexão, bateria, medição
  ao vivo, importação, reimportação sem duplicação e persistência após recarga
  passaram; nenhum erro de execução ou overflow horizontal. Nenhum score criado.

No Chrome Android em HTTPS, com QRing e nRF desconectados:

1. Abrir Perfil, procurar a pulseira e conferir a bateria.
2. Medir batimentos e SpO₂; conferir confirmação de salvamento local.
3. Verificar o relógio UTC antes de importar um dia conhecido de histórico.
4. Comparar os dados com o QRing em sessão separada. Reimportar o mesmo dia e
   verificar que a contagem não duplica; testar desconexão e reconexão.

Aprovação funcional depende dessa revisão do proprietário no hardware.
