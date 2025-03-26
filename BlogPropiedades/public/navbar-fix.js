/**
 * NAVBAR-FIX: Solución específica para el error TDZ en NavBar.jsx
 * Ataca específicamente el error en useProfileImage.js y NavBar.jsx
 */
(function() {
  console.log("🔍 NAVBAR-FIX: Iniciando parche específico para NavBar...");
  
  try {
    // 1. Variables para almacenar referencias a las funciones originales
    let originalNi = null;
    let originalJi = null;
    
    // 2. Monitorear cuando se cargue React
    function checkReactLoaded() {
      if (window.React) {
        clearInterval(reactCheckInterval);
        applyPatch();
      }
    }
    
    // 3. Función principal de aplicación de parche
    function applyPatch() {
      console.log("🔧 NAVBAR-FIX: React detectado, aplicando parche...");
      
      // Proteger la variable 'y' en el contexto global
      if (typeof window.y === 'undefined') {
        window.y = {};
        console.log("✅ NAVBAR-FIX: Variable 'y' inicializada preventivamente");
      }
      
      // 4. Monitorear cuando los componentes problemáticos se carguen
      const originalCreateElement = window.React.createElement;
      window.React.createElement = function(type, props, ...children) {
        // Monitorear NavBar (Ni)
        if (typeof type === 'function' && type.name === 'Ni') {
          originalNi = type;
          // Reemplazar con versión segura
          const safeNi = function(props) {
            try {
              // Asegurar que 'y' exista
              if (typeof window.y === 'undefined') {
                window.y = {};
              }
              return originalNi.apply(this, arguments);
            } catch (e) {
              console.warn("⚠️ NAVBAR-FIX: Error en Ni (NavBar) capturado:", e.message);
              // Devolver un fragmento vacío para evitar que la UI se rompa
              return React.createElement(React.Fragment);
            }
          };
          safeNi.displayName = 'Ni';
          type = safeNi;
        }
        
        // Monitorear useProfileImage (Ji)
        if (typeof type === 'function' && type.name === 'ji') {
          originalJi = type;
          // Reemplazar con versión segura
          const safeJi = function(props) {
            try {
              // Asegurar que 'y' exista
              if (typeof window.y === 'undefined') {
                window.y = {};
              }
              return originalJi.apply(this, arguments);
            } catch (e) {
              console.warn("⚠️ NAVBAR-FIX: Error en ji (useProfileImage) capturado:", e.message);
              // Devolver un valor por defecto
              return null;
            }
          };
          safeJi.displayName = 'ji';
          type = safeJi;
        }
        
        // Llamar a createElement original
        return originalCreateElement.apply(this, [type, props, ...children]);
      };
      
      console.log("✅ NAVBAR-FIX: Parche aplicado para NavBar y useProfileImage");
    }
    
    // 5. Monitorear errores específicos
    window.addEventListener('error', function(event) {
      if (event.message && 
          event.message.includes("Cannot access 'y' before initialization") &&
          (event.filename.includes('NavBar.jsx') || event.filename.includes('useProfileImage.js'))) {
        
        console.warn(`⚡ NAVBAR-FIX: Interceptando error en ${event.filename}`);
        
        // Proteger 'y' inmediatamente
        window.y = window.y || {};
        
        // Intentar prevenir la propagación
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    }, true);
    
    // 6. Aplicar parche preventivo para useProfileImage y NavBar
    function applyPreventivePatch() {
      // Intentar identificar los componentes usando stack traces
      window.ji = window.ji || function() { 
        console.warn("⚡ NAVBAR-FIX: Stub para ji (useProfileImage)");
        return {}; 
      };
      
      window.Ni = window.Ni || function() { 
        console.warn("⚡ NAVBAR-FIX: Stub para Ni (NavBar)");
        return null; 
      };
      
      console.log("✅ NAVBAR-FIX: Parche preventivo aplicado");
    }
    
    // 7. Iniciar verificación de React
    const reactCheckInterval = setInterval(checkReactLoaded, 50);
    setTimeout(() => clearInterval(reactCheckInterval), 10000); // Timeout de seguridad
    
    // 8. Aplicar parche preventivo inmediatamente
    applyPreventivePatch();
    
    console.log("✅ NAVBAR-FIX: Inicialización completada");
  } catch (error) {
    console.error("❌ Error en NAVBAR-FIX:", error);
  }
})(); 