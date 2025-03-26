/**
 * Plugin para Vite que modifica el código en tiempo de compilación 
 * para prevenir errores TDZ (Temporal Dead Zone)
 */

const fs = require('fs');
const path = require('path');

// Exportar el plugin
module.exports = function viteTDZFix() {
  return {
    name: 'vite-plugin-tdz-fix',
    
    // Transformar código en tiempo de compilación
    transform(code, id) {
      // Solo transformar archivos JavaScript/JSX/TS/TSX
      if (!/\.(jsx?|tsx?)$/.test(id)) {
        return null;
      }
      
      // Ignorar node_modules
      if (id.includes('node_modules')) {
        return null;
      }
      
      try {
        // Transformar código para evitar errores TDZ
        const transformedCode = preventTDZErrors(code);
        
        // Registrar archivo modificado (para debug)
        logFileModification(id);
        
        return transformedCode;
      } catch (error) {
        console.error(`Error transformando ${id}:`, error);
        return code; // En caso de error, devolver código original
      }
    },
    
    // Código a insertar al principio de la aplicación
    transformIndexHtml(html) {
      const scriptToInject = `
        <script>
          // Vite TDZ Fix - Inicialización preventiva
          (function() {
            // Variables de una sola letra
            for (let i = 97; i <= 122; i++) {
              var varName = String.fromCharCode(i);
              window[varName] = window[varName] || {};
            }
            
            // Variables específicas que causan problemas
            ['y', 'b', 'wi', 'Fp', 'Ya', 'Za'].forEach(function(v) {
              window[v] = window[v] || {};
            });
            
            console.log("✅ Vite TDZ Fix aplicado");
          })();
        </script>
      `;
      
      // Insertar después de la etiqueta <head>
      return html.replace('<head>', '<head>' + scriptToInject);
    }
  };
};

/**
 * Transformar código para prevenir errores TDZ
 */
function preventTDZErrors(code) {
  // 1. Sustituir declaraciones let/const por var 
  // para variables problemáticas como 'y', 'b', etc.
  let modifiedCode = code
    .replace(/\b(let|const)\s+(y|b|wi|Fp)\b/g, 'var $2')
    
    // 2. Añadir verificación para evitar sobrescritura
    .replace(/\bexport\s+(let|const|var)\s+(y|b|wi|Fp)\b/g, 
             'export var $2 = (typeof window !== "undefined" && window.$2) || ')
             
    // 3. Mover las inicializaciones antes de la declaración
    .replace(/(\bfunction\b.*?\{)/g, '$1\n  var y,b,wi,Fp;\n')
    
    // 4. Añadir try-catch alrededor de código potencialmente problemático
    .replace(/(\bimport\s+.+\s+from\s+['"].+['"];?)/g, 
             'try { $1 } catch(e) { console.error("Error en import:", e); }');
  
  return modifiedCode;
}

/**
 * Registrar archivos modificados para debug
 */
function logFileModification(filePath) {
  try {
    const logFile = path.resolve(__dirname, '../tdz-fix-log.json');
    let log = [];
    
    // Cargar log existente si existe
    if (fs.existsSync(logFile)) {
      log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    }
    
    // Añadir entrada
    log.push({
      file: path.basename(filePath),
      time: new Date().toISOString()
    });
    
    // Limitar a 100 entradas
    if (log.length > 100) {
      log = log.slice(-100);
    }
    
    // Guardar log
    fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
  } catch (error) {
    console.error('Error al registrar modificación de archivo:', error);
  }
} 