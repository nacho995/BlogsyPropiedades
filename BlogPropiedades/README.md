# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Blog Propiedades - Subdominio de realestategozamadrid.com

Este proyecto es un blog de propiedades inmobiliarias que se despliega como subdominio de realestategozamadrid.com.

## Opciones de Despliegue

### Opción 1: AWS Amplify (Recomendada)

1. Inicia sesión en la consola de AWS.
2. Busca y selecciona "AWS Amplify".
3. Haz clic en "Crear nueva aplicación".
4. Selecciona tu proveedor de repositorio (GitHub, Bitbucket, etc.) y conecta tu repositorio.
5. Configura las opciones de compilación:
   - Nombre de la aplicación: blog-gozamadrid
   - Rama: main (o la rama que desees desplegar)
   - Comando de compilación: npm run build
   - Directorio de salida: dist
6. Haz clic en "Siguiente" y luego en "Guardar y desplegar".
7. Una vez desplegada, copia la URL generada por Amplify.

### Opción 2: AWS Elastic Beanstalk

1. Asegúrate de tener instalada la CLI de AWS Elastic Beanstalk:
   ```
   pipx install awsebcli
   ```

2. Inicializa la aplicación:
   ```
   eb init -p "Node.js 18" blog-gozamadrid --region eu-west-3
   ```

3. Crea un entorno:
   ```
   eb create blog-gozamadrid-env
   ```

4. Despliega la aplicación:
   ```
   eb deploy
   ```

5. Una vez desplegada, copia la URL generada por Elastic Beanstalk.

## Configuración de Cloudflare

1. Inicia sesión en tu cuenta de Cloudflare.
2. Selecciona el dominio realestategozamadrid.com.
3. Ve a la sección "DNS" en el panel lateral.
4. Agrega un registro CNAME:
   - Tipo: CNAME
   - Nombre: blog
   - Destino: [URL de tu aplicación en AWS]
   - Proxy: Activado
5. Configura SSL/TLS en modo "Full".
6. Crea una regla de página para redirigir HTTP a HTTPS.

## Desarrollo Local

1. Clona el repositorio.
2. Instala las dependencias:
   ```
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```
   npm run dev
   ```
4. Abre http://localhost:5173 en tu navegador.

## Construcción para Producción

```
npm run build
```

Los archivos de producción se generarán en la carpeta `dist`.
