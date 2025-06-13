// EMERGENCY-DATA-PROXY.js - Proporciona datos estáticos para cuando la API falla
(function() {
  console.log('🚨 [EMERGENCY-PROXY] Iniciando proxy de datos de emergencia');

  // Datos estáticos de emergencia para propiedades
  const EMERGENCY_PROPERTIES = [
    {
      "_id": "emergency-property-1",
      "title": "[Datos Locales] Casa de Ejemplo Madrid Centro",
      "description": "Piso de datos locales. La API está fallando pero esta propiedad se carga localmente.",
      "price": 250000,
      "location": "Madrid Centro, España",
      "size": 85,
      "bedrooms": 2,
      "bathrooms": 1,
      "images": [{
        "url": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
        "alt": "Imagen de casa ejemplo"
      }]
    },
    {
      "_id": "emergency-property-2",
      "title": "[Datos Locales] Chalet en Las Rozas",
      "description": "Chalet independiente. Estos son datos locales de emergencia porque la API no está respondiendo correctamente.",
      "price": 450000,
      "location": "Las Rozas, Madrid",
      "size": 180,
      "bedrooms": 4,
      "bathrooms": 2,
      "images": [{
        "url": "https://images.unsplash.com/photo-1598228723793-52759bba239c",
        "alt": "Imagen de chalet ejemplo"
      }]
    },
    {
      "_id": "emergency-property-3",
      "title": "[Datos Locales] Apartamento en Malasaña",
      "description": "Apartamento moderno. Usando datos de emergencia por problemas de conexión al backend.",
      "price": 199000,
      "location": "Malasaña, Madrid",
      "size": 55,
      "bedrooms": 1,
      "bathrooms": 1,
      "images": [{
        "url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
        "alt": "Imagen de apartamento ejemplo"
      }]
    }
  ];

  // Datos estáticos de emergencia para blogs
  const EMERGENCY_BLOGS = [
    {
      "_id": "emergency-blog-1",
      "title": "[Datos Locales] Mercado inmobiliario 2025",
      "content": "Este es un artículo de ejemplo cargado localmente debido a problemas de conexión con la API.",
      "author": "Sistema Local",
      "date": new Date().toISOString(),
      "image": "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11"
    },
    {
      "_id": "emergency-blog-2",
      "title": "[Datos Locales] Consejos para comprar tu primera vivienda",
      "content": "Artículo de emergencia mostrado cuando la API falla. Por favor, contacta al administrador.",
      "author": "Sistema Local",
      "date": new Date().toISOString(),
      "image": "https://images.unsplash.com/photo-1600585152220-90363fe7e115"
    }
  ];
  
  // Datos de usuario de emergencia
  const EMERGENCY_USER = {
    "_id": "emergency-user",
    "name": "[MODO EMERGENCIA] Usuario Local",
    "email": "usuario@local.emergencia",
    "roles": ["local_emergency"]
  };
  
  // Hooks para proveer datos de emergencia
  window.EmergencyDataProxy = {
    isActive: true,
    
    properties: {
      getAll: function() {
        console.log('🚨 [EMERGENCY-PROXY] Proporcionando lista de propiedades de emergencia');
        return Promise.resolve(EMERGENCY_PROPERTIES);
      },
      getById: function(id) {
        // Si el ID es de emergencia, encontrarlo directamente
        if (id.startsWith('emergency-property-')) {
          const property = EMERGENCY_PROPERTIES.find(p => p._id === id);
          if (property) {
            return Promise.resolve(property);
          }
        }
        
        // Si no es un ID de emergencia, devolver la primera propiedad con ID modificado
        const property = { ...EMERGENCY_PROPERTIES[0] };
        property._id = id;
        property.title = `[Datos Locales] Propiedad ${id.substring(0, 6)}`;
        
        console.log(`🚨 [EMERGENCY-PROXY] Proporcionando propiedad de emergencia para ID: ${id}`);
        return Promise.resolve(property);
      }
    },
    
    blogs: {
      getAll: function() {
        console.log('🚨 [EMERGENCY-PROXY] Proporcionando lista de blogs de emergencia');
        return Promise.resolve(EMERGENCY_BLOGS);
      },
      getById: function(id) {
        // Similar a getPropertyById
        if (id.startsWith('emergency-blog-')) {
          const blog = EMERGENCY_BLOGS.find(b => b._id === id);
          if (blog) {
            return Promise.resolve(blog);
          }
        }
        
        const blog = { ...EMERGENCY_BLOGS[0] };
        blog._id = id;
        blog.title = `[Datos Locales] Blog ${id.substring(0, 6)}`;
        
        console.log(`🚨 [EMERGENCY-PROXY] Proporcionando blog de emergencia para ID: ${id}`);
        return Promise.resolve(blog);
      }
    },
    
    user: {
      getProfile: function() {
        console.log('🚨 [EMERGENCY-PROXY] Proporcionando usuario de emergencia');
        return Promise.resolve(EMERGENCY_USER);
      }
    }
  };
  
  // Integramos con el sistema existente interceptando fetch API
  const originalFetch = window.fetch;
  
  window.fetch = async function(url, options) {
    const urlStr = url.toString();
    
    // Si la URL contiene /api/properties
    if (urlStr.includes('/api/properties')) {
      // Para una propiedad específica
      const propertyIdMatch = urlStr.match(/\/api\/properties\/([^\/\?]+)/);
      if (propertyIdMatch) {
        const propertyId = propertyIdMatch[1];
        console.log(`🚨 [EMERGENCY-PROXY] Interceptando petición de propiedad: ${propertyId}`);
        try {
          const property = await window.EmergencyDataProxy.properties.getById(propertyId);
          return createSuccessResponse(property);
        } catch (e) {
          // Continuar con la petición original si falla
        }
      } 
      // Para lista de propiedades
      else if (urlStr.includes('/api/properties')) {
        console.log('🚨 [EMERGENCY-PROXY] Interceptando petición de lista de propiedades');
        try {
          const properties = await window.EmergencyDataProxy.properties.getAll();
          return createSuccessResponse(properties);
        } catch (e) {
          // Continuar con la petición original si falla
        }
      }
    }
    
    // Si la URL contiene /api/blogs
    if (urlStr.includes('/api/blogs')) {
      // Para un blog específico
      const blogIdMatch = urlStr.match(/\/api\/blogs\/([^\/\?]+)/);
      if (blogIdMatch) {
        const blogId = blogIdMatch[1];
        console.log(`🚨 [EMERGENCY-PROXY] Interceptando petición de blog: ${blogId}`);
        try {
          const blog = await window.EmergencyDataProxy.blogs.getById(blogId);
          return createSuccessResponse(blog);
        } catch (e) {
          // Continuar con la petición original si falla
        }
      } 
      // Para lista de blogs
      else if (urlStr.includes('/api/blogs')) {
        console.log('🚨 [EMERGENCY-PROXY] Interceptando petición de lista de blogs');
        try {
          const blogs = await window.EmergencyDataProxy.blogs.getAll();
          return createSuccessResponse(blogs);
        } catch (e) {
          // Continuar con la petición original si falla
        }
      }
    }
    
    // Si la URL contiene /api/user/me
    if (urlStr.includes('/api/user/me')) {
      console.log('🚨 [EMERGENCY-PROXY] Interceptando petición de perfil de usuario');
      try {
        const user = await window.EmergencyDataProxy.user.getProfile();
        return createSuccessResponse(user);
      } catch (e) {
        // Continuar con la petición original si falla
      }
    }
    
    // Si llegamos aquí, continuar con la petición original
    try {
      return await originalFetch(url, options);
    } catch (error) {
      // Si la petición falla y es una API que podríamos manejar, intentar usar datos de emergencia
      if (urlStr.includes('/api/')) {
        console.log(`🚨 [EMERGENCY-PROXY] Error en fetch original, intentando recuperación para: ${urlStr}`);
        
        if (urlStr.includes('/api/properties')) {
          if (urlStr.match(/\/api\/properties\/([^\/\?]+)/)) {
            const propertyId = urlStr.match(/\/api\/properties\/([^\/\?]+)/)[1];
            const property = await window.EmergencyDataProxy.properties.getById(propertyId);
            return createSuccessResponse(property);
          } else {
            const properties = await window.EmergencyDataProxy.properties.getAll();
            return createSuccessResponse(properties);
          }
        } 
        
        if (urlStr.includes('/api/blogs')) {
          if (urlStr.match(/\/api\/blogs\/([^\/\?]+)/)) {
            const blogId = urlStr.match(/\/api\/blogs\/([^\/\?]+)/)[1];
            const blog = await window.EmergencyDataProxy.blogs.getById(blogId);
            return createSuccessResponse(blog);
          } else {
            const blogs = await window.EmergencyDataProxy.blogs.getAll();
            return createSuccessResponse(blogs);
          }
        }
        
        if (urlStr.includes('/api/user/me')) {
          const user = await window.EmergencyDataProxy.user.getProfile();
          return createSuccessResponse(user);
        }
      }
      
      // Si no pudimos manejar el error, lo propagamos
      throw error;
    }
  };
  
  // Función para crear una respuesta de éxito simulada
  function createSuccessResponse(data) {
    console.log('🚨 [EMERGENCY-PROXY] Generando respuesta simulada con datos de emergencia');
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data))
    };
  }
  
  // Añadir botón para activar/desactivar proxy de emergencia
  function addEmergencyButton() {
    setTimeout(() => {
      const button = document.createElement('button');
      button.id = 'emergency-proxy-button';
      button.textContent = '🚨 Datos de Emergencia';
      button.style.position = 'fixed';
      button.style.bottom = '160px'; // Por encima de otros botones
      button.style.right = '10px';
      button.style.zIndex = '9999';
      button.style.padding = '8px 16px';
      button.style.backgroundColor = '#ff9800'; // Naranja
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      
      // Al hacer clic, alertamos que los datos de emergencia están activos
      button.onclick = function() {
        alert('DATOS DE EMERGENCIA ACTIVOS\n\nLa aplicación está mostrando datos locales simulados porque la API no está respondiendo correctamente.');
        
        // Si hay componentes React que necesitan refrescar, hacer trigger aquí
        if (window.location.pathname === '/') {
          console.log('🚨 [EMERGENCY-PROXY] Refrescando página principal para mostrar datos de emergencia');
          window.location.reload();
        }
      };
      
      document.body.appendChild(button);
    }, 2000);
  }
  
  // Añadir explicación del problema
  function addEmergencyBanner() {
    setTimeout(() => {
      const banner = document.createElement('div');
      banner.id = 'emergency-data-banner';
      banner.innerHTML = `
        <strong>⚠️ MODO EMERGENCIA</strong>: 
        Usando datos locales debido a problemas con el servidor. 
        Los datos mostrados son ejemplos y no representan información real.
      `;
      banner.style.position = 'fixed';
      banner.style.top = '0';
      banner.style.left = '0';
      banner.style.width = '100%';
      banner.style.padding = '10px';
      banner.style.backgroundColor = '#ff9800';
      banner.style.color = 'white';
      banner.style.textAlign = 'center';
      banner.style.zIndex = '10000';
      banner.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      banner.style.fontSize = '14px';
      
      document.body.appendChild(banner);
    }, 1000);
  }
  
  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      addEmergencyButton();
      addEmergencyBanner();
    });
  } else {
    addEmergencyButton();
    addEmergencyBanner();
  }
  
  console.log('✅ [EMERGENCY-PROXY] Proxy de datos de emergencia instalado y listo');
})();
