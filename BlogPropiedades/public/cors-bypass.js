// CORS-BYPASS.js - Solución agresiva para saltarnos problemas de Vercel usando CORS
(function() {
  console.log('⚡ [CORS-BYPASS] Iniciando bypass CORS para acceder directamente al backend');
  
  // Configuración - URL DEL BACKEND REAL (sin /api)
  const DIRECT_BACKEND = 'https://gozamadrid-backend-778f.onrender.com';
  
  // Almacenar la URL del backend para uso futuro
  window.DIRECT_BACKEND_URL = DIRECT_BACKEND;
  
  // Objeto global para conexión directa al backend
  window.CorsBackend = {
    properties: {
      getAll: async function() {
        return fetchWithCORS('/api/properties');
      },
      getById: async function(id) {
        return fetchWithCORS(`/api/properties/${id}`);
      }
    },
    blogs: {
      getAll: async function() {
        return fetchWithCORS('/api/blogs');
      },
      getById: async function(id) {
        return fetchWithCORS(`/api/blogs/${id}`);
      }
    },
    user: {
      getProfile: async function() {
        return fetchWithCORS('/api/user/me');
      }
    }
  };
  
  // Función de fetch con CORS
  async function fetchWithCORS(path) {
    try {
      // Eliminar barra inicial si existe
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      
      // URL completa al backend real
      const fullUrl = `${DIRECT_BACKEND}/${cleanPath}`;
      console.log(`🔄 [CORS-BYPASS] Conectando a: ${fullUrl}`);
      
      // Obtener token de autenticación
      const token = localStorage.getItem('token');
      
      // Preparar headers
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CORS-Bypass': 'true',
        'Cache-Control': 'no-cache'
      };
      
      // Añadir token si existe
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Realizar petición con parámetros CORS
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: headers,
        mode: 'cors', // Forzar CORS
        credentials: 'include', // Incluir cookies si es necesario
        cache: 'no-store'
      });
      
      // Verificar si la respuesta es correcta
      if (!response.ok) {
        console.error(`❌ [CORS-BYPASS] Error HTTP ${response.status} desde ${fullUrl}`);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Intentar parsear como JSON
      const responseText = await response.text();
      
      try {
        const jsonData = JSON.parse(responseText);
        console.log(`✅ [CORS-BYPASS] Datos recibidos correctamente de ${fullUrl}:`, jsonData);
        return jsonData;
      } catch (e) {
        console.error(`❌ [CORS-BYPASS] La respuesta no es JSON:`, responseText.substring(0, 200));
        throw new Error('La respuesta del servidor no es JSON válido');
      }
    } catch (error) {
      console.error(`❌ [CORS-BYPASS] Error:`, error);
      return { 
        error: true,
        message: error.message,
        isCorsError: true
      };
    }
  }
  
  // Añadir botón para cargar propiedades con CORS bypass
  function addCorsButton() {
    // No añadir el botón si ya existe
    if (document.getElementById('cors-bypass-button')) return;
    
    setTimeout(() => {
      const button = document.createElement('button');
      button.id = 'cors-bypass-button';
      button.textContent = '🌐 Cargar con CORS';
      button.style.position = 'fixed';
      button.style.bottom = '110px'; // Por encima del otro botón
      button.style.right = '10px';
      button.style.zIndex = '9999';
      button.style.padding = '8px 16px';
      button.style.backgroundColor = '#e91e63'; // Rosa
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      
      button.onclick = async function() {
        try {
          button.textContent = '⏳ Cargando...';
          button.disabled = true;
          
          console.log('🔄 [CORS-BYPASS] Cargando propiedades...');
          const properties = await window.CorsBackend.properties.getAll();
          
          if (properties && !properties.error) {
            console.log('✅ [CORS-BYPASS] Propiedades cargadas:', properties.length);
            alert(`Éxito! ${properties.length} propiedades cargadas correctamente`);
            
            // Guardar en localStorage para acceso futuro
            try {
              localStorage.setItem('cached_properties', JSON.stringify(properties));
              localStorage.setItem('cached_properties_timestamp', new Date().toISOString());
            } catch (e) {
              console.warn('No se pudieron cachear las propiedades:', e);
            }
            
            // Intentar actualizar el estado de React si hay una función disponible
            if (window.__updatePropertiesState && typeof window.__updatePropertiesState === 'function') {
              window.__updatePropertiesState(properties);
              console.log('✅ [CORS-BYPASS] Estado de propiedades actualizado');
            } else {
              // Recargar la página como último recurso
              if (confirm('¿Deseas recargar la página con los datos cargados?')) {
                localStorage.setItem('force_use_cached_properties', 'true');
                window.location.reload();
              }
            }
          } else {
            console.error('❌ [CORS-BYPASS] Error:', properties);
            alert(`Error: ${properties.message || 'Error al cargar propiedades'}`);
          }
        } catch (e) {
          console.error('❌ [CORS-BYPASS] Error:', e);
          alert(`Error: ${e.message}`);
        } finally {
          button.textContent = '🌐 Cargar con CORS';
          button.disabled = false;
        }
      };
      
      document.body.appendChild(button);
    }, 1500);
  }
  
  // Función para usar propiedades cacheadas
  function setupCachedPropertiesHook() {
    // Verificar si hay propiedades cacheadas
    const cachedProperties = localStorage.getItem('cached_properties');
    const timestamp = localStorage.getItem('cached_properties_timestamp');
    const forceUse = localStorage.getItem('force_use_cached_properties');
    
    if (cachedProperties && timestamp) {
      const cachedTime = new Date(timestamp);
      const now = new Date();
      const diffMinutes = (now - cachedTime) / (1000 * 60);
      
      // Si las propiedades son recientes (menos de 30 minutos) o se forzó su uso
      if (diffMinutes < 30 || forceUse === 'true') {
        try {
          console.log(`🔄 [CORS-BYPASS] Usando propiedades cacheadas de hace ${Math.round(diffMinutes)} minutos`);
          
          // Exponer las propiedades cacheadas
          window.__cachedProperties = JSON.parse(cachedProperties);
          
          // Resetear flag de forzado
          if (forceUse === 'true') {
            localStorage.removeItem('force_use_cached_properties');
          }
          
          // Función global para acceder a las propiedades cacheadas
          window.getCachedProperties = function() {
            return window.__cachedProperties;
          };
        } catch (e) {
          console.error('Error al parsear propiedades cacheadas:', e);
        }
      }
    }
  }
  
  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      addCorsButton();
      setupCachedPropertiesHook();
    });
  } else {
    addCorsButton();
    setupCachedPropertiesHook();
  }
  
  console.log('✅ [CORS-BYPASS] Bypass CORS instalado y listo');
})();
