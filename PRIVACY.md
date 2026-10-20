# Política de privacidad de MicroNotes Voice

Última actualización: 16 de octubre de 2026

MicroNotes Voice permite crear notas a partir de dictado de voz. Esta política
describe el tratamiento de datos en la versión actual de la aplicación.

## Datos que guarda la aplicación

- El texto de las notas, su categoría y fecha se guardan localmente en el
  dispositivo mediante AsyncStorage.
- El idioma de reconocimiento y la forma de pantalla también se guardan
  localmente.
- La aplicación no tiene cuentas, servidor propio, base de datos remota,
  publicidad, analítica ni seguimiento.
- La aplicación no conserva grabaciones de audio. Solo conserva el texto que
  devuelve el reconocimiento de voz.

## Reconocimiento de voz

Para dictar una nota, la aplicación solicita permiso para usar el micrófono y
entrega el audio al servicio de reconocimiento configurado en el sistema. En
Android normalmente es el servicio de Google instalado en el dispositivo.
Ese proveedor puede procesar el audio o la transcripción según sus propias
políticas y configuración de red. MicroNotes Voice no controla ni almacena
ese procesamiento.

Si el permiso se deniega, el dictado no se inicia. En un entorno de desarrollo
sin el módulo nativo puede mostrarse un dictado simulado; ese texto no
representa una grabación real.

## Texto a voz

La función de reproducción utiliza el motor de texto a voz del sistema. La
aplicación no envía el texto a un servidor propio. El motor instalado puede
tener sus propias políticas y requerir una conexión.

## Eliminación y control

- El usuario puede eliminar una nota individual y recuperar esa eliminación
  durante cuatro segundos.
- El usuario puede vaciar todas las notas desde Ajustes.
- Desinstalar la aplicación elimina los datos almacenados en su espacio local.
- En Android la aplicación desactiva la copia automática de sus datos; las
  copias de seguridad administradas por el sistema en iOS pueden seguir sus
  propias reglas.
- Los permisos de micrófono y reconocimiento de voz se pueden revocar desde
  los ajustes del sistema.

## Seguridad

No se transmiten datos a infraestructura propia. Los datos locales están
aislados por el sistema operativo; la aplicación no añade cifrado remoto ni
una copia de seguridad propia.

## Cambios

Esta política se actualizará si se añade una cuenta, sincronización, analítica,
publicidad o cualquier proveedor que cambie el tratamiento descrito aquí.

Antes de publicar la aplicación, la ficha de la tienda debe incluir un correo
real de contacto del responsable de privacidad.
