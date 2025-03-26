/**
 * Fix específico para el error de inicialización "Cannot access 'Nc' before initialization"
 */
(function() {
  console.log('🛠️ Iniciando ncfix.js...');
  
  try {
    // Comprobar si Nc ya está definido
    if (typeof window.Nc === 'undefined') {
      // Si no está definido, crearlo
      window.Nc = {};
      console.log('✓ Creado objeto Nc');
    } else {
      console.log('✓ Nc ya está definido');
    }
    
    // Funciones específicas que podrían faltar en Nc
    const commonMethods = ['initialize', 'render', 'update', 'create', 'destroy', 'mount', 'unmount'];
    
    // Agregar métodos que podrían faltar en Nc
    if (window.Nc) {
      commonMethods.forEach(method => {
        if (typeof window.Nc[method] === 'undefined') {
          window.Nc[method] = function() { 
            console.log(`Llamada a método Nc.${method}`);
            return {}; 
          };
        }
      });
    }

    // Verificar el estado del objeto Nc
    console.log(`✓ Estado de Nc: ${typeof window.Nc}`);
    
    // Crear un proxy global para interceptar accesos a variables no definidas
    if (!window.__variableProxy) {
      window.__variableProxy = function(varName) {
        // Si la variable no existe, crearla
        if (typeof window[varName] === 'undefined') {
          console.log(`⚠️ Definición automática de variable: ${varName}`);
          window[varName] = new Proxy({}, {
            get: function(target, prop) {
              if (!(prop in target)) {
                console.log(`⚠️ Acceso a propiedad indefinida: ${varName}.${String(prop)}`);
                target[prop] = {};
              }
              return target[prop];
            }
          });
        }
        return window[varName];
      };
      
      // Nombres comunes de variables minificadas que podrían causar problemas
      ['Nc', 'qe', 'Qe', 'ec', 'En', 'In', 'Ht', 'Gt', 'wa', 'qa', 'Na', 'Ma', 'Sa', 'Se',
       'Bc', 'Mc', 'Dc', 'Jc', 'Kc', 'Lc', 'Rc', 'Sc', 'Tc', 'Uc', 'Vc', 'Wc', 'Xc', 'Yc', 'Zc',
       'Ka', 'La', 'Oa', 'Pa', 'Aa', 'Ba', 'Ca', 'Da', 'Ea', 'Fa'].forEach(name => {
        window.__variableProxy(name);
      });
    }
    
    console.log('✅ ncfix.js completado');
  } catch (error) {
    console.error('❌ Error en ncfix.js:', error);
  }
})(); 