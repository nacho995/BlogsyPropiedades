// DIRECT-BACKEND-FORCE.js - Conecta directamente al servidor MongoDB sin proxy Vercel
(function() {
  console.log('⚡ [DIRECT-BACKEND-FORCE] Iniciando conector directo al servidor de MongoDB');
  
  // Servidor backend (actualiza según tu infraestructura)
  // Intenta todos los posibles endpoints del servidor para encontrar el que funciona
  const POSSIBLE_BACKEND_URLS = [
    'https://nextjs-gozamadrid-qrfk.onrender.com',        // URL CORRECTA (Render)
    'https://blogs.realestategozamadrid.com',             // Dominio principal 
    'https://api.realestategozamadrid.com',               // Subdominio API
    'https://backend.realestategozamadrid.com',           // Subdominio Backend
    'https://realestategozamadrid.com',                   // Dominio raíz
    'https://gozamadrid-backend-778f.onrender.com'        // URL antigua (Render)
  ];
  
  // Rutas API para verificar cada servidor
  const API_TEST_PATH = '/api/properties';
  
  // Almacenar el servidor que responde correctamente
  let WORKING_BACKEND = null;
  let serverTestInProgress = false;
  
  // Empezar a probar servidores inmediatamente
  findWorkingServer();
  
  // Exponemos la funcionalidad globalmente
  window.DirectBackendForce = {
    // Propiedades
    properties: {
      getAll: async function() {
        await ensureWorkingServer();
        return fetchFromBackend('/api/properties');
      },
      getById: async function(id) {
        await ensureWorkingServer();
        return fetchFromBackend(`/api/properties/${id}`);
      }
    },
    // Blogs
    blogs: {
      getAll: async function() {
        await ensureWorkingServer();
        return fetchFromBackend('/api/blogs');
      },
      getById: async function(id) {
        await ensureWorkingServer();
        return fetchFromBackend(`/api/blogs/${id}`);
      }
    },
    // Usuario
    user: {
      getProfile: async function() {
        await ensureWorkingServer();
        return fetchFromBackend('/api/user/me');
      },
      getProfileImage: async function() {
        await ensureWorkingServer();
        return fetchFromBackend('/api/user/profile-image');
      }
    },
    // Estado del conector
    status: {
      isConnected: false,
      serverUrl: null,
      lastResponse: null,
      responseTime: 0
    },
    // Forzar reconexión
    reconnect: async function() {
      WORKING_BACKEND = null;
      await findWorkingServer();
      return {
        success: WORKING_BACKEND !== null,
        server: WORKING_BACKEND
      };
    }
  };
  
  // Asegurar que tenemos un servidor funcional antes de hacer peticiones
  async function ensureWorkingServer() {
    if (WORKING_BACKEND) {
      return true;
    }
    
    if (!serverTestInProgress) {
      await findWorkingServer();
    }
    
    // Esperar hasta que tengamos un servidor o se complete la prueba
    let attempts = 0;
    while (!WORKING_BACKEND && serverTestInProgress && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      attempts++;
    }
    
    if (!WORKING_BACKEND) {
      throw new Error('No se encontró un servidor backend funcional después de probar todas las opciones');
    }
    
    return true;
  }
  
  // Encontrar un servidor que responda correctamente con JSON
  async function findWorkingServer() {
    if (serverTestInProgress) return;
    
    serverTestInProgress = true;
    console.log('🔍 [DIRECT-BACKEND-FORCE] Probando servidores disponibles...');
    
    // Prueba cada servidor en secuencia
    for (const baseUrl of POSSIBLE_BACKEND_URLS) {
      try {
        const startTime = performance.now();
        console.log(`🔄 [DIRECT-BACKEND-FORCE] Probando servidor: ${baseUrl}`);
        
        const response = await fetch(`${baseUrl}${API_TEST_PATH}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          cache: 'no-store'
        });
        
        const responseTime = performance.now() - startTime;
        
        // Intenta obtener el contenido
        const contentText = await response.text();
        
        // Verificar si es JSON válido
        try {
          const parsed = JSON.parse(contentText);
          
          // Verificar si la respuesta parece ser la esperada (array de propiedades)
          if (Array.isArray(parsed) || 
              (parsed && Array.isArray(parsed.properties)) ||
              (parsed && parsed.data && Array.isArray(parsed.data))) {
            
            console.log(`✅ [DIRECT-BACKEND-FORCE] Servidor encontrado: ${baseUrl} (tiempo: ${responseTime.toFixed(2)}ms)`);
            
            WORKING_BACKEND = baseUrl;
            window.DirectBackendForce.status.isConnected = true;
            window.DirectBackendForce.status.serverUrl = baseUrl;
            window.DirectBackendForce.status.responseTime = responseTime;
            window.DirectBackendForce.status.lastResponse = parsed;
            
            serverTestInProgress = false;
            return baseUrl;
          } else {
            console.log(`⚠️ [DIRECT-BACKEND-FORCE] Servidor ${baseUrl} devolvió JSON pero no el formato esperado`);
          }
        } catch (jsonError) {
          console.log(`⚠️ [DIRECT-BACKEND-FORCE] Servidor ${baseUrl} devolvió contenido no JSON: ${contentText.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`❌ [DIRECT-BACKEND-FORCE] Error al contactar servidor ${baseUrl}: ${error.message}`);
      }
    }
    
    console.error('❌ [DIRECT-BACKEND-FORCE] Ningún servidor respondió correctamente');
    serverTestInProgress = false;
    return null;
  }
  
  // Función para hacer peticiones al backend una vez identificado
  async function fetchFromBackend(path, options = {}) {
    if (!WORKING_BACKEND) {
      await ensureWorkingServer();
    }
    
    // Si aún no tenemos servidor, lanzar error
    if (!WORKING_BACKEND) {
      throw new Error('No hay un servidor backend disponible');
    }
    
    try {
      // Construir URL
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const fullUrl = `${WORKING_BACKEND}${cleanPath}`;
      
      // Preparar headers
      const token = localStorage.getItem('token');
      
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Hacer petición
      console.log(`🔄 [DIRECT-BACKEND-FORCE] Petición a: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: options.method || 'GET',
        headers: { ...headers, ...options.headers },
        body: options.body,
        cache: 'no-store'
      });
      
      // Si la respuesta no es exitosa
      if (!response.ok) {
        console.error(`❌ [DIRECT-BACKEND-FORCE] Error HTTP: ${response.status} - ${response.statusText}`);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Obtener texto para verificar que es JSON válido
      const responseText = await response.text();
      
      try {
        const jsonData = JSON.parse(responseText);
        console.log(`✅ [DIRECT-BACKEND-FORCE] Datos recibidos de ${fullUrl}`);
        return jsonData;
      } catch (parseError) {
        console.error(`❌ [DIRECT-BACKEND-FORCE] Respuesta no es JSON: ${responseText.substring(0, 200)}`);
        throw new Error('La respuesta del servidor no es JSON válido');
      }
    } catch (error) {
      console.error(`❌ [DIRECT-BACKEND-FORCE] Error en fetchFromBackend: ${error.message}`);
      throw error;
    }
  }
  
  // Interceptor de llamadas fetch a la API para redirigirlas a nuestro backend directo
  const originalFetch = window.fetch;
  
  window.fetch = async function(url, options) {
    const urlStr = url.toString();
    
    // Si es una URL de API y tenemos un backend directo, redirigimos
    if (urlStr.includes('/api/') && WORKING_BACKEND) {
      // Rutas específicas que siempre queremos manejar
      const criticalPaths = [
        '/api/properties',
        '/api/blogs',
        '/api/user/me',
        '/api/user/profile'
      ];
      
      // Verificar si la URL contiene alguna ruta crítica
      const isCriticalPath = criticalPaths.some(path => urlStr.includes(path));
      
      if (isCriticalPath) {
        try {
          // Extraer la ruta de la API
          const apiPath = urlStr.substring(urlStr.indexOf('/api/'));
          
          // Redirigir a nuestro backend
          console.log(`🔄 [DIRECT-BACKEND-FORCE] Interceptando petición a ${urlStr}, redirigiendo a backend directo`);
          
          // Realizar la petición directamente
          const result = await fetchFromBackend(apiPath, options);
          
          // Devolver respuesta simulada con los datos reales
          return {
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers({
              'Content-Type': 'application/json'
            }),
            json: () => Promise.resolve(result),
            text: () => Promise.resolve(JSON.stringify(result))
          };
        } catch (error) {
          console.error(`❌ [DIRECT-BACKEND-FORCE] Error al manejar petición interceptada: ${error.message}`);
          // Si falla, continuar con la petición original
        }
      }
    }
    
    // Si no interceptamos, continuar con la implementación original
    return originalFetch(url, options);
  };
  
  // Añadir botón para reconectar y probar servidores
  function addForceModeButton() {
    setTimeout(() => {
      const button = document.createElement('button');
      button.id = 'direct-backend-force-button';
      button.textContent = '⚡ Conectar directo';
      button.style.position = 'fixed';
      button.style.bottom = '60px';  // Por encima de otros botones
      button.style.right = '10px';
      button.style.zIndex = '9999';
      button.style.padding = '8px 16px';
      button.style.backgroundColor = '#4caf50';  // Verde
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      
      button.onclick = async function() {
        button.textContent = '🔄 Conectando...';
        button.disabled = true;
        
        try {
          // Forzar reconexión
          await window.DirectBackendForce.reconnect();
          
          if (window.DirectBackendForce.status.isConnected) {
            button.textContent = `✅ Conectado: ${new URL(window.DirectBackendForce.status.serverUrl).hostname}`;
            
            // Probar carga de propiedades
            try {
              const properties = await window.DirectBackendForce.properties.getAll();
              const count = Array.isArray(properties) ? properties.length : 
                        (properties?.data?.length || '?');
              
              alert(`✅ Conexión exitosa con el backend!\n\nServidor: ${window.DirectBackendForce.status.serverUrl}\nPropiedades: ${count}\nTiempo de respuesta: ${window.DirectBackendForce.status.responseTime.toFixed(0)}ms`);
              
              // Si estamos en la página de propiedades, recargar
              if (window.location.pathname === '/' || 
                  window.location.pathname.includes('/properties')) {
                if (confirm('¿Deseas recargar la página para ver los datos reales?')) {
                  window.location.reload();
                }
              }
            } catch (e) {
              console.error(e);
              alert(`⚠️ Conectado al servidor pero error al cargar propiedades: ${e.message}`);
            }
          } else {
            button.textContent = '❌ Falló conexión';
            setTimeout(() => {
              button.textContent = '⚡ Conectar directo';
              button.disabled = false;
            }, 3000);
            alert('⚠️ No se encontró ningún servidor backend que responda correctamente.');
          }
        } catch (error) {
          console.error(error);
          button.textContent = '❌ Error';
          setTimeout(() => {
            button.textContent = '⚡ Conectar directo';
            button.disabled = false;
          }, 3000);
          alert(`Error: ${error.message}`);
        }
      };
      
      document.body.appendChild(button);
    }, 2000);
  }
  
  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      addForceModeButton();
    });
  } else {
    addForceModeButton();
  }
  
  console.log('✅ [DIRECT-BACKEND-FORCE] Conector directo forzado instalado y listo');
})();
