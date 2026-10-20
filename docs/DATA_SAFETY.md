# Google Play Data Safety

Esta matriz describe el comportamiento técnico actual de MicroNotes Voice.
Debe revisarse en Play Console antes de cada publicación y ajustarse a las
políticas vigentes de Google y del proveedor de reconocimiento instalado.

## Resumen técnico

| Categoría | Comportamiento de la aplicación |
| --- | --- |
| Texto de notas y categorías | Se guarda únicamente en el dispositivo. |
| Audio | No se guarda como archivo ni se envía a un servidor propio. Se procesa durante el dictado por el servicio de reconocimiento del sistema. |
| Configuración | Idioma y forma de pantalla se guardan únicamente en el dispositivo. |
| Identificadores, ubicación, contactos y actividad | No se recopilan. |
| Publicidad y analítica | No existen. |
| Cuenta o autenticación | No existe. |

Android desactiva la copia automática de los datos de la aplicación mediante
`android.allowBackup: false`.

## Declaraciones que deben verificarse en Play Console

- La app no vende datos.
- La app no comparte datos con un servidor o tercero controlado por el
  desarrollador.
- El reconocimiento de voz usa el proveedor elegido por el sistema; sus
  condiciones de procesamiento deben revisarse por separado antes de indicar
  que el audio nunca sale del dispositivo.
- El texto de las notas puede contener información personal introducida por el
  usuario. La aplicación no puede detectar ni clasificar ese contenido.
- La eliminación desde Ajustes elimina las notas del almacenamiento local de
  la aplicación.

## Permisos

- Android: `RECORD_AUDIO` y `VIBRATE`.
- iOS: micrófono y reconocimiento de voz.

La aplicación no solicita ubicación, contactos, cámara, fotos, archivos ni
notificaciones.
