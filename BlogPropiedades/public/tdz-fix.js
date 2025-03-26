/**
 * TDZ-FIX: Solución específica para errores de Zona Muerta Temporal (TDZ)
 * "Cannot access 'y'/'b' before initialization"
 */
(function() {
  console.log('🔨 Iniciando corrección TDZ...');
  
  try {
    // Crear objeto para rastrear las inicializaciones
    window.__tdzFixInitialized = window.__tdzFixInitialized || {};
    
    // Función para inicializar una variable de forma segura
    function initSafely(name) {
      if (!window.__tdzFixInitialized[name]) {
        window[name] = {};
        window.__tdzFixInitialized[name] = true;
        return true;
      }
      return false;
    }
    
    // Inicializar todas las variables de una sola letra del alfabeto
    // Estas son comunes en código minificado y pueden causar errores de TDZ
    let totalInitialized = 0;
    for (let i = 97; i <= 122; i++) {
      const letter = String.fromCharCode(i);
      if (initSafely(letter)) {
        totalInitialized++;
      }
    }
    
    // Inicializar también variables específicas con nombres comunes en bundlers
    const commonMinifiedVars = [
      // Variables React/ReactDOM comunes
      'Nc', 'qe', 'Qe', 'ec', 'En', 'In', 'Ht', 'Gt', 
      // Variables comunes en bundlers
      'wa', 'qa', 'Na', 'Ma', 'Sa', 'Se', 'Bc', 'Mc', 
      'Dc', 'Jc', 'Kc', 'Lc', 'Rc', 'Sc', 'Tc', 'Uc', 
      'Vc', 'Wc', 'Xc', 'Yc', 'Zc', 'Ka', 'La', 'Oa', 
      'Pa', 'Aa', 'Ba', 'Ca', 'Da', 'Ea', 'Fa',
      // Nombres específicos relacionados con React
      'Fragment', 'StrictMode', 'Suspense', 'useState',
      'useEffect', 'useContext', 'useReducer', 'useRef'
    ];
    
    commonMinifiedVars.forEach(name => {
      if (initSafely(name)) {
        totalInitialized++;
      }
    });
    
    // Crear un proxy global para interceptar accesos a propiedades no definidas
    if (!window.__tdzProxy) {
      window.__tdzProxy = new Proxy({}, {
        get: function(target, name) {
          if (!(name in target)) {
            console.log(`🔧 TDZ-FIX: Interceptando acceso a '${String(name)}'`);
            target[name] = {};
          }
          return target[name];
        }
      });
      
      // Usar el proxy para objetos globales comunes
      if (!window.React) window.React = window.__tdzProxy;
      if (!window.ReactDOM) window.ReactDOM = window.__tdzProxy;
    }
    
    console.log(`✅ TDZ-FIX: ${totalInitialized} variables inicializadas preventivamente`);
  } catch (error) {
    console.error('❌ Error en TDZ-FIX:', error);
  }
})(); 