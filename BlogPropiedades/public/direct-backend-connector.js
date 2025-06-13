// DIRECT-BACKEND-CONNECTOR.js - Conexión directa al backend sin depender de Vercel
(function() {
  console.log('🔌 [DIRECT-BACKEND] Estableciendo conexión directa con backend');
  
  // Configuración - IMPORTANTE: Estos son los puntos de acceso directos al backend
  const DIRECT_BACKEND_URL = 'https://blogs.realestategozamadrid.com/api';
  
  // Objeto global para exponer la API
  window.DirectBackend = {
    properties: {
      getAll: async function() {
        return fetchDirectFromBackend('/properties');
      },
      getById: async function(id) {
        return fetchDirectFromBackend(`/properties/${id}`);
      }
    },
    blogs: {
      getAll: async function() {
        return fetchDirectFromBackend('/blogs');
      },
      getById: async function(id) {
        return fetchDirectFromBackend(`/blogs/${id}`);
      }
    },
    user: {
      getProfile: async function() {
        return fetchDirectFromBackend('/user/me');
      },
      getProfileImage: async function() {
        return fetchDirectFromBackend('/user/profile-image');
      }
    }
  };
  
  // Función principal para conectar directamente con el backend
  async function fetchDirectFromBackend(path) {
    try {
      // Eliminar / inicial si existe
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      
      // Construir URL completa
      const url = `${DIRECT_BACKEND_URL}/${cleanPath}`;
      console.log(`🔄 [DIRECT-BACKEND] Conectando directamente a: ${url}`);
      
      // Obtener token si existe
      const token = localStorage.getItem('token');
      
      // Preparar headers
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Direct-Backend': 'true',
        'Cache-Control': 'no-cache, no-store'
      };
      
      // Añadir token si existe
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Realizar petición
      const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
        credentials: 'same-origin'
      });
      
      // Verificar si la respuesta es correcta
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      
      // Intentar parsear como JSON
      const responseText = await response.text();
      
      try {
        const jsonData = JSON.parse(responseText);
        console.log(`✅ [DIRECT-BACKEND] Datos recibidos correctamente:`, jsonData);
        return jsonData;
      } catch (e) {
        console.error(`❌ [DIRECT-BACKEND] La respuesta no es JSON válido:`, responseText.substring(0, 200));
        throw new Error('La respuesta del servidor no es JSON válido');
      }
    } catch (error) {
      console.error(`❌ [DIRECT-BACKEND] Error en petición:`, error);
      // Devolver objeto de error para que la aplicación pueda manejarlo
      return { 
        error: true,
        message: error.message,
        isDirectBackendError: true
      };
    }
  }
  
  // Reemplazar las funciones que obtienen propiedades en la aplicación
  function patchPropertiesComponent() {
    setTimeout(() => {
      console.log('🔧 [DIRECT-BACKEND] Intentando corregir componentes de propiedades...');
      
      // Encontrar y parchar el componente de propiedades
      try {
        // Buscar función fetchProperties
        const originalFetchProperties = window.fetchProperties;
        if (typeof originalFetchProperties === 'function') {
          console.log('🔍 [DIRECT-BACKEND] Función fetchProperties encontrada, reemplazando...');
          
          window.fetchProperties = async function() {
            console.log('📞 [DIRECT-BACKEND] fetchProperties interceptado, usando conexión directa');
            return window.DirectBackend.properties.getAll();
          };
        }
        
        // Inyectar la función en el objeto window para que los componentes la usen
        window.__getPropertiesDirectly = async function() {
          return window.DirectBackend.properties.getAll();
        };
        
        console.log('✅ [DIRECT-BACKEND] Componentes de propiedades parcheados');
      } catch (e) {
        console.error('❌ [DIRECT-BACKEND] Error al parchar componentes:', e);
      }
    }, 1000);
  }
  
  // Añadir botón para cargar propiedades directamente
  function addDirectLoadButton() {
    setTimeout(() => {
      const button = document.createElement('button');
      button.textContent = '🔄 Cargar Propiedades';
      button.style.position = 'fixed';
      button.style.bottom = '60px';
      button.style.right = '10px';
      button.style.zIndex = '9999';
      button.style.padding = '8px 16px';
      button.style.backgroundColor = '#28a745';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      
      button.onclick = async function() {
        try {
          console.log('🔄 [DIRECT-BACKEND] Cargando propiedades directamente...');
          const properties = await window.DirectBackend.properties.getAll();
          
          if (properties && !properties.error) {
            console.log('✅ [DIRECT-BACKEND] Propiedades cargadas:', properties);
            alert(`Propiedades cargadas correctamente: ${properties.length} propiedades`);
            
            // Intentar actualizar el estado de React
            if (window.__updatePropertiesState && typeof window.__updatePropertiesState === 'function') {
              window.__updatePropertiesState(properties);
              console.log('✅ [DIRECT-BACKEND] Estado de propiedades actualizado');
            }
          } else {
            console.error('❌ [DIRECT-BACKEND] Error al cargar propiedades:', properties);
            alert(`Error al cargar propiedades: ${properties?.message || 'Error desconocido'}`);
          }
        } catch (e) {
          console.error('❌ [DIRECT-BACKEND] Error:', e);
          alert(`Error: ${e.message}`);
        }
      };
      
      document.body.appendChild(button);
    }, 1500);
  }
  
  // Hoistear window.__getPropertyById para componentes específicos
  window.__getPropertyById = async function(id) {
    return window.DirectBackend.properties.getById(id);
  };
  
  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      patchPropertiesComponent();
      addDirectLoadButton();
    });
  } else {
    patchPropertiesComponent();
    addDirectLoadButton();
  }
  
  console.log('✅ [DIRECT-BACKEND] Conector directo instalado');
})();
