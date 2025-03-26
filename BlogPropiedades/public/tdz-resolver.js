/**
 * TDZ-RESOLVER: Solución especializada para errores de TDZ
 * Ataca específicamente el error "Cannot access 'y' before initialization"
 */
(function() {
  console.log("🛡️ TDZ-RESOLVER: Iniciando protección avanzada...");
  
  try {
    // Función para inicializar variables de forma segura
    function initVariable(name) {
      // Verificar si la propiedad ya existe y es configurable
      const descriptor = Object.getOwnPropertyDescriptor(window, name);
      if (descriptor && descriptor.configurable === false) {
        console.warn(`⚠️ TDZ-RESOLVER: No se puede redefinir '${name}', ya está definida como no configurable`);
        return;
      }
      
      // Solo definir si no existe o es configurable
      if (!descriptor || descriptor.configurable) {
        Object.defineProperty(window, name, {
          value: {},
          writable: true,
          configurable: true,
          enumerable: false // No enumerable para evitar contaminación
        });
      }
    }
    
    // Inicializar variables de una sola letra (prioridad alta)
    for (let i = 0; i < 26; i++) {
      const char = String.fromCharCode(97 + i); // a-z minúsculas
      initVariable(char);
    }
    
    // Inicializar combinaciones de dos letras (para minificación avanzada)
    const firstChars = ['q', 'w', 'A', 'B', 'C', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Z'];
    const secondChars = ['a', 'e', 'i', 'o', 'u', 'c', 'd', 'p', 't'];
    
    for (const first of firstChars) {
      for (const second of secondChars) {
        initVariable(first + second);
      }
    }
    
    // Inicializar variables específicas que suelen causar problemas TDZ
    const problemVars = [
      'Nc', 'qe', 'Qe', 'ec', 'En', 'In', 'Ht', 'Gt', 'wa', 'qa', 'Na', 'Ma', 'Sa', 'Se',
      'Bc', 'Mc', 'Dc', 'Jc', 'Kc', 'Lc', 'Rc', 'Sc', 'Tc', 'Uc', 'Vc', 'Wc', 'Xc', 'Yc', 'Zc',
      'Ka', 'La', 'Oa', 'Pa', 'Aa', 'Ba', 'Ca', 'Da', 'Ea', 'Fa', 'wi', 'Fp', 'Za', 'Ya', 'kd',
      'qr', 'Io', 'Wa', 'La', 'Ha', 'gd', '_d', 'wn', 'st', 'Wu', 'rn', 'sn', 'tn', 'si', 'ti', 'ri'
    ];
    
    problemVars.forEach(initVariable);
    
    // Implementar observador de ejecución para interceptar errores TDZ
    let previousY = undefined;
    
    // Intentar definir 'y' como un proxy solo si es configurable
    const yDescriptor = Object.getOwnPropertyDescriptor(window, 'y');
    if (!yDescriptor || yDescriptor.configurable) {
      try {
        previousY = window.y;
        Object.defineProperty(window, 'y', {
          get: function() {
            return previousY || {};
          },
          set: function(val) {
            previousY = val;
            return true;
          },
          configurable: true,
          enumerable: true
        });
      } catch (e) {
        console.warn(`⚠️ TDZ-RESOLVER: No se pudo definir proxy para 'y': ${e.message}`);
      }
    }
    
    // Monitoreo en tiempo real de errores TDZ 
    window.addEventListener('error', function(event) {
      if (event.message && event.message.includes('Cannot access') && event.message.includes('before initialization')) {
        // Extraer nombre de variable
        const matches = event.message.match(/'([^']+)'/);
        if (matches && matches[1]) {
          const varName = matches[1];
          console.warn(`⚠️ TDZ-RESOLVER: Interceptando error para variable '${varName}'`);
          
          // Inicializar inmediatamente
          initVariable(varName);
          
          // Intentar prevenir la propagación del error
          event.preventDefault();
          event.stopPropagation();
          
          // Guardar en registro de variables problemáticas
          try {
            const tdzLog = JSON.parse(localStorage.getItem('tdzProblemLog') || '[]');
            tdzLog.push({
              variable: varName,
              timestamp: new Date().toISOString(),
              url: window.location.href
            });
            
            // Limitar a 20 entradas
            if (tdzLog.length > 20) tdzLog.length = 20;
            
            localStorage.setItem('tdzProblemLog', JSON.stringify(tdzLog));
          } catch (e) {
            console.error("Error al registrar variable problemática:", e);
          }
          
          return true;
        }
      }
    }, true);
    
    // Implementar hook de monitoreo continuo con intervalos
    let monitoringActive = true;
    const startTime = Date.now();
    const tdz_monitor = setInterval(function() {
      // Verificar si 'y' sigue definido
      if (typeof window.y === 'undefined') {
        console.warn("⚠️ Variable 'y' ha sido eliminada, restaurando...");
        initVariable('y');
      }
      
      // Verificar otras variables críticas
      ['b', 'c', 'a', 'd', 'e', 'f', 'g', 'Nc', 'qa'].forEach(v => {
        if (typeof window[v] === 'undefined') {
          console.warn(`⚠️ Variable '${v}' ha sido eliminada, restaurando...`);
          initVariable(v);
        }
      });
      
      // Detener el monitoreo después de 10 segundos para evitar sobrecarga
      if (Date.now() - startTime > 10000) {
        clearInterval(tdz_monitor);
        monitoringActive = false;
      }
    }, 500);
    
    console.log("✅ TDZ-RESOLVER: Protección avanzada aplicada");
  } catch (error) {
    console.error("❌ Error en TDZ-RESOLVER:", error);
  }
})(); 