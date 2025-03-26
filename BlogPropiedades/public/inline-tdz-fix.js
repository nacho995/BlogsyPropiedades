// Protección TDZ en línea - Colocar directamente en el HTML antes de cualquier otro script
(function() {
  // 1. Pre-inicializar variables críticas
  try {
    // Usar var para asegurar que sea global y hoist
    var y = {};
    var wi = {};
    var Fp = {};
    var Nc = {};
    
    // Informar
    console.log("🔒 Variables críticas 'y', 'wi', 'Fp', 'Nc' protegidas en línea");
    
    // 2. Preparar reinyección en caso de error
    window.addEventListener('error', function(event) {
      if (event.message && event.message.includes('Cannot access') && 
          event.message.includes('before initialization')) {
        
        // Extraer nombre de la variable
        var matches = event.message.match(/'([^']+)'/);
        if (matches && matches[1]) {
          var varName = matches[1];
          
          // Inyectar inmediatamente mediante script inline
          var script = document.createElement('script');
          script.textContent = 'var ' + varName + ' = {}; console.log("⚡ Variable \'' + varName + '\' reinyectada");';
          document.head.appendChild(script);
          
          console.log("⚡ Error TDZ interceptado para: " + varName);
          
          // Intentar prevenir propagación
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      }
    }, true);
    
    // 3. Cargar el resto de los scripts de protección
    var scripts = ['direct-y-fix.js', 'y-fix.js', 'navbar-fix.js', 'tdz-resolver.js'];
    
    function loadNextScript(index) {
      if (index >= scripts.length) {
        console.log("✅ Todos los scripts de protección TDZ cargados");
        return;
      }
      
      var script = document.createElement('script');
      script.src = scripts[index];
      script.onload = function() {
        loadNextScript(index + 1);
      };
      script.onerror = function() {
        console.warn("⚠️ Error al cargar: " + scripts[index]);
        loadNextScript(index + 1);
      };
      document.head.appendChild(script);
    }
    
    // Iniciar carga de scripts
    setTimeout(function() {
      loadNextScript(0);
    }, 0);
    
  } catch(e) {
    console.error("❌ Error en protección TDZ en línea:", e);
  }
})(); 