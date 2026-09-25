# Dados locais e score

## Persistência

IndexedDB `halo-health`, versão 1: `measurements` (chave id, índice day) e
`summaries` (chave day). Writes só confirmam sucesso após o commit da transação.
IDs repetidos atualizam o mesmo registro. Falhas de armazenamento chegam à UI.
A base é local à origem/navegador; não há conta, nuvem ou backup automático.

Medições contêm métrica, valor, unidade, timestamp de coleta/recepção, data local,
fuso de coleta, dispositivo e origem BLE. A data fica fixada no fuso da coleta.
Não armazenamos bateria como métrica de saúde. Dados demonstrativos não são
aceitos pela API de persistência.

Resumos diários contêm os seis sub-scores (0–100 ou null), origem derivada e versão
do algoritmo. A API está preparada, mas nenhum resumo é inventado a partir de HR
instantânea. O agregador definitivo depende das métricas do protocolo validado.

## Regras implementadas

- Janela de até 30 dias de calendário, incluindo lacunas com zero após o início
  do histórico. Dias anteriores à primeira observação não são dias perdidos.
- Dia com alguma coleta mas sem os seis sub-scores é parcial: score null.
- Uma janela com dias parciais não publica um nível definitivo; não renormaliza pesos.
- Calibração: 14 dias distintos com observações; várias amostras no mesmo dia
  contam uma vez. Score de nível fica indisponível durante a calibração.
- Baseline: média diária de HR de repouso ou temperatura, pelo menos 60 dias
  observados nos 90 dias anteriores ao dia avaliado. O próprio dia não entra.
  HR instantânea não é substituto para HR de repouso.
- Baseline constante mantém desvio padrão zero no resultado; a decisão sobre
  tolerância mínima do sensor cabe ao futuro agregador, sem inventar score 100.

A política de dados parciais e a contagem de calibração são escolhas conservadoras
para esta primeira implementação. Não alteram a regra de zero para dias ausentes.

## Estado das telas

A UI existente permanece em demonstração explicitamente identificada. O perfil
mostra separadamente o histórico real persistido. O próximo passo depende da
validação física: decoder, agregação diária e substituição dos exemplos nas telas.
Correlações, alertas e recordes automáticos continuam pendentes desse histórico.
