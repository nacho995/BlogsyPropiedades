/**
 * Bootstrap script para acceso directo a la API
 */
(function() {
  console.log('🔄 Inicializando bootstrap...');
  
  // Verificar si estamos en HTTPS
  const isHttps = window.location.protocol === 'https:';
  
  // API URL siempre en HTTPS
  const API_DOMAIN = 'api.realestategozamadrid.com';
  const API_URL = `https://${API_DOMAIN}`;
  
  console.log('🔧 Configurando sistema de acceso a API');
  
  // IMPORTANTE: Reemplazar fetch para asegurar HTTPS
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    // Si es una URL de la API, asegurar HTTPS
    if (typeof url === 'string' && url.includes(API_DOMAIN)) {
      console.log('🔄 Convirtiendo URL API a HTTPS:', url);
      url = url.replace('http://', 'https://');
      console.log('🔄 Intentando acceso a API HTTPS:', url);
    }
    
    // Usar el fetch original con la URL modificada
    return originalFetch(url, {
      ...options,
      mode: 'cors',
      credentials: 'include'
    });
  };
  
  console.log('✅ Bootstrap completado - Acceso directo a API configurado');
})(); 