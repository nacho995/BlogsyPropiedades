# Guía de Configuración: subir.realestategozamadrid.com

Esta guía te ayudará a configurar el subdominio `subir.realestategozamadrid.com` y `www.subir.realestategozamadrid.com` para tu aplicación hospedada en Render.

## Arquitectura

- **Frontend principal**: `realestategozamadrid.com` (alojado en Vercel)
- **API/Backend**: `gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com` (alojado en AWS Elastic Beanstalk)
- **Este proyecto**: `subir.realestategozamadrid.com` y `www.subir.realestategozamadrid.com` (alojado en Render)

## Pasos para la configuración

### 1. Despliegue en Render

1. **Crear o actualizar un servicio en Render**:
   - Tipo: "Static Site"
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Variables de entorno:
     ```
     VITE_BACKEND_URL=https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com
     VITE_API_URL=https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com
     VITE_API_PUBLIC_API_URL=https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com
     ```

2. **Desplegar tu aplicación:**
   - Ejecuta `./deploy-render.sh` para construir localmente
   - O configura el despliegue automático desde tu repositorio

### 2. Configurar dominios personalizados en Render

1. En tu proyecto en Render, ve a "Settings" > "Custom Domains"
2. Haz clic en "Add Custom Domain"
3. Agrega `subir.realestategozamadrid.com`
4. Repite el proceso y agrega `www.subir.realestategozamadrid.com`

### 3. Configurar DNS en Cloudflare

1. Inicia sesión en tu cuenta de Cloudflare
2. Selecciona el dominio `realestategozamadrid.com`
3. Ve a la sección "DNS"
4. Agrega dos registros:

   **Registro 1 (sin www):**
   - Tipo: CNAME
   - Nombre: subir
   - Contenido: [tu-app].onrender.com (URL proporcionada por Render)
   - TTL: Auto
   - Proxy: Activado (nube naranja)

   **Registro 2 (con www):**
   - Tipo: CNAME
   - Nombre: www.subir
   - Contenido: [tu-app].onrender.com (misma URL que arriba)
   - TTL: Auto
   - Proxy: Activado (nube naranja)

### 4. Verificar la propagación DNS

Una vez configurados los DNS, puede tomar algún tiempo para que los cambios se propaguen (generalmente entre minutos y 48 horas).

Para verificar si la configuración está activa:
```bash
dig subir.realestategozamadrid.com
dig www.subir.realestategozamadrid.com
```

También puedes intentar acceder a:
- `https://subir.realestategozamadrid.com`
- `https://www.subir.realestategozamadrid.com`

## Resolución de problemas

Si encuentras problemas al configurar o acceder a tu subdominio:

1. **Verifica los registros DNS en Cloudflare**
   - Asegúrate de que los registros CNAME estén configurados correctamente
   - Verifica que el proxy esté activado (nube naranja)

2. **Verifica la configuración en Render**
   - Asegúrate de que los dominios personalizados estén correctamente agregados
   - Verifica que Render haya verificado la propiedad del dominio

3. **Comprueba los archivos de configuración**
   - `_redirects`: Asegura que SPA routing funcione correctamente
   - `render.json`: Configuración adicional de rutas y cabeceras

4. **Verificar conexión con el backend**
   - Asegúrate de que `gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com` está accesible
   - Verifica que la API responde correctamente a las peticiones

5. **Problemas conocidos y soluciones:**
   - **Error "Could not resolve '../context/AuthContext'"**: Este error ha sido solucionado añadiendo un archivo de compatibilidad en `src/context/AuthContext.jsx` que actúa como puente hacia `UserContext.jsx`.
   - Si encuentras este error, asegúrate de tener la versión más reciente del código que incluye esta solución.
   
   - **Error "Estructura de respuesta de login inesperada"**: Este error ocurre cuando el formato de respuesta del backend durante el login no tiene la estructura esperada. La solución implementada:
     - Se ha mejorado la función `loginUser` en `src/services/api.js` para manejar múltiples formatos de respuesta.
     - Se ha actualizado el componente `SignIn.jsx` para intentar extraer el token y los datos de usuario de varias estructuras posibles.
     - Se ha añadido más información de depuración para facilitar la solución de problemas futuros.
   
   - **Si persiste el error de login**, intenta depurar con los mensajes de consola ampliados o contáctanos para recibir asistencia.

## Mantener la configuración

Cada vez que despliegues una nueva versión de tu aplicación:

1. Construye tu aplicación con `npm run build`
2. Si usas despliegue automático con Render, los cambios se aplicarán automáticamente
3. Si haces despliegue manual, asegúrate de actualizar los archivos en Render

## Notas adicionales

- El archivo `_redirects` en la carpeta `public` garantiza que las rutas de tu SPA funcionen correctamente
- El archivo `render.json` configura correctamente las cabeceras HTTP para mayor seguridad 