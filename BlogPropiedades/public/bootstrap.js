/**
 * Bootstrap script para la inicialización básica de la aplicación
 * Este script se ejecuta antes del bundle principal y establece
 * valores por defecto para las variables de entorno críticas
 */
(function() {
  console.log('🔄 Inicializando bootstrap...');
  
  // Verificar si estamos en HTTPS
  const isHttps = window.location.protocol === 'https:';
  
  // API URL correcta - Usando HTTP ya que HTTPS no está disponible
  const API_DOMAIN = 'gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
  const API_URL = `http://${API_DOMAIN}`;
  
  // Si estamos en HTTPS y la API es HTTP, mostrar advertencia de contenido mixto
  if (isHttps) {
    console.warn('⚠️ ADVERTENCIA: Frontend en HTTPS intentando conectar con API en HTTP');
    console.warn('⚠️ Posibles problemas de contenido mixto. Considera usar CloudFlare o configurar HTTPS en el backend.');
  }
  
  // Configurar variables de entorno
  window.API_FALLBACKS = {
    HTTP_URL: API_URL,
    HTTPS_URL: API_URL.replace('http:', 'https:'), // Esta URL no funcionará
    LOGIN_URL: `${API_URL}/user/login`,
    REGISTER_URL: `${API_URL}/user/register`,
    PROFILE_URL: `${API_URL}/user/me`,
    SIMULATION_ACTIVE: false
  };
  
  // Establecer variables de entorno
  if (window.ENV_VARS) {
    window.ENV_VARS.VITE_BACKEND_URL = API_URL;
    window.ENV_VARS.VITE_API_URL = API_URL;
    window.ENV_VARS.VITE_API_PUBLIC_API_URL = API_URL;
    window.ENV_VARS.VITE_FALLBACK_API = API_URL;
  }
  
  // Limpiar localStorage para evitar problemas persistentes
  try {
    // Eliminar solo datos relacionados con errores para no afectar sesión
    localStorage.removeItem('mixedContentWarning');
    localStorage.removeItem('apiRequestLoop');
    localStorage.removeItem('api_errors');
    localStorage.removeItem('app_errors');
    localStorage.removeItem('loginApiAttempts');
    localStorage.removeItem('profileApiAttempts');
    localStorage.removeItem('forceSimulation');
  } catch (e) {
    console.error('Error al limpiar localStorage:', e);
  }
  
  console.log('✅ Bootstrap completado - Modo HTTP activado');
})(); 