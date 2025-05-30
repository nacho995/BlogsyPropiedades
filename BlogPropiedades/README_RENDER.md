# Configuración para Render

Este documento contiene las instrucciones para configurar correctamente la aplicación en Render, resolviendo los problemas de conexión entre el frontend HTTPS y el backend HTTP.

## Variables de Producción

```env
VITE_BACKEND_URL=https://api.realestategozamadrid.com
VITE_API_URL=https://api.realestategozamadrid.com
VITE_API_PUBLIC_API_URL=https://api.realestategozamadrid.com
VITE_FALLBACK_API=https://api.realestategozamadrid.com
VITE_MAIN_DOMAIN=realestategozamadrid.com
```

## Variables de entorno para Render

Configura las siguientes variables de entorno en la sección "Environment" de tu servicio en Render:

```
# API URLs - Configuración para backend HTTP
VITE_BACKEND_URL=http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com
VITE_API_URL=http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com
VITE_API_PUBLIC_API_URL=http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com
VITE_FALLBACK_API=http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com

# Configuración general
VITE_APP_MODE=production
VITE_MAIN_DOMAIN=realestategozamadrid.com
VITE_DEBUG_LEVEL=error

# Configuración CORS y contenido mixto
VITE_DISABLE_CORS_PROXY=true
VITE_ALLOW_MIXED_CONTENT=true
VITE_DIRECT_API_ACCESS=true
VITE_FORCE_HTTP=true
VITE_IGNORE_PROTOCOL_MISMATCH=true
```

## Soluciones implementadas

Hemos implementado las siguientes soluciones para permitir la conexión al backend HTTP desde un frontend HTTPS:

1. **Acceso directo**: Desactivamos los proxies CORS que estaban causando problemas
2. **Forzar HTTP**: Aseguramos que todas las llamadas al backend usen HTTP
3. **Reducción de advertencias**: Minimizamos las advertencias para mayor claridad

## Solución a largo plazo

La solución óptima sería configurar HTTPS en el backend de AWS Elastic Beanstalk. Para ello:

1. Verifica que el certificado SSL configurado en tu load balancer sea válido
2. Asegúrate de que los grupos de seguridad permitan tráfico en el puerto 443
3. Reinicia el entorno para aplicar las configuraciones

## Problemas conocidos

Esta configuración puede generar advertencias de "contenido mixto" en navegadores, ya que estás cargando recursos HTTP desde una página HTTPS. Estas advertencias pueden ignorarse para desarrollo, pero para producción deberías considerar:

1. Usar Cloudflare como proxy intermedio
2. Configurar correctamente HTTPS en el backend
3. Usar AWS API Gateway como capa intermedia con HTTPS

## Cómo resolver problemas

Si sigues experimentando problemas:

1. Verifica la consola del navegador para ver errores específicos
2. Asegúrate de que tu backend responda correctamente a peticiones HTTP
3. Considera usar una extensión de navegador para deshabilitar temporalmente la seguridad de contenido mixto durante el desarrollo 

# Configuración de Variables de Entorno para Render

## Variables de Entorno Principales

```bash
VITE_BACKEND_URL=https://nextjs-gozamadrid-qrfk.onrender.com
VITE_API_URL=https://nextjs-gozamadrid-qrfk.onrender.com
VITE_API_PUBLIC_API_URL=https://nextjs-gozamadrid-qrfk.onrender.com
VITE_FALLBACK_API=https://nextjs-gozamadrid-qrfk.onrender.com
VITE_MAIN_DOMAIN=realestategozamadrid.com
```

## Build Command
```bash
npm run build
```

## Start Command  
```bash
npm run serve
```

## Variables de Entorno Alternativas (para diferentes dominios)

```bash
VITE_BACKEND_URL=http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com
VITE_API_URL=http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com
VITE_API_PUBLIC_API_URL=http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com
VITE_FALLBACK_API=http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com
``` 