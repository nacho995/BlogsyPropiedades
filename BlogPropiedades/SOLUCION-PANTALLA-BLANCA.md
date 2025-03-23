# Solución a problemas de pantalla en blanco

## Introducción

Este documento proporciona una guía paso a paso para resolver problemas comunes que pueden causar que la aplicación muestre una pantalla en blanco, especialmente en entornos de producción.

## Causas comunes de pantalla en blanco

1. **Errores JavaScript no controlados**: Errores durante la inicialización de la aplicación o en el renderizado inicial.
2. **Problemas con variables de entorno**: Configuración incorrecta o falta de variables de entorno necesarias.
3. **Problemas de CORS**: Bloqueo de solicitudes por políticas de seguridad.
4. **Dependencias faltantes o versiones incompatibles**: Especialmente después de actualizaciones.
5. **Problemas con localStorage**: Datos corruptos o inválidos en el almacenamiento local.
6. **Errores en la API**: Respuestas inesperadas del backend.

## Soluciones implementadas

Hemos implementado las siguientes soluciones preventivas:

1. **ErrorBoundary**: Componente que captura errores de React y muestra una interfaz amigable.
2. **Script de recuperación**: Código que detecta si la página no ha cargado contenido y muestra un mensaje de error.
3. **Manejo mejorado de errores**: Sistema para registrar y recuperarse de errores en diferentes niveles.
4. **Validaciones adicionales**: Comprobaciones más estrictas antes de usar datos que podrían ser nulos o indefinidos.

## Pasos para resolver pantallas en blanco

### Para usuarios

Si encuentras una pantalla en blanco:

1. **Actualiza la página**: Presiona F5 o el botón de actualizar en tu navegador.
2. **Limpia la caché del navegador**: 
   - Chrome: Configuración → Privacidad y seguridad → Borrar datos de navegación
   - Firefox: Opciones → Privacidad y Seguridad → Cookies y datos del sitio → Limpiar datos
   - O usa el modo incógnito/privado para probar.
3. **Comprueba la conexión a Internet**: Verifica que tienes conexión estable.
4. **Intenta otro navegador**: Si el problema persiste, prueba con otro navegador.
5. **Contacta con soporte**: Si nada funciona, contacta con el equipo de soporte técnico.

### Para desarrolladores

Si necesitas diagnosticar y solucionar el problema:

1. **Revisa la consola del navegador**:
   - Abre las herramientas de desarrollo (F12 o Ctrl+Shift+I)
   - Ve a la pestaña "Console" para ver mensajes de error
   - Busca errores de JavaScript o problemas de red (Network)

2. **Verifica el localStorage**:
   - En las herramientas de desarrollo, ve a Application → Local Storage
   - Comprueba si hay datos corruptos o inválidos
   - Puedes limpiar el localStorage con `localStorage.clear()` en la consola

3. **Comprueba las variables de entorno**:
   - Verifica que los archivos `.env` y `.env.production` tienen los valores correctos
   - Asegúrate de que la URL del backend es accesible

4. **Errores en la compilación**:
   - Ejecuta `npm run build` localmente para ver si hay errores
   - Revisa los logs de la plataforma de despliegue (Render, Vercel, etc.)

5. **Depuración avanzada**:
   - Agrega `localStorage.setItem('debug_mode', 'true')` en la consola
   - Recarga la página para habilitar mensajes de depuración adicionales
   - Los errores se guardarán en `localStorage.getItem('app_errors')`

## Prevención de futuros problemas

Para minimizar la ocurrencia de pantallas en blanco:

1. **Testing exhaustivo**: Asegúrate de probar la aplicación en diferentes navegadores y dispositivos.
2. **Manejo defensivo de datos**: Siempre verifica que los datos existen antes de usarlos.
3. **Monitoreo en producción**: Implementa herramientas como Sentry, LogRocket o similar.
4. **Actualiza dependencias con cautela**: Haz pruebas completas después de actualizar paquetes.
5. **Versionado de API**: Coordina los cambios entre frontend y backend.

## Recursos adicionales

- [Debugging JavaScript in Production](https://blog.sentry.io/debugging-javascript-in-production/)
- [React Error Boundaries Documentation](https://reactjs.org/docs/error-boundaries.html)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## Contacto para soporte

Si encuentras problemas que no puedes resolver, contacta con:
- Email: soporte@gozamadrid.com
- Sistema de tickets: [support.gozamadrid.com](https://support.gozamadrid.com)

---

Última actualización: 2023 