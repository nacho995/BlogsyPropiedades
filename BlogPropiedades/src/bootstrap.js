/**
 * Script de bootstrap para inicializar variables y prevenir errores de TDZ
 * "Cannot access variable before initialization" en código minificado
 */

console.log("🔄 Inicializando bootstrap...");

// Prevenir el error de "Cannot access 'b'/'y' before initialization"
try {
  console.log("🔧 Aplicando parche para evitar error de variables no inicializadas");
  
  // Crear objetos y variables globales que podrían causar problemas de TDZ
  window.Nc = window.Nc || {};
  window.b = window.b || {};
  window.y = window.y || {};
  
  // Variables comunes que podrían causar TDZ
  const commonVariableNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 
                              'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  
  // Inicializar todas las variables comunes
  commonVariableNames.forEach(name => {
    window[name] = window[name] || {};
  });
  
  console.log("✅ Parche de variables aplicado");
} catch (e) {
  console.error("❌ Error al aplicar parche de variables:", e);
}

// Configurar acceso a API
try {
  console.log("🔧 Configurando sistema de acceso a API");
  
  // Establecer las bases para acceder a la API
  const currentProtocol = window.location.protocol;
  const API_DOMAIN = 'api.realestategozamadrid.com';
  const API_URL = `${currentProtocol}//${API_DOMAIN}`;
  
  // Guardar URL en localStorage para acceso desde otros componentes
  localStorage.setItem('definitive_api_url', API_URL);
  localStorage.setItem('api_protocol', currentProtocol);
  
  // Prefetch DNS para la API para mejorar rendimiento
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = API_URL;
  document.head.appendChild(link);
  
  console.log("✅ Sistema de acceso a API configurado");
} catch (e) {
  console.error("❌ Error al configurar acceso a API:", e);
}

console.log("✅ Bootstrap completado - Acceso directo a API configurado"); 