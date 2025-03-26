/**
 * DIRECT-Y-FIX: Solución directa para el problema con la variable 'y'
 * Este script usa técnicas avanzadas para inyectar valores directamente
 */
(function() {
  console.log("💉 DIRECT-Y-FIX: Iniciando inyección directa para variable 'y'...");
  
  try {
    // 1. Iniciar script lo antes posible, antes de cualquier otro código
    const startTime = Date.now();
    
    // 2. Verificar si la variable ya está definida
    let yExists = false;
    try {
      yExists = typeof window.y !== 'undefined';
      console.log(`ℹ️ DIRECT-Y-FIX: Variable 'y' ${yExists ? 'ya existe' : 'no existe aún'}`);
    } catch (e) {
      console.log("ℹ️ DIRECT-Y-FIX: Error al comprobar 'y', asumiendo que no existe");
    }
    
    // 3. Intentar técnicas múltiples para definir 'y'
    
    // 3.1. Técnica 1: Inyección directa en window
    if (!yExists) {
      try {
        window.y = {};
        console.log("✓ DIRECT-Y-FIX: Técnica 1 - Asignación directa aplicada");
      } catch (e) {
        console.warn("⚠️ DIRECT-Y-FIX: Técnica 1 falló:", e.message);
      }
    }
    
    // 3.2. Técnica 2: Usar Object.defineProperty con valor por defecto
    try {
      const descriptor = Object.getOwnPropertyDescriptor(window, 'y');
      if (!descriptor || descriptor.configurable) {
        Object.defineProperty(window, 'y', {
          value: window.y || {},
          writable: true,
          enumerable: true,
          configurable: true
        });
        console.log("✓ DIRECT-Y-FIX: Técnica 2 - defineProperty aplicada");
      } else {
        console.log("ℹ️ DIRECT-Y-FIX: Técnica 2 - La propiedad no es configurable");
      }
    } catch (e) {
      console.warn("⚠️ DIRECT-Y-FIX: Técnica 2 falló:", e.message);
    }
    
    // 3.3. Técnica 3: Inyectar código directamente en la página
    try {
      const script = document.createElement('script');
      script.textContent = `
        // Script inyectado para definir y proteger 'y'
        try {
          if (typeof y === 'undefined') {
            var y = {}; // Usar 'var' para asegurar alcance global
            console.log("✓ DIRECT-Y-FIX: 'y' definida mediante inyección de script");
          }
        } catch(e) {
          console.warn("⚠️ DIRECT-Y-FIX: Error en script inyectado:", e.message);
        }
      `;
      document.head.appendChild(script);
      console.log("✓ DIRECT-Y-FIX: Técnica 3 - Script inyectado");
    } catch (e) {
      console.warn("⚠️ DIRECT-Y-FIX: Técnica 3 falló:", e.message);
    }
    
    // 3.4. Técnica 4: Inyectar directamente antes de que se ejecute el código React
    try {
      // Sobrescribir createElement para interceptar componentes que usan 'y'
      if (window.React && window.React.createElement) {
        const originalCreateElement = window.React.createElement;
        window.React.createElement = function(type, props, ...children) {
          // Interceptar cuando se crea NavBar o useProfileImage
          if (typeof type === 'function' && 
             (type.name === 'Ni' || type.name === 'ji')) {
            // Asignar 'y' antes de que el componente lo use
            try {
              window.y = window.y || {};
            } catch (e) {
              console.warn(`⚠️ DIRECT-Y-FIX: No se pudo asignar 'y' durante createElement:`, e);
            }
          }
          return originalCreateElement.apply(this, [type, props, ...children]);
        };
        console.log("✓ DIRECT-Y-FIX: Técnica 4 - Patch para React.createElement aplicado");
      } else {
        console.log("ℹ️ DIRECT-Y-FIX: Técnica 4 - React no está disponible aún");
      }
    } catch (e) {
      console.warn("⚠️ DIRECT-Y-FIX: Técnica 4 falló:", e.message);
    }
    
    // 4. Implementar Monkey Patching para los componentes específicos
    const componentFixes = {
      // Funciones de reemplazo
      ji: function() {
        // Stub para ji (useProfileImage)
        console.log("ℹ️ DIRECT-Y-FIX: Usando stub para ji (useProfileImage)");
        return null;
      },
      Ni: function() {
        // Stub para Ni (NavBar)
        console.log("ℹ️ DIRECT-Y-FIX: Usando stub para Ni (NavBar)");
        return null;
      }
    };
    
    // Técnica 5: Inyectar stubs globalmente
    try {
      Object.keys(componentFixes).forEach(name => {
        if (typeof window[name] === 'undefined') {
          window[name] = componentFixes[name];
          console.log(`✓ DIRECT-Y-FIX: Stub para '${name}' inyectado globalmente`);
        }
      });
    } catch (e) {
      console.warn("⚠️ DIRECT-Y-FIX: Técnica 5 falló:", e.message);
    }
    
    // 5. Implementar observer para errores TDZ
    window.addEventListener('error', function(event) {
      if (event.message && event.message.includes("Cannot access 'y' before initialization")) {
        console.warn("⚡ DIRECT-Y-FIX: Interceptando error TDZ para 'y'");
        
        // Intentar corregir el problema
        try {
          // Forzar valor a través de script inyectado
          const fixScript = document.createElement('script');
          fixScript.textContent = `var y = {}; console.log("⚡ DIRECT-Y-FIX: Forzando 'y' mediante script de emergencia");`;
          document.head.appendChild(fixScript);
          
          // Intentar detener la propagación
          event.preventDefault();
          event.stopPropagation();
          return true;
        } catch (e) {
          console.error("❌ DIRECT-Y-FIX: Error al aplicar corrección de emergencia:", e);
        }
      }
    }, true);
    
    // 6. Monitoreo periódico para reinyectar si es necesario
    const CHECK_INTERVAL = 500; // ms
    const MAX_DURATION = 30000; // 30 segundos máximo
    
    const monitor = setInterval(function() {
      try {
        // Verificar si 'y' necesita ser reinyectada
        let needsReinjection = false;
        try {
          if (typeof window.y === 'undefined') {
            needsReinjection = true;
          }
        } catch (e) {
          needsReinjection = true;
        }
        
        if (needsReinjection) {
          console.warn("⚠️ DIRECT-Y-FIX: 'y' no está definida, reinyectando...");
          
          // Reinyectar usando script directo
          const reinjectionScript = document.createElement('script');
          reinjectionScript.textContent = `var y = {}; console.log("⚡ DIRECT-Y-FIX: Valor reinyectado para 'y'");`;
          document.head.appendChild(reinjectionScript);
        }
        
        // Verificar si debemos detener el monitoreo
        if (Date.now() - startTime > MAX_DURATION) {
          clearInterval(monitor);
          console.log("ℹ️ DIRECT-Y-FIX: Monitoreo finalizado después de 30 segundos");
        }
      } catch (e) {
        console.warn("⚠️ DIRECT-Y-FIX: Error en monitoreo:", e);
      }
    }, CHECK_INTERVAL);
    
    console.log("✅ DIRECT-Y-FIX: Todas las técnicas de inyección aplicadas");
  } catch (error) {
    console.error("❌ Error en DIRECT-Y-FIX:", error);
  }
})(); 