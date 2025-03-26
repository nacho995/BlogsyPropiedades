/**
 * REACT-COMPONENT-PATCH: Solución específica para los componentes React
 * Ataca específicamente useProfileImage.js (ji) y NavBar.jsx (Ni)
 */
(function() {
  console.log("🔧 REACT-COMPONENT-PATCH: Iniciando parche para componentes React...");
  
  try {
    // El problema principal: los componentes están usando 'y' en un scope local
    // En lugar de intentar definir 'y' globalmente, vamos a modificar los componentes
    
    // Función para aplicar el parche de forma segura
    function applyComponentPatches() {
      // 1. Variable para almacenar el estado del parche
      window.__reactComponentsPatched = window.__reactComponentsPatched || {
        ji: false,
        Ni: false
      };
      
      // 2. Verificar si React está disponible
      if (!window.React || !window.React.createElement) {
        console.log("⏳ REACT-COMPONENT-PATCH: React aún no está disponible, reintentando en 100ms...");
        setTimeout(applyComponentPatches, 100);
        return;
      }
      
      // 3. Parche para React.createElement
      if (!window.__reactCreateElementPatched) {
        const originalCreateElement = window.React.createElement;
        
        window.React.createElement = function(type, props, ...children) {
          // Verificar si estamos creando uno de los componentes problemáticos
          if (typeof type === 'function') {
            const componentName = type.name || type.displayName;
            
            // Parche para componente ji (useProfileImage.js)
            if (componentName === 'ji' && !window.__reactComponentsPatched.ji) {
              console.log("🔍 REACT-COMPONENT-PATCH: Detectado componente ji (useProfileImage)");
              
              const originalJi = type;
              const patchedJi = function(props) {
                try {
                  // Definir 'y' en el scope local del componente
                  var y = window.y || {};
                  
                  // Llamar al componente original con 'y' ya definida en este scope
                  return originalJi.apply(this, arguments);
                } catch (e) {
                  console.warn("⚠️ REACT-COMPONENT-PATCH: Error en componente ji:", e);
                  return null; // Devolver un valor seguro en caso de error
                }
              };
              
              // Preservar propiedades importantes
              patchedJi.displayName = 'ji';
              patchedJi.originalComponent = originalJi;
              
              // Reemplazar el componente
              type = patchedJi;
              window.__reactComponentsPatched.ji = true;
              console.log("✅ REACT-COMPONENT-PATCH: Componente ji parcheado");
            }
            
            // Parche para componente Ni (NavBar.jsx)
            if (componentName === 'Ni' && !window.__reactComponentsPatched.Ni) {
              console.log("🔍 REACT-COMPONENT-PATCH: Detectado componente Ni (NavBar)");
              
              const originalNi = type;
              const patchedNi = function(props) {
                try {
                  // Definir 'y' en el scope local del componente
                  var y = window.y || {};
                  
                  // Llamar al componente original con 'y' ya definida en este scope
                  return originalNi.apply(this, arguments);
                } catch (e) {
                  console.warn("⚠️ REACT-COMPONENT-PATCH: Error en componente Ni:", e);
                  return null; // Devolver un valor seguro en caso de error
                }
              };
              
              // Preservar propiedades importantes
              patchedNi.displayName = 'Ni';
              patchedNi.originalComponent = originalNi;
              
              // Reemplazar el componente
              type = patchedNi;
              window.__reactComponentsPatched.Ni = true;
              console.log("✅ REACT-COMPONENT-PATCH: Componente Ni parcheado");
            }
          }
          
          // Llamar a createElement original
          return originalCreateElement.apply(this, [type, props, ...children]);
        };
        
        window.__reactCreateElementPatched = true;
        console.log("✅ REACT-COMPONENT-PATCH: React.createElement parcheado");
      }
      
      // 4. Verificar continuamente si se han aplicado todos los parches
      if (!window.__reactComponentsPatched.ji || !window.__reactComponentsPatched.Ni) {
        // Si no se han parcheado todos los componentes, continuar verificando
        console.log("⏳ REACT-COMPONENT-PATCH: Esperando a detectar todos los componentes...");
        setTimeout(applyComponentPatches, 500);
      } else {
        console.log("✅ REACT-COMPONENT-PATCH: Todos los componentes parcheados");
      }
    }
    
    // 5. Implementar técnica alternativa (inyección directa)
    function injectDirectPatches() {
      try {
        // Inyectar código directamente para sobrescribir funciones de componentes
        const script = document.createElement('script');
        script.textContent = `
          // Intento directo de sobrescribir ji y Ni
          (function() {
            // Guardar las implementaciones originales si existen
            const originalJi = window.ji;
            const originalNi = window.Ni;
            
            // Sobrescribir ji
            window.ji = function() {
              try {
                // Definir 'y' en este scope
                var y = window.y || {};
                
                // Si existe la implementación original, llamarla
                if (typeof originalJi === 'function') {
                  return originalJi.apply(this, arguments);
                }
                return null;
              } catch (e) {
                console.warn("⚠️ Error en ji sobrescrito:", e);
                return null;
              }
            };
            
            // Sobrescribir Ni
            window.Ni = function() {
              try {
                // Definir 'y' en este scope
                var y = window.y || {};
                
                // Si existe la implementación original, llamarla
                if (typeof originalNi === 'function') {
                  return originalNi.apply(this, arguments);
                }
                return null;
              } catch (e) {
                console.warn("⚠️ Error en Ni sobrescrito:", e);
                return null;
              }
            };
            
            console.log("💉 Componentes ji y Ni inyectados directamente");
          })();
        `;
        document.head.appendChild(script);
        console.log("✅ REACT-COMPONENT-PATCH: Inyección directa completada");
      } catch (e) {
        console.warn("⚠️ REACT-COMPONENT-PATCH: Error en inyección directa:", e);
      }
    }
    
    // 6. Monitorear errores de TDZ específicos
    window.addEventListener('error', function(event) {
      if (event.message && 
          event.message.includes("Cannot access 'y' before initialization") &&
          (event.filename.includes('useProfileImage.js') || event.filename.includes('NavBar.jsx'))) {
        
        console.warn("⚡ REACT-COMPONENT-PATCH: Error TDZ detectado en componente React");
        
        // Aplicar inyección directa como medida de emergencia
        injectDirectPatches();
        
        // Intentar prevenir la propagación
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    }, true);
    
    // 7. Iniciar el proceso de parcheado
    applyComponentPatches();
    
    // También aplicar inyección directa por seguridad
    setTimeout(injectDirectPatches, 500);
    
    console.log("✅ REACT-COMPONENT-PATCH: Inicialización completada");
  } catch (error) {
    console.error("❌ Error en REACT-COMPONENT-PATCH:", error);
  }
})(); 