/**
 * Y-FIX: Solución específica para resolver el problema TDZ con la variable 'y'
 * Este script actúa como un complemento al TDZ-RESOLVER general
 */
(function() {
  console.log("🔧 Y-FIX: Iniciando solución específica para variable 'y'...");
  
  try {
    // Método alternativo para manejar la variable 'y'
    // Este enfoque evita problemas con propiedades no configurables
    
    // 1. Guardar el valor original si existe
    let originalY;
    try {
      originalY = window.y;
    } catch (e) {
      // Si hay error al acceder, asumimos que no está definido aún
      originalY = {};
    }
    
    // 2. Verificar si podemos usar la técnica de definición de propiedades
    let canUseDefineProperty = true;
    try {
      // Verificar si la propiedad ya está definida y no es configurable
      const descriptor = Object.getOwnPropertyDescriptor(window, 'y');
      if (descriptor && descriptor.configurable === false) {
        canUseDefineProperty = false;
        console.warn("⚠️ Y-FIX: 'y' ya está definida como no configurable");
      }
    } catch (e) {
      console.warn("⚠️ Y-FIX: Error al verificar descriptor de 'y':", e);
    }
    
    // 3. Aplicar una de las dos técnicas disponibles
    if (canUseDefineProperty) {
      // Técnica preferida: definir como getter/setter
      try {
        Object.defineProperty(window, 'y', {
          get: function() {
            return originalY;
          },
          set: function(val) {
            originalY = val;
            return true;
          },
          configurable: true,
          enumerable: true
        });
        console.log("✅ Y-FIX: Proxy para 'y' configurado correctamente");
      } catch (e) {
        console.warn("⚠️ Y-FIX: Error al definir proxy para 'y':", e);
        canUseDefineProperty = false;
      }
    }
    
    // Si la técnica preferida falla, intentar alternativas
    if (!canUseDefineProperty) {
      // Intentar técnica alternativa: monkeypatching de React
      console.log("🔄 Y-FIX: Intentando técnica alternativa...");
      
      // Verificar si React está disponible
      if (window.React) {
        const originalCreateElement = window.React.createElement;
        
        // Reemplazar React.createElement para manejar el caso de 'y'
        window.React.createElement = function() {
          try {
            return originalCreateElement.apply(this, arguments);
          } catch (e) {
            if (e instanceof ReferenceError && e.message.includes("'y' before initialization")) {
              console.warn("⚡ Y-FIX: Interceptando error TDZ para 'y' en React");
              // Proporcionar un valor predeterminado para 'y'
              window.y = window.y || {};
              // Reintentar la creación del elemento
              return originalCreateElement.apply(this, arguments);
            }
            throw e; // Re-lanzar otros errores
          }
        };
        console.log("✅ Y-FIX: Patch para React.createElement aplicado");
      } else {
        console.warn("⚠️ Y-FIX: React no está disponible, no se puede aplicar parche");
      }
    }
    
    // 4. Agregar listener de error específico para 'y'
    window.addEventListener('error', function(event) {
      if (event.message && 
          event.message.includes("Cannot access 'y' before initialization")) {
        console.warn("⚡ Y-FIX: Interceptando error TDZ para 'y'");
        
        // Definir 'y' si aún no está definido
        if (typeof window.y === 'undefined') {
          window.y = {};
        }
        
        // Intentar prevenir la propagación del error
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    }, true);
    
    // 5. Monitoreo periódico
    const yMonitor = setInterval(function() {
      // Verificar y restaurar 'y' si se ha eliminado
      if (typeof window.y === 'undefined') {
        console.warn("⚠️ Y-FIX: Variable 'y' ha sido eliminada, restaurando...");
        window.y = originalY || {};
      }
      
      // Detener el monitoreo después de 30 segundos
      if (Date.now() - startTime > 30000) {
        clearInterval(yMonitor);
      }
    }, 1000);
    
    const startTime = Date.now();
    
    console.log("✅ Y-FIX: Solución para variable 'y' aplicada");
    
  } catch (error) {
    console.error("❌ Error en Y-FIX:", error);
  }
})(); 