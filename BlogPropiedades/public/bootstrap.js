/**
 * Bootstrap script para acceso directo a la API
 * Este script deshabilita los proxies CORS y permite acceso directo
 * a la API HTTP incluso desde frontend HTTPS
 */
(function() {
  console.log('🔄 Inicializando bootstrap...');
  
  // Verificar si estamos en HTTPS
  const isHttps = window.location.protocol === 'https:';
  
  // API URL siempre en HTTP
  const API_DOMAIN = 'gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
  const API_URL = `http://${API_DOMAIN}`;
  
  if (isHttps) {
    console.log('🔒 Frontend HTTPS detectado - Configurando para acceso directo a API HTTP');
    
    // Deshabilitar advertencias excesivas en consola
    const originalConsoleWarn = console.warn;
    console.warn = function() {
      // Solo mostrar advertencias no relacionadas con contenido mixto
      if (!arguments[0] || (
          typeof arguments[0] === 'string' && 
          !arguments[0].includes('Mixed Content') && 
          !arguments[0].includes('CORS')
        )) {
        originalConsoleWarn.apply(console, arguments);
      }
    };
  }
  
  // Configurar variables de entorno
  window.API_FALLBACKS = {
    HTTP_URL: API_URL,
    HTTPS_URL: null, // No intentar usar HTTPS
    LOGIN_URL: `${API_URL}/user/login`,
    REGISTER_URL: `${API_URL}/user/register`,
    PROFILE_URL: `${API_URL}/user/me`,
    SIMULATION_ACTIVE: false,
    DIRECT_ACCESS: true,
    DISABLE_CORS_PROXY: true
  };
  
  // Establecer variables de entorno
  if (window.ENV_VARS) {
    window.ENV_VARS.VITE_BACKEND_URL = API_URL;
    window.ENV_VARS.VITE_API_URL = API_URL;
    window.ENV_VARS.VITE_API_PUBLIC_API_URL = API_URL;
    window.ENV_VARS.VITE_FALLBACK_API = API_URL;
    window.ENV_VARS.VITE_DISABLE_CORS_PROXY = true;
    window.ENV_VARS.VITE_DIRECT_API_ACCESS = true;
    window.ENV_VARS.VITE_FORCE_HTTP = true;
    window.ENV_VARS.VITE_IGNORE_PROTOCOL_MISMATCH = true;
  }
  
  // Limpiar localStorage para evitar problemas persistentes
  try {
    localStorage.removeItem('mixedContentWarning');
    localStorage.removeItem('apiRequestLoop');
    localStorage.removeItem('api_errors');
    localStorage.removeItem('app_errors');
    localStorage.removeItem('loginApiAttempts');
    localStorage.removeItem('profileApiAttempts');
    localStorage.removeItem('forceSimulation');
    localStorage.removeItem('useCorsProxy');
  } catch (e) {
    console.error('Error al limpiar localStorage:', e);
  }
  
  console.log('✅ Bootstrap completado - Modo de acceso directo activado');
})(); 