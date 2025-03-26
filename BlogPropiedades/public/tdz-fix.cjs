/**
 * Script TDZ-FIX en formato CommonJS para mayor compatibilidad
 * Versión CommonJS para servir en navegadores directamente
 */

// Usar IIFE para encapsular el código
(function() {
  console.log("🛡️ TDZ-FIX.CJS: Iniciando protección CommonJS...");

  try {
    // Definir todas las variables que podrían causar errores TDZ en código minificado
    var varNames = 'abcdefghijklmnopqrstuvwxyz'.split('');
    var problemVars = [
      'Nc', 'qe', 'Qe', 'ec', 'En', 'In', 'Ht', 'Gt', 'wa', 'qa', 'Na', 'Ma', 'Sa', 'Se',
      'Bc', 'Mc', 'Dc', 'Jc', 'Kc', 'Lc', 'Rc', 'Sc', 'Tc', 'Uc', 'Vc', 'Wc', 'Xc', 'Yc', 'Zc',
      'Ka', 'La', 'Oa', 'Pa', 'Aa', 'Ba', 'Ca', 'Da', 'Ea', 'Fa', 'wi', 'Fp', 'Za', 'Ya', 'kd',
      'qr', 'Io', 'Wa', 'La', 'Ha', 'gd', '_d', 'wn', 'st', 'Wu', 'rn', 'sn', 'tn', 'si', 'ti', 'ri'
    ];
    
    // Combinar todas las variables
    var allVars = varNames.concat(problemVars);
    
    // Definir todas las variables en window
    allVars.forEach(function(varName) {
      if (typeof window[varName] === 'undefined') {
        window[varName] = {};
      }
    });
    
    // Protección especial para 'y' que es la que causa más problemas
    // Usando Object.defineProperty
    if (!window.__yAlreadyProtected) {
      var origY = window.y;
      Object.defineProperty(window, 'y', {
        get: function() {
          return origY || {};
        },
        set: function(val) {
          origY = val;
          return true;
        },
        configurable: false, // No permitir redefinición
        enumerable: true
      });
      window.__yAlreadyProtected = true;
    }
    
    // Interceptar errores de TDZ
    window.addEventListener('error', function(event) {
      if (event.message && event.message.includes('Cannot access') && 
          event.message.includes('before initialization')) {
        
        // Extraer nombre de variable del mensaje de error
        var matches = event.message.match(/'([^']+)'/);
        if (matches && matches[1]) {
          var varName = matches[1];
          console.warn("⚠️ TDZ-FIX.CJS: Interceptando error para: " + varName);
          
          // Definir variable inmediatamente
          window[varName] = {};
          
          // Intentar detener propagación
          if (event.preventDefault) event.preventDefault();
          if (event.stopPropagation) event.stopPropagation();
          
          // Log para diagnóstico
          try {
            var tdzLog = JSON.parse(localStorage.getItem('tdzProblemLog') || '[]');
            tdzLog.push({
              variable: varName,
              timestamp: new Date().toISOString(),
              url: window.location.href,
              source: 'tdz-fix.cjs'
            });
            
            if (tdzLog.length > 20) tdzLog.length = 20;
            localStorage.setItem('tdzProblemLog', JSON.stringify(tdzLog));
          } catch (e) {}
          
          return false;
        }
      }
    }, true);
    
    console.log("✅ TDZ-FIX.CJS: Protección CommonJS aplicada");
  } catch (error) {
    console.error("❌ Error en TDZ-FIX.CJS:", error);
  }
})(); 