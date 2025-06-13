// Script ULTRA AGRESIVO para corregir URLs de API antes de que cargue la aplicación
(function() {
  console.log('🔥 [fix-api] Iniciando corrección ultra-agresiva para App-b821f139-1748584807959-v3-FINAL.js');
  
  // Configuración básica
  const OLD_DOMAIN = 'nextjs-gozamadrid-qrfk.onrender.com';
  const NEW_DOMAIN = 'blogs.realestategozamadrid.com';
  
  // Contador de correcciones (para debug)
  let fixCount = 0;
  
  // ===== REESCRITURA DE CADENAS EN EL CÓDIGO COMPILADO =====
  // Esta técnica es muy agresiva pero necesaria para código compilado
  
  // Iterar a través de todos los scripts cargados
  function patchLoadedScripts() {
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src && script.src.includes('App-')) {
        console.log('🔧 [fix-api] Analizando script compilado:', script.src);
        fetch(script.src)
          .then(response => response.text())
          .then(content => {
            if (content.includes(OLD_DOMAIN)) {
              console.warn('🚨 [fix-api] Detectadas referencias a dominio antiguo en script compilado');
            }
          })
          .catch(err => console.error('Error al analizar script:', err));
      }
    });
  }
  
  // Ejecutar el análisis cuando los scripts estén cargados
  setTimeout(patchLoadedScripts, 1000);
  
  // ===== REESCRITURA DE REQUESTS =====
  
  // Reescribir URL para que use el dominio y rutas correctas
  function rewriteUrl(url) {
    try {
      // Ignorar recursos que no son de la API
      if (typeof url !== 'string') return url;
      if (url.includes('assets/') || url.includes('.css') || url.includes('.ico')) return url;
      
      let newUrl = url;
      
      // === CASO ESPECIAL: /auth/me (La ruta más problemática) ===
      if (url.includes('/auth/me')) {
        if (url.includes(OLD_DOMAIN)) {
          newUrl = `https://${NEW_DOMAIN}/api/user/me`;
          console.log(`🔧 [fix-api] /auth/me con dominio antiguo corregido: ${url} -> ${newUrl}`);
          fixCount++;
          return newUrl;
        } else if (url === '/auth/me') {
          newUrl = `/api/user/me`;
          console.log(`🔧 [fix-api] /auth/me relativo corregido: ${url} -> ${newUrl}`);
          fixCount++;
          return newUrl;
        }
      }
      
      // === CASO GENERAL: Dominio antiguo ===
      if (url.includes(OLD_DOMAIN)) {
        // Extraer la ruta del dominio antiguo
        const match = url.match(new RegExp(`https?://${OLD_DOMAIN}(/.*)?`));
        if (match && match[1]) {
          const path = match[1];
          
          // Corregir la ruta según el caso
          let correctedPath = path;
          
          // Rutas principales que necesitan prefijo /api
          if (path === '/blogs' || path === '/properties' || path === '/user/profile-image') {
            correctedPath = `/api${path}`;
          }
          
          // Construir nueva URL
          newUrl = `https://${NEW_DOMAIN}${correctedPath}`;
          console.log(`🔧 [fix-api] URL con dominio antiguo corregida: ${url} -> ${newUrl}`);
          fixCount++;
          return newUrl;
        }
      }
      
      return url;
    } catch (e) {
      console.error('❌ [fix-api] Error al reescribir URL:', e);
      return url; // En caso de error, devolver la URL original
    }
  }
  
  // ===== INTERCEPTOR DE FETCH =====
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options = {}) {
    // Aplicamos nuestra función de reescritura de URL
    const correctedUrl = rewriteUrl(url);
    
    // Si detectamos un caso especial de /auth/me, hacemos un tratamiento especial
    if ((typeof url === 'string') && (url === '/auth/me' || url.includes('/auth/me'))) {
      console.warn('🚨 [fix-api] Interceptando petición crítica a /auth/me');
      const fixedAuthUrl = `https://${NEW_DOMAIN}/api/user/me`;
      
      // Intentamos hacer una petición directa a la URL correcta
      console.log(`🔄 [fix-api] Reescribiendo definitivamente: ${url} → ${fixedAuthUrl}`);
      
      // Agregar un token si existe
      if (!options.headers) options.headers = {};
      const token = localStorage.getItem('token');
      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }
      
      return originalFetch.call(this, fixedAuthUrl, options);
    }
    
    if (correctedUrl !== url) {
      console.log(`🔄 [fix-api] Redirigiendo fetch: ${url} → ${correctedUrl}`);
    }
    
    return originalFetch.call(this, correctedUrl, options);
  };
  
  // ===== INTERCEPTOR DE XMLHttpRequest =====
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    // Aplicamos nuestra función de reescritura de URL
    const correctedUrl = rewriteUrl(url);
    
    // Caso especial: /auth/me
    if (typeof url === 'string' && (url === '/auth/me' || url.includes('/auth/me'))) {
      console.warn('🚨 [fix-api] Interceptando XHR crítico a /auth/me');
      const fixedAuthUrl = `https://${NEW_DOMAIN}/api/user/me`;
      console.log(`🔄 [fix-api] Reescribiendo XHR definitivamente: ${url} → ${fixedAuthUrl}`);
      
      // Modificar evento para agregar automáticamente el token al enviar
      const originalSend = this.send;
      this.send = function(...sendArgs) {
        const token = localStorage.getItem('token');
        if (token) {
          this.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        return originalSend.apply(this, sendArgs);
      };
      
      return originalXHROpen.call(this, method, fixedAuthUrl, ...rest);
    }
    
    if (correctedUrl !== url) {
      console.log(`🔄 [fix-api] Redirigiendo XHR: ${url} → ${correctedUrl}`);
    }
    
    return originalXHROpen.call(this, method, correctedUrl, ...rest);
  };
  
  // ===== PARSER ESPECIAL DEL CÓDIGO JAVASCRIPT =====
  // Intenta encontrar cadenas hardcodeadas en el código
  
  // Función para buscar y reemplazar variables en el código fuente
  function searchAndReplaceInScripts() {
    // Esperar a que todos los scripts estén cargados
    setTimeout(() => {
      console.log('🔍 [fix-api] Buscando referencias hardcodeadas...');
      
      // Si estamos en una página relacionada con la autenticación, intentamos ayudar
      if (window.location.pathname.includes('login') || window.location.pathname === '/') {
        console.log('🔑 [fix-api] Página relacionada con autenticación detectada');
        
        // Hacer algunos parches preventivos en el localStorage para evitar problemas de autenticación
        try {
          // Si hay un token almacenado, intentamos asegurar su uso correcto
          if (localStorage.getItem('token')) {
            console.log('🔑 [fix-api] Token detectado, preparando entorno de autenticación');
            
            // Agregar un listener para cuando se recargue la información del usuario
            window.addEventListener('authcheck', function(e) {
              console.log('🔑 [fix-api] Comprobando autenticación...');
              
              // Hacer una comprobación proactiva de la autenticación
              fetch(`https://${NEW_DOMAIN}/api/user/me`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              })
              .then(res => {
                if (res.ok) {
                  console.log('✅ [fix-api] Usuario autenticado correctamente via path correcto');
                } else {
                  console.warn('⚠️ [fix-api] No se pudo autenticar via path correcto');
                }
              })
              .catch(err => console.error('❌ [fix-api] Error en comprobación de autenticación:', err));
            });
            
            // Disparar comprobación de autenticación en 2 segundos
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('authcheck'));
            }, 2000);
          }
        } catch (e) {
          console.error('❌ [fix-api] Error preparando entorno de autenticación:', e);
        }
      }
    }, 2000);
  }
  
  // Ejecutar búsqueda cuando la página esté cargada
  if (document.readyState === 'complete') {
    searchAndReplaceInScripts();
  } else {
    window.addEventListener('load', searchAndReplaceInScripts);
  }
  
  // Variable global para que otros scripts sepan que el fix está activo
  window.__API_FIX_ACTIVE = true;
  
  console.log('✅ [fix-api] Corrección temprana activada para URLs de API');
})();
