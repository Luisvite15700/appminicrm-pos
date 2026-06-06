> Editado para usar en IDX el 07/09/12

# Bienvenido a tu app Expo 👋

Este es un proyecto [Expo](https://expo.dev) creado con [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Comenzar

#### Android

Las vistas previas de Android se definen como un gancho `workspace.onStart` e se inician como una tarea de vscode cuando el espacio de trabajo se abre/inicia.

Nota: si no puedes encontrar la tarea, entonces:
- Reconstruir el entorno (usando la paleta de comandos: `IDX: Rebuild Environment`), o
- Ejecutar `npm run android -- --tunnel` para ejecutar android manualmente y ver el resultado en tu terminal. El dispositivo debería detectar este nuevo comando y cambiar para comenzar a mostrar el resultado.

En el resultado de este comando/tarea, encontrarás opciones para abrir la app en:

- [compilación de desarrollo](https://docs.expo.dev/develop/development-builds/introduction/)
- [emulador de Android](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Expo Go](https://expo.dev/go), un sandbox limitado para probar el desarrollo de apps con Expo

También encontrarás opciones para abrir el menú de desarrollador de la app, recargar la app, y más.

#### Web

Las vistas previas web se iniciarán y administrarán automáticamente. Usa la barra de herramientas para actualizar manualmente.

Puedes comenzar a desarrollar editando los archivos dentro del directorio **app**. Este proyecto usa [enrutamiento basado en archivos](https://docs.expo.dev/router/introduction).

## Obtener un proyecto nuevo

Cuando estés listo, ejecuta:

```bash
npm run reset-project
```

Este comando moverá el código de inicio al directorio **app-example** y creará un directorio **app** en blanco donde puedes comenzar a desarrollar.

## Aprender más

Para aprender más sobre el desarrollo de tu proyecto con Expo, consulta los siguientes recursos:

- [Documentación de Expo](https://docs.expo.dev/): Aprende los fundamentos o profundiza en temas avanzados con nuestras [guías](https://docs.expo.dev/guides).
- [Tutorial de Expo](https://docs.expo.dev/tutorial/introduction/): Sigue un tutorial paso a paso donde crearás un proyecto que se ejecuta en Android, iOS y web.

## Únete a la comunidad

Únete a nuestra comunidad de desarrolladores que crean apps universales.

- [Expo en GitHub](https://github.com/expo/expo): Ver nuestra plataforma de código abierto y contribuir.
- [Comunidad de Discord](https://chat.expo.dev): Chatea con usuarios de Expo y haz preguntas.
