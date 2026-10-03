# Status do projeto HALO Device

## Estado verificado em 03/10/2026

- Dez telas do Stitch adaptadas, incluindo as novas rotas `/stress`,
  `/temperature` e `/activity`. Cada página foi publicada em commit próprio.
- Último commit de frontend: `0ffa37b`, com séries demonstrativas por data e
  estado de período independente.
- PWA, configuração Netlify e documentação preparados para publicação no Git.
  Não há deploy público confirmado.
- Validação: 28 testes, typecheck e build Netlify passaram; lint sem erros,
  com seis avisos preexistentes de Fast Refresh.
- Backend de saúde ausente: integração remota depende do repositório/contrato
  da API. Metas e histórico local não equivalem a sincronização com backend.

Veja [o mapa de implementação](stitch-implementation.md) e
[as instruções de PWA e deploy](pwa-deploy.md).

## Registro histórico anterior à adaptação do Stitch

As informações de Git e pendências abaixo retratam o checkpoint antigo;
consulte a seção acima para o estado atual.

Atualizado em **02/10/2026**. Este documento registra onde o projeto parou, o que foi implementado, o que foi validado e o que ainda precisa acontecer.

## Resumo executivo

O projeto parou depois da implementação e validação da fundação local de saúde, da integração BLE experimental e da preparação do PWA para Netlify. O próximo marco pedido era publicar o app.

No estado atual:

- `main` está alinhada com `origin/main` no commit `aa92151`.
- Há mudanças locais ainda não commitadas, incluindo PWA, deploy, ajustes visuais e BLE.
- Não há evidência de commit final, push dessas mudanças, site Netlify criado, URL pública ou deploy público.
- O app continua frontend-only: não há backend, conta, autenticação, nuvem ou backup automático.

## Estado do Git encontrado agora

Branch atual:

```text
main...origin/main
```

Últimos commits já publicados:

- `aa92151 feat(ble): add live measurements and Android APK roadmap`
- `5024681 feat(ble): integrate Colmi battery queries over Web Bluetooth`
- `7dbd8d7 docs(ble): record delayed notifications and pending battery query`
- `e13d873 docs(ble): correlate HALO captures with Colmi protocol research`
- `221e370 docs(ble): record firmware and silent notification session`
- `073892c feat(ble): document HALO GATT and validate captured frames`
- `07eafb4 feat(health): add local data persistence and BLE groundwork`

Arquivos atualmente modificados ou novos, ainda fora de um commit final:

- `.gitignore`, `README.md`, `eslint.config.js`, `vite.config.ts`
- `src/components/AppShell.tsx`, `src/routes/__root.tsx`, `src/styles.css`, `src/lib/band-ble.ts`
- `scripts/pwa-plugin.ts`, `src/lib/pwa.ts`, `src/sw.js`
- `netlify.toml`, `docs/pwa-deploy.md`
- `public/manifest.webmanifest`, `public/offline.html`, `public/icons/`
- `tests/pwa.test.ts`

## O que foi concluído

### 1. Modelo de saúde local

Foi criada a camada `src/lib/health/`, com:

- modelo de medições e resumos diários;
- validação de unidade, timestamp, fuso, valores finitos, origem e dispositivo;
- persistência IndexedDB no banco `halo-health`;
- store `measurements`, indexado por dia;
- store `summaries`, indexado por dia;
- separação entre dados reais locais e dados de demonstração;
- tratamento de dias ausentes, parciais e completos.

Regras importantes:

- a janela considera até 30 dias de calendário;
- lacunas depois do início do histórico contam como dias ausentes;
- dias anteriores à primeira observação não são penalizados;
- dia parcial não publica score definitivo;
- pesos não são renormalizados para esconder dados faltantes;
- calibração exige 14 dias distintos com observações;
- baseline exige 60 dias observados nos 90 dias anteriores;
- frequência cardíaca instantânea não é tratada como frequência de repouso;
- dados demo não entram na persistência real.

### 2. BLE padrão e experimento com a pulseira

`src/lib/band-ble.ts` implementa um experimento conservador usando serviços Bluetooth padrão:

- `heart_rate`;
- `battery_service`.

A implementação inclui conexão, leitura/recepção de frequência cardíaca, tentativa de bateria, persistência de leituras válidas como `source: 'ble'`, identificação do dispositivo e timestamp/fuso.

Também foram tratados ciclo de vida, abort, tentativas antigas, desconexão, limpeza de notificações, timeouts, retry e serialização de operações GATT.

Essa integração ainda não é um driver HALO proprietário completo. Uma leitura instantânea recebida por BLE não pode ser usada sozinha para inferir sono, recuperação, HR de repouso ou Health Score completo.

### 3. Protocolo observado da HALO BAND

O inventário GATT foi documentado em `docs/ble-protocol.md`. Foram observados, entre outros:

- serviço `6e40fff0-b5a3-f393-e0a9-e50e24dcca9e`;
- escrita `6e400002...` e notificação `6e400003...`;
- serviço histórico `de5bf728...` com escrita `de5bf72a...` e notificação `de5bf729...`;
- serviços proprietários `AE30`, `AE3A` e `AE00`;
- hardware `RS25_V1.0`;
- firmware `RS25_1.00.29_251106`.

