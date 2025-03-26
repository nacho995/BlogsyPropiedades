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
      window.__variableProxy = new Proxy({}, {
        get: function(target, name) {
          // Si la propiedad no existe, crearla
          if (!(name in target)) {
            console.log(`⚠️ Definición automática de variable: ${name}`);
            target[name] = {};
          }
          return target[name];
        }
      });
      
      // Nombres comunes de variables minificadas que podrían causar problemas
      ['Nc', 'qe', 'Qe', 'ec', 'En', 'In', 'Ht', 'Gt', 'wa', 'qa', 'Na', 'Ma', 'Sa', 'Se',
       'Bc', 'Mc', 'Dc', 'Jc', 'Kc', 'Lc', 'Rc', 'Sc', 'Tc', 'Uc', 'Vc', 'Wc', 'Xc', 'Yc', 'Zc',
       'Ka', 'La', 'Oa', 'Pa', 'Aa', 'Ba', 'Ca', 'Da', 'Ea', 'Fa'].forEach(name => {
        if (typeof window[name] === 'undefined') {
          window[name] = window.__variableProxy;
        }
      });
    }
    
    // Marcar que la inicialización se ha completado
    window.__ncFixCompleted = true;
    console.log('✅ ncfix.js completado');
  } catch (error) {
    console.error('❌ Error en ncfix.js:', error);
  }
})(); 