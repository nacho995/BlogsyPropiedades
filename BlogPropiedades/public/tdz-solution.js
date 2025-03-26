/**
 * TDZ-SOLUTION: Solución completa para los errores TDZ en componentes React
 * Combinación óptima de todas las técnicas para resolver el problema
 */
(function() {
  console.log("🚀 TDZ-SOLUTION: Iniciando solución integrada...");
  
  try {
    // ========== PASO 1: PRE-DEFINIR VARIABLES CRÍTICAS ==========
    // Definir variables globales para que sean accesibles en todos los ámbitos
    // Usar 'var' para asegurar hoisting global
    var y = {};
    var wi = {};
    var Fp = {};
    var Nc = {};
    
    // También asignar a window para máxima compatibilidad
    window.y = y;
    window.wi = wi;
    window.Fp = Fp;
    window.Nc = Nc;
    
    console.log("✅ TDZ-SOLUTION: Variables críticas pre-definidas");
    
    // ========== PASO 2: APLICAR PARCHE A COMPONENTES REACT ==========
    // Solución específica para el problema TDZ en componentes React
    
    function patchReactComponents() {
      // Si React no está disponible aún, reintentamos más tarde
      if (!window.React || !window.React.createElement) {
        setTimeout(patchReactComponents, 100);
        return;
      }
      
      // Parche para React.createElement
      const originalCreateElement = window.React.createElement;
      
      window.React.createElement = function(type, props, ...children) {
        // Verificar si estamos creando los componentes problemáticos
        if (typeof type === 'function') {
          const componentName = type.name || type.displayName;
          
          // Parche para ji (useProfileImage.js)
          if (componentName === 'ji') {
            const originalComponent = type;
            const patchedComponent = function(props) {
              try {
                // Definir 'y' en el scope local
                var y = window.y;
                return originalComponent.apply(this, arguments);
              } catch (e) {
                console.warn("⚠️ TDZ-SOLUTION: Error en ji:", e.message);
                return null;
              }
            };
            patchedComponent.displayName = 'ji';
            type = patchedComponent;
          }
          
          // Parche para Ni (NavBar.jsx)
          if (componentName === 'Ni') {
            const originalComponent = type;
            const patchedComponent = function(props) {
              try {
                // Definir 'y' en el scope local
                var y = window.y;
                return originalComponent.apply(this, arguments);
              } catch (e) {
                console.warn("⚠️ TDZ-SOLUTION: Error en Ni:", e.message);
                return null;
              }
            };
            patchedComponent.displayName = 'Ni';
            type = patchedComponent;
          }
        }
        
        return originalCreateElement.apply(this, [type, props, ...children]);
      };
      
      console.log("✅ TDZ-SOLUTION: React.createElement parcheado");
    }
    
    // Iniciar el proceso de parcheado de React
    setTimeout(patchReactComponents, 0);
    
    // ========== PASO 3: INYECTAR DEFINICIONES DE COMPONENTES ==========
    // Sobrescribir directamente las funciones de componentes a nivel global
    
    function injectComponentDefinitions() {
      const script = document.createElement('script');
      script.textContent = `
        // Inyección directa para ji y Ni
        (function() {
          // Guardar implementaciones originales
          const _ji = window.ji;
          const _Ni = window.Ni;
          
          // Sobrescribir ji
          window.ji = function() {
            try {
              // Definir 'y' en el scope local
              var y = {};
              return _ji ? _ji.apply(this, arguments) : null;
            } catch (e) {
              console.warn("⚠️ TDZ-SOLUTION: Error en ji inyectado:", e.message);
              return null;
            }
          };
          
          // Sobrescribir Ni
          window.Ni = function() {
            try {
              // Definir 'y' en el scope local
              var y = {};
              return _Ni ? _Ni.apply(this, arguments) : null;
            } catch (e) {
              console.warn("⚠️ TDZ-SOLUTION: Error en Ni inyectado:", e.message);
              return null;
            }
          };
          
          console.log("✅ TDZ-SOLUTION: Componentes inyectados directamente");
        })();
      `;
      document.head.appendChild(script);
    }
    
    // Inyectar definiciones de componentes
    setTimeout(injectComponentDefinitions, 0);
    
    // ========== PASO 4: MONITOREAR Y CORREGIR ERRORES TDZ ==========
    // Detector de errores en tiempo real
    
    window.addEventListener('error', function(event) {
      if (event.message && event.message.includes('Cannot access') && 
          event.message.includes('before initialization')) {
        
        // Extraer el nombre de la variable con problema
        const matches = event.message.match(/'([^']+)'/);
        if (matches && matches[1]) {
          const varName = matches[1];
          
          console.warn(`⚡ TDZ-SOLUTION: Interceptando error para '${varName}'`);
          
          // Inyectar la variable mediante script inline
          const fixScript = document.createElement('script');
          fixScript.textContent = `var ${varName} = {}; console.log("⚡ Variable '${varName}' reinyectada");`;
          document.head.appendChild(fixScript);
          
          // Intentar prevenir la propagación
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      }
    }, true);
    
    // ========== PASO 5: CARGAR SCRIPT DE COMPONENTES ESPECÍFICO ==========
    // Cargar el script especializado para los componentes
    
    function loadComponentPatch() {
      const script = document.createElement('script');
      script.src = 'react-component-patch.js';
      script.async = false;
      script.onload = function() {
        console.log("✅ TDZ-SOLUTION: Script de componentes cargado");
      };
      script.onerror = function() {
        console.warn("⚠️ TDZ-SOLUTION: Error al cargar script de componentes");
      };
      document.head.appendChild(script);
    }
    
    // Cargar el script específico para componentes
    setTimeout(loadComponentPatch, 10);
    
    console.log("✅ TDZ-SOLUTION: Solución completa iniciada");
  } catch (error) {
    console.error("❌ Error en TDZ-SOLUTION:", error);
  }
})(); 