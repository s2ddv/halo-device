# HALO Device

Ecossistema privado de saúde e progresso pessoal, sem comparação social.

## O que existe neste repositório

O app web Halo Band criado com Lovable: React 19, TanStack Start e Router/Query,
TypeScript, Tailwind v4, Radix/shadcn e Recharts. O app permanece na raiz para
preservar a integração com Lovable. Não há backend nem autenticação implementados.
As telas de métricas e progressão ainda usam demonstrações, identificadas na interface.
Não há configuração de instalação/offline de PWA (manifest/service worker) neste momento.

- `src/routes/`: painel, métricas, perfil, relatórios e progressão.
- `src/lib/demo/`: exemplos de pontuação; nunca persistidos como medições reais.
- `src/lib/health/`: modelo de dados, histórico diário, calibração e persistência local.
- `src/lib/band-ble.ts`: experimento Web Bluetooth com serviços padrão de HR/bateria.
- `docs/ble-protocol.md`: plano de descoberta e registro do protocolo do hardware.
- `docs/data-model.md`: regras e limites da camada de dados.
- `tests/`: testes das regras de histórico e validação de dados.

## Desenvolvimento

Use Node.js 24. O lockfile existente é `bun.lock`; com Bun instalado, use
`bun install --frozen-lockfile`. Alternativamente, `npm install --package-lock=false`
instala os intervalos do package.json, sem a reprodutibilidade do lockfile Bun.

```sh
npm run dev
npm run typecheck
npm test
npm run lint
npm run build
```

## Estrutura planejada (ainda não incorporada)

- `android-app/`: Kotlin, Jetpack Compose, BLE nativo, Room, WorkManager, Retrofit,
  Hilt e DataStore.
- `backend/`: NestJS, PostgreSQL/TimescaleDB, Prisma, JWT, Redis e Docker.
- `dashboard/`: Next.js, Tailwind e Recharts.

O `.gitignore` cobre artefatos dessas aplicações sem excluir migrations,
lockfiles ou o Gradle Wrapper. Segredos e capturas privadas não devem ser versionados.

## Próximas etapas

1. Base do repositório e persistência local de dados reais.
2. Com a pulseira física: descobrir GATT, comandos e formato dos payloads.
3. Validar a captura da Halo Band, persistir e alimentar as telas com dados reais.
4. Calcular progressão, recordes, correlações e alertas sobre o histórico coletado.

Nenhum UUID proprietário foi presumido. Frequência cardíaca instantânea não é
tratada como frequência de repouso nem usada para inventar recuperação ou sono.
Os dados locais não são enviados à nuvem; apagar os dados do site remove o histórico.

## Lovable

[Editor do projeto](https://lovable.dev/projects/a74b9c94-6278-4c41-9b7c-2bd2f6c39afd).
Commits enviados à branch conectada sincronizam com o editor. Preserve o histórico
publicado: não use force push, rebase, amend ou squash em commits já enviados.
