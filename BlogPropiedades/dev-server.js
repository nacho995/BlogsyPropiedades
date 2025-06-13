import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// URL del backend real en Render
const BACKEND_URL = 'https://blogs.realestategozamadrid.com';

// Middleware
app.use(cors());
app.use(express.json());

// Función para hacer proxy a cualquier ruta
const proxyToBackend = async (req, res) => {
  try {
    const targetUrl = `${BACKEND_URL}${req.originalUrl}`;
    console.log(`🔄 Proxy: ${req.method} ${req.originalUrl} -> ${targetUrl}`);
    
    // Preparar headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Pasar el token de autorización si existe
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    
    // Configurar opciones de fetch
    const fetchOptions = {
      method: req.method,
      headers: headers
    };
    
    // Añadir body para métodos que no sean GET
    if (req.method !== 'GET' && req.method !== 'DELETE' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    // Hacer la petición al backend
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();
    
    console.log(`✅ Proxy response: ${response.status} for ${req.originalUrl}`);
    
    // Retornar la respuesta del backend
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error(`❌ Proxy error for ${req.originalUrl}:`, error.message);
    return res.status(500).json({
      error: true,
      message: 'Error al conectar con el backend',
      details: error.message
    });
  }
};

// Aplicar proxy a todas las rutas de la API
app.use('/api/*', proxyToBackend);

// Ruta adicional para rutas de usuario sin /api
app.use('/user/*', proxyToBackend);

// Ruta de salud del servidor de desarrollo
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor de desarrollo funcionando como proxy',
    backend: BACKEND_URL,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de desarrollo (PROXY) ejecutándose en http://localhost:${PORT}`);
  console.log(`📡 Redirigiendo todas las peticiones a: ${BACKEND_URL}`);
}); 