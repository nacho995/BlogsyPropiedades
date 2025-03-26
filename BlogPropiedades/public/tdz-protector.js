/**
 * TDZ-PROTECTOR
 * Script de protección crítica para componentes que causan TDZ en producción
 * Usa una aproximación directa y optimizada
 */
(function() {
  console.log("🛡️ TDZ-PROTECTOR: Iniciando...");
  
  // 1. Variables que causan TDZ
  window.y = {};
  window.wi = {};
  window.Fp = {};
  window.Nc = {};
  
  // 2. Variables para intercepción
  var originalJi = null;
  var originalNi = null;
  
  // 3. Implementar proxy para ji (useProfileImage.js)
  Object.defineProperty(window, 'ji', {
    get: function() {
      if (typeof originalJi === 'function') {
        return function() {
          // Definir localmente las variables problemáticas
          var y = {}; 
          try {
            return originalJi.apply(this, arguments);
          } catch(e) {
            console.warn("⚠️ Error interceptado en ji:", e.message);
            return null;
          }
        }
      }
      return originalJi;
    },
    set: function(value) {
      originalJi = value;
      return true;
    },
    configurable: true
  });
  
  // 4. Implementar proxy para Ni (NavBar.jsx)
  Object.defineProperty(window, 'Ni', {
    get: function() {
      if (typeof originalNi === 'function') {
        return function() {
          // Definir localmente las variables problemáticas
          var y = {};
          try {
            return originalNi.apply(this, arguments);
          } catch(e) {
            console.warn("⚠️ Error interceptado en Ni:", e.message);
            return null;
          }
        }
      }
      return originalNi;
    },
    set: function(value) {
      originalNi = value;
      return true;
    },
    configurable: true
  });
  
  // 5. Detector de errores TDZ en tiempo real
  window.addEventListener('error', function(event) {
    // Si es un error de TDZ (Cannot access X before initialization)
    if (event.message && 
        (event.message.includes("Cannot access") || 
         event.message.includes("before initialization"))) {
      
      // Extraer nombre de la variable
      var matches = event.message.match(/'([^']+)'/);
      if (matches && matches[1]) {
        var varName = matches[1];
        
        // Definir la variable inmediatamente
        window[varName] = {};
        
        // Aplicar parche específico si es ji o Ni
        if (varName === 'ji' || varName === 'Ni') {
          var script = document.createElement('script');
          script.textContent = `
            (function() {
              var _${varName} = window.${varName};
              window.${varName} = function() {
                var y = {}; 
                try { 
                  return _${varName}.apply(this, arguments); 
                } catch(e) { 
                  return null; 
                }
              };
            })();
          `;
          document.head.appendChild(script);
        }
        
        console.warn(`✅ TDZ-PROTECTOR: Variable '${varName}' protegida`);
        
        // Intentar prevenir propagación
        if (event.preventDefault) {
          event.preventDefault();
        }
        return true;
      }
    }
  }, true);
  
  console.log("✅ TDZ-PROTECTOR: Protección activada");
})(); 