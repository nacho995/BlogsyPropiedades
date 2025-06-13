// Script para corregir los errores de parseo JSON en respuestas HTML
(function() {
  console.log('🔧 [FIX-API-ROUTES] Inicializado corrector de rutas API');

  // Mapeo de rutas con problemas a sus versiones correctas
  const API_ROUTE_MAPPING = {
    '/api/properties': '/api/properties', // Ya tiene /api, no duplicar
    '/api/blogs': '/api/blogs',           // Ya tiene /api, no duplicar
    '/properties': '/api/properties',     // Añadir /api
    '/blogs': '/api/blogs',               // Añadir /api
    '/auth/me': '/api/user/me',           // Ruta especial para auth
    '/user/profile-image': '/api/user/profile-image' // Ruta de perfil
  };

  // Función para determinar si una URL es de la API
  function isApiUrl(url) {
    return url.includes('/api/') ||
           url.includes('/properties') ||
           url.includes('/blogs') ||
           url.includes('/auth/') ||
           url.includes('/user/');
  }

  // Función para corregir la URL si es necesario
  function fixApiUrl(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      const pathname = urlObj.pathname;

      // Verificar si es una URL que necesita corrección
      if (API_ROUTE_MAPPING[pathname]) {
        urlObj.pathname = API_ROUTE_MAPPING[pathname];
        console.log(`🔄 [FIX-API-ROUTES] Corrigiendo ruta: ${pathname} → ${urlObj.pathname}`);
        return urlObj.toString();
      }

      // Si la URL parece de API pero no está en nuestro mapeo
      if (isApiUrl(pathname) && !pathname.startsWith('/api/')) {
        urlObj.pathname = '/api' + pathname;
        console.log(`🔄 [FIX-API-ROUTES] Añadiendo prefijo /api: ${pathname} → ${urlObj.pathname}`);
        return urlObj.toString();
      }
    } catch (error) {
      console.error('❌ [FIX-API-ROUTES] Error al procesar URL:', error);
    }

    return url;
  }

  // Captura de errores para identificar problemas
  window.addEventListener('error', function(event) {
    if (event.error && event.error.toString().includes('not valid JSON')) {
      console.error('⚠️ [FIX-API-ROUTES] Error JSON detectado:', event.error);
      
      // Intentar encontrar la URL problemática en la pila de llamadas
      const stack = event.error.stack || '';
      const urlMatch = stack.match(/(\/api\/[^\s'"]+)/);
      
      if (urlMatch) {
        console.warn(`🔍 [FIX-API-ROUTES] URL problemática detectada: ${urlMatch[1]}`);
      }
    }
  });

  // Interceptar fetch para corregir URLs y manejar errores HTML en respuestas JSON
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    try {
      // Corregir URL si es necesario
      if (typeof input === 'string') {
        input = fixApiUrl(input);
      } else if (input instanceof Request) {
        input = new Request(fixApiUrl(input.url), input);
      }

      // Llamada original a fetch
      const response = await originalFetch.apply(this, [input, init]);
      
      // Clonar la respuesta para no consumirla
      const clonedResponse = response.clone();
      
      // Si esperamos JSON pero recibimos HTML (error común)
      if (isApiUrl(input.toString()) && response.headers.get('content-type')?.includes('text/html')) {
        console.warn(`⚠️ [FIX-API-ROUTES] Detectada respuesta HTML en lugar de JSON para ${input}`);
        
        // Leer el contenido HTML para debugging
        clonedResponse.text().then(html => {
          console.error('❌ [FIX-API-ROUTES] Contenido HTML recibido:', html.substring(0, 150) + '...');
          
          // Intentar otra variante de la URL si es un error
          if (response.status === 404 || response.status === 500) {
            const urlObj = new URL(input.toString());
            console.log(`🔄 [FIX-API-ROUTES] Reintentando con URL alternativa para: ${urlObj.pathname}`);
            
            // Códigos para futuros reintentos si es necesario
          }
        });
      }
      
      return response;
    } catch (error) {
      console.error('❌ [FIX-API-ROUTES] Error en fetch interceptado:', error);
      throw error;
    }
  };

  // Interceptar XMLHttpRequest para corregir URLs
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    if (typeof url === 'string') {
      url = fixApiUrl(url);
    }
    return originalXhrOpen.apply(this, [method, url, ...rest]);
  };

  console.log('✅ [FIX-API-ROUTES] Interceptores instalados correctamente');
})();
