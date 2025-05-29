# Configuración CORS para el Backend

Para resolver los problemas de CORS, necesitas agregar los siguientes encabezados en tu API backend (https://api.realestategozamadrid.com):

## Si estás usando Express.js

```javascript
// Instalar el middleware cors
// npm install cors

const express = require('express');
const cors = require('cors');
const app = express();

// Configuración de CORS
const corsOptions = {
  origin: 'https://blogsy-propiedades.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Aplicar CORS a todas las rutas
app.use(cors(corsOptions));

// O si prefieres configurarlo manualmente:
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://blogsy-propiedades.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Manejar las solicitudes OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
```

## Si estás usando otro framework

Independientemente del framework que estés utilizando, necesitas configurar estos encabezados en todas las respuestas:

```
Access-Control-Allow-Origin: https://blogsy-propiedades.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Si estás utilizando Nginx como proxy

Si tienes Nginx como servidor proxy delante de tu API, puedes agregar esta configuración:

```nginx
location / {
    # Otras configuraciones...
    
    # Configuración CORS
    add_header 'Access-Control-Allow-Origin' 'https://blogsy-propiedades.vercel.app' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    # Manejar preflight OPTIONS
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://blogsy-propiedades.vercel.app' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Content-Type' 'text/plain charset=UTF-8';
        add_header 'Content-Length' '0';
        return 204;
    }
    
    # Configuración del proxy
    proxy_pass http://your_backend_server;
    # Otras configuraciones de proxy...
}
```

Aplica esta configuración en tu backend y luego tu frontend debería poder comunicarse directamente con la API sin problemas de CORS.