Os 190 pacotes de 16 bytes observados no canal `6e400003...` têm checksum experimental de soma modular. O protocolo e os tipos ainda não estão semanticamente decodificados. A pesquisa encontrou correspondência forte com a família Colmi/QRing, mas isso não prova compatibilidade integral nem autoriza assumir que todo comando da família funcione na HALO BAND.

O próximo passo BLE depende de novas capturas controladas: habilitar notificações, enviar comandos conhecidos no canal de escrita correto, registrar respostas e validar bateria/histórico antes de converter bytes em métricas.

### 4. UI e dados demonstrativos

- As telas existentes continuam identificadas como demonstração quando usam dados demo.
- A progressão pessoal substituiu a ideia de leaderboard que sugeria uma fonte de dados inexistente.
- O perfil separa histórico local real das telas demonstrativas.
- Mensagens que sugeriam sincronização em nuvem foram corrigidas.
- O favicon Lovable foi preservado; os ícones PWA próprios ficam em `public/icons/`.

### 5. PWA e preparação de deploy

Foi implementado um plugin PWA local, sem nova dependência de runtime:

- `scripts/pwa-plugin.ts` gera/integra o service worker;
- `src/sw.js` implementa cache e fallback offline;
- `src/lib/pwa.ts` registra o worker apenas em produção, contexto seguro, janela principal e navegador compatível;
- `public/manifest.webmanifest` define a instalação;
- `public/offline.html` é o fallback de URL não visitada;
- ícones maskable e Apple touch icon foram adicionados;
- `netlify.toml` prepara o preset Nitro Netlify;
- `docs/pwa-deploy.md` documenta build, publicação, HTTPS, instalação Android e limites.

Política do service worker:

- navegação e GET público usam network-first;
- assets e offline page são precacheados;
- mutações, requests com `Authorization`, respostas `private`/`no-store`, terceiros e iframes não são cacheados;
- IndexedDB não é apagado em atualização;
- PWA não é backup dos dados locais.

## Validações já registradas

As validações registradas no trabalho anterior foram:

- 26 testes automatizados passando;
- typecheck passando;
- build Nitro `netlify` passando;
- build Nitro `node-server` passando;
- lint sem erros, com seis avisos preexistentes de `react-refresh/only-export-components`;
- `git diff --check` passando;
- manifest, service worker, MIME e status HTTP locais verificados;
- Chromium/Brave em viewport `393 × 852` sem erros de instalação ou JavaScript;
- páginas visitadas funcionando offline;
- fallback de página não visitada funcionando;
- service worker não sendo registrado dentro de iframe;
- Lighthouse local: performance 59, acessibilidade 100, boas práticas 100 e SEO 100.

As pendências de performance observadas foram fontes externas bloqueantes, JavaScript não utilizado e latência/cadeia de recursos. A medição precisa ser repetida na URL HTTPS pública quando houver deploy.

## Onde exatamente paramos

Paramos na transição entre “preparação local concluída” e “publicação externa”. O app está tecnicamente preparado para o primeiro deploy, mas a sequência externa ainda não foi executada:

1. revisar o diff e confirmar os arquivos que entrarão no commit;
2. criar um commit convencional em inglês;
3. fazer push para `main`, sem reescrever histórico do Lovable;
4. importar `s2ddv/halo-device` em um novo site Netlify;
5. configurar/confirmar build `npm run build`, preset `NITRO_PRESET=netlify`, publish `dist` e Node 24;
6. aguardar o deploy e registrar a URL pública;
7. validar HTTPS, rotas diretas, manifest, service worker, offline e instalação no Galaxy A54;
8. repetir Lighthouse na URL publicada.

## O que ainda não deve ser declarado como concluído

Ainda não há comprovação de:

- commit final das mudanças PWA;
- push dessas mudanças;
- site ou projeto Netlify;
- URL pública;
- deploy em produção;
- instalação física no Galaxy A54;
- compatibilidade proprietária completa com a HALO BAND;
- decodificação de frequência cardíaca, bateria ou histórico do protocolo proprietário;
- sincronização com nuvem, backend, login ou backup;
- aplicativo Android/Kotlin nativo.

## Próxima sequência recomendada

Primeiro, revisar `git diff`, rodar novamente `npm test`, `npm run typecheck`, `npm run lint`, `NITRO_PRESET=netlify npm run build` e `git diff --check`. Depois, criar o commit em inglês e publicar somente após confirmar que o diff contém apenas o escopo HALO/PWA/BLE esperado.

Depois do push, realizar o deploy Netlify e validar a aplicação hospedada. Só então testar a instalação no A54 e o fluxo BLE em HTTPS. A investigação do protocolo proprietário deve continuar separada da publicação do PWA, usando capturas descartáveis e sem versionar número de série, endereço Bluetooth ou dados pessoais.

## Referências no repositório

- [Modelo de dados](data-model.md)
- [Protocolo BLE](ble-protocol.md)
- [Deploy e instalação PWA](pwa-deploy.md)
- [Plano de APK Android](android-apk-plan.md)
- [README do projeto](../README.md)
