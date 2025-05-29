// Manejador de solicitudes OPTIONS para preflight CORS
export default function handler(req, res) {
  // Configurar los encabezados CORS para las solicitudes preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Responder con éxito para las solicitudes preflight
  res.status(200).end();
}
