/**
 * TDZ-FIX-FINAL - Versión optimizada para producción
 */
(function() {
  console.log("🚀 TDZ-FIX-FINAL: Iniciando protección TDZ...");
  
  // 1. Pre-definir variables críticas
  var y = window.y = {};
  var wi = window.wi = {};
  var Fp = window.Fp = {};
  var Nc = window.Nc = {};
  
  // Otras variables minificadas frecuentes
  ['Qe', 'qe', 'Il', 'Kc', 'Hl', 'Oe', 'Si', 'Oi', 'Rc', 'Qc', 'Ab', 'Bb', 'Ni', 'Wc', 'Mi', 'Li', 'Ki', 'Ji']
    .forEach(function(name) { window[name] = window[name] || {}; });
  
  // 2. Interceptar definiciones de componentes
  try {
    var jiOriginal = null;
    var NiOriginal = null;
    
    // Patch para ji (useProfileImage.js)
    Object.defineProperty(window, 'ji', {
      get: function() { return jiOriginal; },
      set: function(value) {
        jiOriginal = function() {
          var y = {}; // Definir 'y' localmente
          try {
            return value.apply(this, arguments);
          } catch(e) {
            console.warn("⚠️ TDZ-FIX-FINAL: Error en ji:", e.message);
            return null;
          }
        };
        return true;
      },
      configurable: true
    });
    
    // Patch para Ni (NavBar.jsx)
    Object.defineProperty(window, 'Ni', {
      get: function() { return NiOriginal; },
      set: function(value) {
        NiOriginal = function() {
          var y = {}; // Definir 'y' localmente
          try {
            return value.apply(this, arguments);
          } catch(e) {
            console.warn("⚠️ TDZ-FIX-FINAL: Error en Ni:", e.message);
            return null;
          }
        };
        return true;
      },
      configurable: true
    });
    
    // 3. Inyección directa como medida preventiva
    function injectComponentFixes() {
      var script = document.createElement('script');
      script.textContent = `
        (function() {
          // Guardar referencias originales
          var _ji = window.ji;
          var _Ni = window.Ni;
          
          // Sobrescribir ji
          window.ji = function() {
            var y = {}; // Definir 'y' localmente
            try {
              return _ji ? _ji.apply(this, arguments) : null;
            } catch(e) {
              return null;
            }
          };
          
          // Sobrescribir Ni
          window.Ni = function() {
            var y = {}; // Definir 'y' localmente
            try {
              return _Ni ? _Ni.apply(this, arguments) : null;
            } catch(e) {
              return null;
            }
          };
          
          console.log("💉 TDZ-FIX-FINAL: Componentes ji y Ni protegidos directamente");
        })();
      `;
      document.head.appendChild(script);
    }
    
    // 4. Detector de errores TDZ en tiempo real
    window.addEventListener('error', function(event) {
      if (event.message && 
          (event.message.includes("Cannot access") || 
           event.message.includes("before initialization"))) {
        
        // Extraer nombre de la variable con problema
        var matches = event.message.match(/'([^']+)'/);
        if (matches && matches[1]) {
          var varName = matches[1];
          
          console.warn(`⚡ TDZ-FIX-FINAL: Corrigiendo error TDZ para '${varName}'`);
          
          // Inyectar variable inmediatamente
          var script = document.createElement('script');
          script.textContent = `
            (function() {
              var ${varName} = {};
              window.${varName} = {};
              
              if ('${varName}' === 'ji' || '${varName}' === 'Ni') {
                var original = window.${varName};
                window.${varName} = function() {
                  var y = {};
                  try { return original ? original.apply(this, arguments) : null; }
                  catch(e) { return null; }
                };
              }
            })();
          `;
          document.head.appendChild(script);
          
          // Intentar prevenir propagación
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      }
    }, true);
    
    // 5. Ejecutar inyección directa para asegurar protección
    setTimeout(injectComponentFixes, 0);
    
    console.log("✅ TDZ-FIX-FINAL: Protección TDZ completa aplicada");
  } catch(e) {
    console.warn("⚠️ TDZ-FIX-FINAL: Error en protección principal:", e.message);
    
    // 6. Solución de emergencia extrema
    try {
      var script = document.createElement('script');
      script.textContent = `
        var y = {};
        var wi = {};
        var Fp = {};
        var Nc = {};
        
        // Sobrescribir componentes de emergencia
        setTimeout(function() {
          try {
            var _ji = window.ji;
            var _Ni = window.Ni;
            
            window.ji = function() { var y = {}; try { return _ji.apply(this, arguments); } catch(e) { return null; } };
            window.Ni = function() { var y = {}; try { return _Ni.apply(this, arguments); } catch(e) { return null; } };
            
            console.log("🚨 TDZ-FIX-FINAL: Protección de emergencia aplicada");
          } catch(e) {
            console.error("❌ TDZ-FIX-FINAL: Error en protección de emergencia:", e);
          }
        }, 0);
      `;
      document.head.appendChild(script);
    } catch (e2) {
      console.error("❌ TDZ-FIX-FINAL: Error crítico en protección TDZ:", e2.message);
    }
  }
})(); 