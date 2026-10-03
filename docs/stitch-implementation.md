# HALO Device: implementação do Stitch

Referência: projeto Stitch `5467468568619301087` (HALO Device), com dez telas
consultadas pelo MCP e HTML exportado usado como referência de implementação.
O sistema visual e as decisões de adaptação estão em [DESIGN.md](../DESIGN.md).

## Novas referências do Stitch (03/10/2026)

| Tela | Rota | ID no Stitch |
| --- | --- | --- |
| Dashboard de Saúde HALO | `/` | `58bff1aa1e9c4b8e903828bfc19d2268` |
| Frequência Cardíaca | `/heart-rate` | `ba8c5e8440da4c2e925fb4e1e625b1e8` |
| Detalhes do Sono | `/sleep` | `862ac020ecd546a5a4fc57a6f8803177` |
| Oxigênio no Sangue | `/spo2` | `f52fa4f599284f8699f0482a15b8c652` |
| Monitoramento de Estresse | `/stress` | `4c982bb19e524278bb692e970cadeb17` |
| Temperatura Corporal | `/temperature` | `19e64f3182814be19c674b6143ed2382` |
| Atividades Detalhadas | `/activity` | `9dbb09f250cc43d68b7eee3e6eb97818` |
| Relatórios de Saúde | `/reports` | `426d85e918974f128ea7e3a0d8d5599c` |
| Atividades e Recordes | `/workout` | `2cc7076f8337421497ee6cc36e0c6bcd` |
| Meu Perfil | `/profile` | `a97b21b243c24f9083d3e34c4253f207` |

As rotas de detalhe compartilham seletores de período/data e componentes de
estatísticas, tendências e distribuição. Exportações CSV incluem `source=demo`.
A respiração guiada usa um timer local cancelável, sem alterar métricas.
Os novos layouts não reproduzem afirmações clínicas, sincronização ou sensor
ativo sem evidência. A data do sono identifica a mesma noite ilustrativa;
as demais séries demonstrativas variam deterministicamente com a data.

## Telas e componentes

- Início: cards por métrica, anel de score ilustrativo, foco que reorganiza
  métricas e acesso à progressão pessoal.
- Relatórios: períodos semanal/mensal, barras empilhadas de sono, cards de
  batimentos e SpO₂, temperatura e acesso às métricas complementares.
- Atividades: anel diário, metas locais, lista expansível de sessões demo,
  detalhes acessíveis, acesso a recordes e cronômetro de sessão.
- Perfil: dispositivo experimental, histórico IndexedDB, metas editáveis,
  preferências, pontuação demonstrativa e diálogos de privacidade/integrações.
- Detalhes de sono, recuperação, batimentos, SpO₂ e progressão preservados e
  harmonizados com o tema; dados de demonstração permanecem identificados.

Componentes separados em `src/components/health`, `profile` e `workout`.
Fixtures das novas telas em `src/lib/demo/dashboard.ts`.
Navegação com quatro abas, safe areas, foco de teclado, diálogos Radix e respeito
à preferência de movimento reduzido. Layout mobile e grade dupla no desktop.

## Adaptações às premissas

O conceito Stitch inclui nomes fictícios, Premium, conta verificada, previsões
de ciclo, detecção automática de treino e integrações externas. Esses elementos
não comprovam capacidades implementadas. A interface usa perfil local e explica
funcionalidades sem fonte de dados; a progressão continua privada. A área de
recuperação preserva o escopo do projeto no lugar de previsões de ciclo.
O cronômetro não estima calorias/distância, não persiste medições e é reiniciado
ao sair da página. A conexão BLE é mantida ao alternar as abas internas do perfil;
ao sair da rota, continua sendo desconectada com limpeza de recursos.

## Integração disponível e bloqueio de backend

Metas e foco usam `src/lib/preferences.ts`. O perfil usa `useHealth()`/IndexedDB
para histórico real e `connectBand()` para a conexão experimental já existente.
As leituras proprietárias continuam apenas na sessão e não alimentam scores.

Este checkout NÃO possui API de domínio, autenticação ou banco remoto.
`src/server.ts` é o adaptador SSR do TanStack, não um backend de saúde.
A pasta `backend/` aparece somente como arquitetura planejada no README.
Para integrar o backend solicitado, é necessário o repositório ou URL e contrato
da API, autenticação e um ambiente de teste. Não criar endpoints fictícios nem
tratar persistência do navegador como integração concluída.

## Validação

- `npm test`: 28 testes passando (saúde, BLE e política do service worker).
- `npm run typecheck`: sem erros.
- `npm run lint`: sem erros, seis avisos preexistentes de Fast Refresh.
- `NITRO_PRESET=netlify npm run build`: produção compilada.
- Navegador: dashboard e relatórios em desktop/mobile; períodos semanal/mensal;
  lista de esportes; iniciar/encerrar cronômetro; metas e foco persistidos; perfil
  sem Bluetooth mostra indisponibilidade e histórico vazio sem inventar dados.

Build e testes locais não comprovam deploy público nem compatibilidade física
com a pulseira. O backend permanece pendente até que a API seja identificada.
