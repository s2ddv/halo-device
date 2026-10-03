# PWA Halo Band e deploy HTTPS

## Build e SSR

`vite.config.ts` usa `@lovable.dev/vite-tanstack-config`: TanStack Start, React,
Tailwind e Nitro já vêm incluídos. Não há `app.config` separado. O destino padrão
é `cloudflare-module`, mas `NITRO_PRESET` seleciona outro adaptador fora do build
interno do Lovable. `src/server.ts` envolve o entry SSR do TanStack e trata erros;
a raiz mantém `HeadContent`, `Scripts` e a hidratação existente.

Escolha de hospedagem: **Netlify**, usando o preset Nitro `netlify`, com arquivos
em `dist/` e SSR em `.netlify/functions-internal/`. Não publicar apenas o diretório
estático: as rotas precisam da função SSR. Não adicionar rewrite SPA para
`index.html`, pois o Nitro gera os redirects para a função.

## Desenvolvimento e teste local

Node 24 e dependências do lockfile Bun:

```sh
bun install --frozen-lockfile
npm run dev
```

O dev server não registra service worker. Para testar instalação/offline, use um
build real; os comandos abaixo usam shell POSIX:

```sh
NITRO_PRESET=node-server npm run build
PORT=4173 node .output/server/index.mjs
```

Abra `http://localhost:4173` no Chrome/Chromium. Localhost é aceito como contexto
seguro para o teste. `http://IP-DO-PC:4173` no celular não é equivalente: use o
endereço HTTPS do deploy para instalar e testar BLE no Android.

```sh
curl -I http://localhost:4173/manifest.webmanifest
curl -I http://localhost:4173/sw.js
npm test
npm run typecheck
npm run lint
NITRO_PRESET=netlify npm run build
```

No DevTools, Application > Manifest deve mostrar Halo Band e os três ícones.
Application > Service Workers deve mostrar `/sw.js` ativo. Após abrir `/` e
`/profile` online, simule Offline e recarregue: as páginas visitadas funcionam.
Uma URL não visitada mostra a tela offline. Em um perfil limpo, carregar o app
somente dentro de iframe não deve criar registro de service worker.

## Deploy Netlify

1. Envie este commit ao GitHub e importe `s2ddv/halo-device` em um novo site Netlify.
2. Use branch `main`, diretório raiz do repo; mantenha as configurações de
   `netlify.toml`: build `npm run build`, publish `dist`, Node 24 e
   `NITRO_PRESET=netlify`. Instale dependências com Bun e o `bun.lock` existente.
3. Não é necessário token de API ou variável de aplicação nesta fase. Não copie
   variáveis internas `LOVABLE_*` para a Netlify. Valores `VITE_*` são públicos;
   nunca colocar segredos neles.
4. Faça deploy e abra a URL `https://<site>.netlify.app`. Se configurar domínio
   próprio, aguarde emissão do certificado e confirme o redirecionamento HTTPS.
5. Confira `/`, uma rota direta como `/profile`, `/manifest.webmanifest`, `/sw.js`
   e os ícones. O manifest deve ter MIME `application/manifest+json`; o SW deve
   responder JavaScript, com `Cache-Control: no-cache`.

Configuração preparada e builds validados; nenhum site ou URL pública foi criado
por esta alteração. O funcionamento da função e headers na infraestrutura real
precisa do primeiro deploy.

## Instalar no Galaxy A54

1. Abra a URL HTTPS publicada no **Chrome**, fora do preview Lovable.
2. Menu ⋮ > **Adicionar à tela inicial** > **Instalar** (o texto varia por versão).
3. Abra Halo pelo ícone. Para conectar à pulseira, desconecte QRing/nRF Connect,
   entre em Perfil e toque em Procurar dispositivo.

Safari/iOS pode instalar o site, mas não suporta o fluxo Web Bluetooth deste app.
Instalar o PWA não concede BLE em segundo plano nem equivale ao futuro app Kotlin.

## Cache, atualizações e limites

O plugin local `scripts/pwa-plugin.ts` emite o SW somente no bundle cliente,
compatível com a cópia de assets do Nitro, sem plugin duplicado nem dependência
nova. O build gera uma versão a partir dos assets e do worker. O registro ocorre
só em produção, contexto seguro, janela principal e navegador com service worker.
Requests de iframes também passam diretamente à rede se já existir SW na origem.

JS/CSS e ícones usam precache. A página inicial é salva durante instalação;
navegações usam rede primeiro e retornam a versão da mesma URL quando offline.
Dados GET também usam rede primeiro, mas só são persistidos se a resposta declarar
`Cache-Control: public`; `private`, `no-store`, Authorization, outros domínios e
mutações não são cacheados pelo worker. Cada cache de runtime tem limite de 40
entradas. Não existe API remota de saúde neste app atualmente. Ao introduzir
login, revisar explicitamente cache de páginas SSR e política de logout.

Uma versão nova aguarda fechamento das abas antigas; ao reabrir, ativa e remove
os caches antigos do Halo. Não apaga IndexedDB nem altera scores/mocks. Fontes
Google continuam externas: aparência offline depende também do cache do navegador,
com fallback para fontes do sistema. Dados locais podem ser removidos ao limpar
os dados do site; PWA não é backup.

Os ícones são placeholders próprios com “H”, fundo `#121414`, símbolo dentro da
zona segura maskable. O favicon existente era do Lovable e foi preservado;
`public/icons/halo.svg` é a fonte vetorial dos quatro PNGs (incluindo Apple 180).

## Validação em 28/09/2026

- Builds Nitro `netlify` e `node-server`: concluídos.
- HTTP local: app, manifest e SW com status 200 e MIME correto.
- Chromium/Brave headless, perfil normal, viewport 393 × 852: manifest sem erros,
  `Page.getInstallabilityErrors` vazio, documento com largura 393, sem erros JS.
- Recarregamento offline de início/perfil, fallback de URL não visitada e iframe
  sem registro: passaram. Instalação física no A54 ainda pendente.
- 26 testes automatizados passaram, incluindo cache público/privado, mutações,
  Authorization, iframe, BLE e Health Score. Typecheck passou; lint sem erros,
  seis avisos `react-refresh` preexistentes.
- Lighthouse mobile local: desempenho **59**, acessibilidade **100**, boas
  práticas **100**, SEO **100**. Pendências: renderização bloqueada por fontes,
  JavaScript não utilizado e latência de documento/cadeia de recursos. Resultados
  locais dependem da máquina e rede; repetir no HTTPS publicado.
- Lighthouse atual não inclui a antiga categoria PWA; a instalabilidade e o
  offline foram auditados separadamente no navegador. Não existe “nota PWA 100”.

Para repetir Lighthouse, com Chrome instalado e o servidor de produção ativo:

```sh
npx lighthouse http://localhost:4173 --view
```

Referências: [Nitro/Netlify](https://nitro.build/deploy/providers/netlify),
[remoção da categoria PWA no Lighthouse](https://github.com/GoogleChrome/lighthouse/issues/15535).
