# MicroNotes Voice

Notas de voz rápidas a texto para smartwatch. React Native + Expo (SDK 57), TypeScript estricto.
Graba, transcribe, categoriza (General, Trabajo, Idea, Urgente), guarda sin conexión y reproduce con voz.

## Qué plataforma de reloj soporta

- **Wear OS (Android): sí.** Es Android, así que un build de Expo corre en el reloj.
- **watchOS (Apple Watch): no con Expo/React Native.** Para Apple Watch hace falta un target nativo en SwiftUI.
  El proyecto también corre en un teléfono para desarrollo (se ve con el layout "cuadrado").
- **Web: no soportada.** El producto requiere funciones nativas de voz y está limitado a iOS, Android y Wear OS.

## Cómo ejecutarlo

| | Expo Go | Development build | Release |
|---|---|---|---|
| Para qué | Emulación de interfaz y flujo | Desarrollo y pruebas completas | Entrega final |
| Micrófono real | No, simulado | Sí | Sí |
| Dónde corre | Teléfono | Teléfono y Wear OS | Teléfono y Wear OS |
| Recarga en vivo | Sí | Sí | No |

### A) Emulación con Expo Go

El proyecto usa SDK 57, compatible con Expo Go `57.0.9`. Esta modalidad sirve
para validar la interfaz y el flujo completo, pero Expo Go no incluye el módulo
nativo `expo-speech-recognition`, así que el dictado se simula.

```bash
npm run start:go
```

Abre el proyecto desde Expo Go escaneando el QR. No necesitas un development
build para esta modalidad.

### B) Teléfono con development build

Comprueba que la sesión EAS sea la correcta:

```bash
npx eas-cli@latest whoami
```

Debe mostrar `anahi_olm`. El development build incluye el módulo nativo de voz
y permite probar el micrófono real.

Para Android:

```bash
npm run apk:dev
npm run start:dev
```

Instala el APK que entrega EAS en el teléfono y abre el development build.

Para iPhone físico:

```bash
npm run ios:dev
npm run start:dev
```

El build de iOS para dispositivo requiere una cuenta Apple Developer de pago.
Después de instalarlo, `start:dev` conecta el build al servidor local; teléfono
y computadora deben estar en la misma red Wi-Fi.

### C) Builds de prueba y entrega final (EAS Build)

Una sola vez (cuenta de Expo):

```bash
npx eas-cli@latest whoami  # debe mostrar anahi_olm
npx eas-cli login
npx eas-cli init          # agrega el projectId a app.json
```

| Comando | Genera | Uso |
|---|---|---|
| `npm run apk:dev` | APK development build, teléfono | Desarrollo con recarga y micrófono real |
| `npm run ios:dev` | Development build iOS, teléfono | Desarrollo con recarga y micrófono real |
| `npm run apk:dev-wear` | APK development build, **reloj** | Lo mismo en Wear OS |
| `npm run apk:standalone` | APK independiente, teléfono | Arranca sin Expo Go ni Metro |
| `npm run apk:phone` | APK de pruebas, teléfono | Pruebas completas sin servidor de desarrollo |
| `npm run apk:wear` | **APK final para reloj** | Entrega e instalación con adb |
| `npm run aab:wear` | AAB para reloj | Publicar en Google Play |

Los perfiles `*-wear` activan `WEAR_OS=1`, que habilita `plugins/withWearOS.js` (marca la app como app de reloj, independiente del teléfono).
`apk:standalone` usa el perfil EAS `standalone`, no incluye `developmentClient` y contiene el bundle JavaScript; después de instalarlo no se debe ejecutar `start:dev`.
Los demás perfiles generan un APK instalable en teléfonos.

Instalar el APK en el reloj (descarga el `.apk` desde el enlace que muestra EAS al terminar):

```bash
adb connect <ip>:<puerto>     # Opciones de desarrollador → Depuración por Wi-Fi
adb install -r micronotes-voice.apk
```

Firma: EAS genera y guarda el keystore en el primer build. Descarga una copia con `npx eas-cli credentials`:
si se pierde, no podrás actualizar la app en Google Play.

Alternativa sin EAS (Android Studio + SDK + JDK 17):

```bash
WEAR_OS=1 npx expo prebuild --platform android --clean     # PowerShell: $env:WEAR_OS="1"; npx expo prebuild ...
npx expo run:android --variant release --device
```

## Estructura

