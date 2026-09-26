# HALO Android: primeiro APK pessoal

## Direção

Construir `android-app/` com Kotlin, Jetpack Compose e BLE nativo, conforme o
stack aprovado. O primeiro alvo físico é o Samsung Galaxy A54 do proprietário,
com sistema informado como atualizado. Registrar a versão exata do Android e
One UI em Configurações > Sobre o telefone > Informações do software antes do
primeiro teste; não deduzir a API a partir de “última versão”.

Este documento é um plano: ainda não há projeto Android, build Gradle ou APK
neste repositório. O app web continua na raiz e conectado ao Lovable.

## Entrega 1: APK debug instalável, com BLE em primeiro plano

Criar o módulo Android e Gradle Wrapper, definir applicationId estável e fixar
versões compatíveis de SDK, JDK, AGP, Kotlin e Compose na implementação.
Adotar minSdk 26 como proposta inicial; compilar e testar com SDK disponível
compatível com o Android do A54. Não é necessário backend para este marco.

Implementar uma tela Compose com procura de dispositivo, conexão, bateria,
medição manual de HR/SpO₂, estados de erro e desconexão. Portar o envelope Colmi
como módulo Kotlin puro, com testes equivalentes aos vetores sintéticos do web.
Usar os UUIDs de `ble-protocol.md`, comandos `03`, `69` e `6A`, fila de operações
GATT e timeout. Não depender de `navigator.bluetooth` dentro de uma WebView.

Solicitar permissões de dispositivos próximos no fluxo de conexão: em Android
12 ou superior, `BLUETOOTH_SCAN` e `BLUETOOTH_CONNECT`; tratar negação e Bluetooth
desligado. Para versões anteriores, implementar as permissões de localização e
Bluetooth aplicáveis. Usar `neverForLocation` somente se a implementação cumprir
a declaração e verificar se o scan ainda encontra a pulseira.

Gerar `./gradlew :app:assembleDebug`; artefato esperado, após criar o módulo:
`android-app/app/build/outputs/apk/debug/app-debug.apk`. Instalar no A54 por
`adb install -r` ou pelo arquivo APK, com autorização de instalação daquela
origem. O APK debug é para teste pessoal. Não versionar APKs nem chaves.

Aceite: instalar, conceder/negar permissões, descobrir a pulseira, consultar
bateria, medir HR e SpO₂, tratar timeout, desconectar e reconectar. Comparar os
valores com QRing em sessões separadas. Testar retorno do segundo plano e
Bluetooth desligado sem mostrar resultados antigos como uma medição nova.

## Entrega 2: uso pessoal com histórico local

Após validação física, persistir medições com Room (métrica, unidade, horário,
fuso, origem, dispositivo e versão do protocolo). Usar DataStore para
preferências e Hilt para dependências. Separar medições instantâneas de agregados
diários, baseline e score; HR instantâneo não equivale a HR de repouso.

Implementar histórico e exportação/exclusão local. Nenhum login, comparação
social ou envio de dados é necessário para o uso pessoal inicial. Trazer as
regras de calibração e score apenas quando houver dados suficientes e métricas
realmente suportadas. Leituras web não migram automaticamente para Room.

## Entrega 3: distribuição e continuidade

Gerar APK release assinado com chave estável guardada fora do Git; incrementos
de versionCode e a mesma assinatura permitem atualizar sem perder o histórico.
Planejar a transição do debug para release: assinaturas diferentes normalmente
exigem desinstalação ou applicationId separado, portanto exportar os dados antes.

Depois, decidir distribuição privada ou Google Play (AAB e requisitos vigentes
na ocasião). Backend/Retrofit, sincronização WorkManager e BLE em segundo plano
são fases posteriores. WorkManager não substitui uma conexão BLE contínua;
definir ciclo de vida, consumo de bateria e serviço em primeiro plano quando
essa necessidade for implementada.

## Referências oficiais

- [Permissões Bluetooth](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions).
- [Build por linha de comando](https://developer.android.com/build/building-cmdline).
- [Assinatura de aplicativos](https://developer.android.com/studio/publish/app-signing).
