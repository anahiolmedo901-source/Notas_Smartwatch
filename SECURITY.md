# Seguridad y dependencias

## Revisión actual

- `npx expo-doctor`: 21/21 comprobaciones correctas.
- `npm audit --omit=dev`: 28 avisos transitivos (23 altos y 5 moderados).
- Los avisos restantes provienen de la cadena de herramientas de Expo/Metro
  (`braces`, `node-forge` y `sprintf-js`), no de código de la aplicación que
  procese entradas remotas. `uuid` se fija mediante un override seguro para la
  API `uuid.v4()` usada por `xcode`.
- `npm audit fix --force` propone cambiar Expo a 44.0.6 y React Native a 0.88.0;
  no se ejecuta porque rompería la alineación con SDK 57.

## Mantenimiento

1. Revisar `npm audit --omit=dev` al actualizar Expo SDK.
2. Mantener `package-lock.json` y usar `npm ci` en CI.
3. No añadir claves, tokens, keystores ni archivos de credenciales al
   repositorio.
4. Resolver los avisos restantes mediante una actualización compatible de
   Expo/Metro; no añadir nuevos overrides sin validar el prebuild.

Los reportes de seguridad deben dirigirse al responsable de publicación de la
aplicación antes de abrir un issue público.