```
App.tsx                      Pager horizontal de 3 pantallas + barra de pestañas
app.json                     Permisos, plugin de voz, tema oscuro, versionCode
eas.json                     Perfiles de build (development, preview, wear, wear-store)
plugins/withWearOS.js        Config plugin del AndroidManifest para Wear OS
src/
  constants.ts               Categorías, idiomas, formas de pantalla
  types.ts                   Note, Settings
  theme.ts                   Paleta (#000000, #1C1C1E, #FF3B30, #30D158...) y tamaño táctil mínimo (60)
  store/useNoteStore.ts      Zustand + persist (AsyncStorage), validación al leer, deshacer
  voice/speechRecognition.ts Carga el módulo de voz solo si existe (sin módulo → simulación)
  hooks/useVoiceNote.ts      Máquina de estados: idle → starting → listening → processing → review/error
  hooks/useSpeaker.ts        Text-to-Speech (expo-speech), una nota a la vez
  hooks/useWatchLayout.ts    Detección redonda/cuadrada y márgenes seguros
  utils/formatDate.ts        "Hoy, 10:15 AM" / "Ayer, 4:30 PM" / "12 oct, 9:05 AM"
  utils/haptics.ts           Envoltorio seguro de expo-haptics
  components/                CategoryPills, PulseRing, TabBar, NoteCard (memo)
  screens/                   RecordScreen, NotesScreen, SettingsScreen
```

## Decisiones

- **Reconocimiento de voz:** `expo-speech-recognition` (soporta Expo con config plugin, hooks de eventos y resultados parciales).
  Se carga con `require` protegido para que la app no se cierre si falta el módulo nativo.
- **Estado:** Zustand con `persist`. Al leer AsyncStorage se descartan notas corruptas; si la lectura falla, la app abre igual con valores por defecto.
- **Navegación:** pager horizontal propio (3 páginas) en vez de React Navigation: menos dependencias y menos memoria en el reloj.
- **Flujo de grabación:** tocar el micrófono → hablar → el reconocedor termina solo al detectar silencio (o tocar de nuevo
  para detener) → revisión con categoría y botones Guardar/Descartar fijos abajo.
- **Tamaños táctiles:** todo botón mide al menos 60 de alto. Excepción: el ancho de las pestañas en pantallas **redondas**
  (42 a 53 según el reloj), porque a esa altura solo cabe una cuerda del círculo; en pantallas cuadradas miden 60.
- **Eliminar:** botón de papelera + vibración fuerte + aviso "Deshacer" 4 segundos. No se usa deslizar porque ya cambia de pantalla.
- **Sin búsqueda por texto:** escribir en un reloj es incómodo; hay un filtro por categoría de un toque.
- **Pantalla redonda:** margen superior de 13% de la altura y barra inferior elevada. Si la detección automática falla,
  se fuerza en Ajustes → Forma de la pantalla.

### Alcance de la versión 1.0

La versión inicial no incluye edición posterior del texto, compartir, copia de
seguridad en la nube ni búsqueda libre. Son funciones candidatas para una
versión posterior; añadirlas ahora aumentaría superficie, permisos y coste de
interacción en el reloj.

La política técnica de privacidad está en [PRIVACY.md](./PRIVACY.md) y la
matriz de revisión de Google Play en [docs/DATA_SAFETY.md](./docs/DATA_SAFETY.md).

## Límites conocidos

- Se guarda el **texto**, no el audio original. "Escuchar" lee el texto con Text-to-Speech (necesita altavoz o auriculares Bluetooth).
- El servicio de voz depende de la app de Google en el reloj. Si no existe (por ejemplo, emuladores), en modo desarrollo se simula el dictado;
  en un APK de producción se muestra un aviso.
- `continuous: false`: cada grabación termina en la primera pausa larga. Para dictados largos, cámbialo a `true` en `useVoiceNote.ts`.
- **Verificado aquí:** `tsc --noEmit`, lint, tests, `expo-doctor`, `expo export` del bundle Android,
  configuración EAS e introspección del manifest con y sin `WEAR_OS=1`. La lógica del store,
  el formato de fechas y el arranque sin módulo de voz (como en Expo Go) también se prueban con Jest.
- **No verificado:** ejecución en un reloj físico o emulado y un build cloud de EAS.
  La interfaz, la emulación de voz en Expo Go, la voz real y la vibración siguen pendientes de validar en dispositivo.
