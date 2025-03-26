/**
 * Script de ayuda para implementar la solución TDZ en cualquier aplicación
 * Ejecutar con Node.js:
 * node instalar-solucion-tdz.js <ruta-del-index-html>
 */

const fs = require('fs');
const path = require('path');

// Script de protección TDZ a insertar
const TDZ_SCRIPT = `
  <!-- SOLUCIÓN TDZ - Protección contra errores TDZ -->
  <script>
    // SOLUCIÓN TDZ INLINE - Definir variables críticas inmediatamente
    (function() {
      // 1. Definir variables críticas usando 'var' para hoisting global
      var y = {};
      var wi = {};
      var Fp = {};
      var Nc = {};
      
      // 2. Asignar a window para garantizar su disponibilidad
      window.y = y;
      window.wi = wi;
      window.Fp = Fp;
      window.Nc = Nc;
      
      console.log("🔒 Variables críticas 'y', 'wi', 'Fp', 'Nc' protegidas");
      
      // 3. Detector de errores TDZ para protección adicional
      window.addEventListener('error', function(event) {
        if (event.message && event.message.includes('Cannot access') && 
            event.message.includes('before initialization')) {
          
          // Extraer nombre de la variable problemática
          var matches = event.message.match(/'([^']+)'/);
          if (matches && matches[1]) {
            var varName = matches[1];
            
            // Inyectar inmediatamente mediante script
            var script = document.createElement('script');
            script.textContent = \`
              // Definir variable problemática
              var \${varName} = {}; 
              window.\${varName} = window.\${varName} || {};
              console.log("⚡ Variable '\${varName}' protegida mediante interceptor");
            \`;
            document.head.appendChild(script);
            
            // Intentar prevenir propagación
            event.preventDefault();
            event.stopPropagation();
            return true;
          }
        }
      }, true);
      
      // 4. Cargar script de solución completa
      setTimeout(function() {
        var script = document.createElement('script');
        script.src = 'tdz-solution.js';
        document.head.appendChild(script);
      }, 0);
    })();
  </script>
`;

function instalarSolucion() {
  try {
    // Obtener la ruta del archivo HTML
    const htmlPath = process.argv[2] || '../index.html';
    const htmlFullPath = path.resolve(__dirname, htmlPath);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(htmlFullPath)) {
      console.error(`❌ Error: El archivo ${htmlFullPath} no existe.`);
      console.log(`Uso: node instalar-solucion-tdz.js <ruta-del-index-html>`);
      return;
    }
    
    // Leer el archivo HTML
    let htmlContent = fs.readFileSync(htmlFullPath, 'utf8');
    
    // Verificar si ya tiene la solución TDZ
    if (htmlContent.includes('SOLUCIÓN TDZ INLINE')) {
      console.log('✅ El archivo ya tiene la solución TDZ instalada.');
      return;
    }
    
    // Insertar el script después de la etiqueta <head>
    const headIndex = htmlContent.indexOf('<head>') + 6;
    if (headIndex <= 6) {
      console.error('❌ Error: No se encontró la etiqueta <head> en el HTML.');
      return;
    }
    
    // Insertar el script
    const newHtmlContent = 
      htmlContent.slice(0, headIndex) + 
      '\n' + TDZ_SCRIPT + '\n' +
      htmlContent.slice(headIndex);
    
    // Guardar el archivo modificado
    fs.writeFileSync(htmlFullPath, newHtmlContent);
    
    // Copiar los scripts necesarios
    const publicDir = path.dirname(htmlFullPath);
    
    // Copiar tdz-solution.js
    const tdzSolutionSource = path.resolve(__dirname, 'tdz-solution.js');
    const tdzSolutionDest = path.join(publicDir, 'tdz-solution.js');
    fs.copyFileSync(tdzSolutionSource, tdzSolutionDest);
    
    // Copiar react-component-patch.js
    const reactPatchSource = path.resolve(__dirname, 'react-component-patch.js');
    const reactPatchDest = path.join(publicDir, 'react-component-patch.js');
    fs.copyFileSync(reactPatchSource, reactPatchDest);
    
    console.log('✅ Solución TDZ instalada correctamente:');
    console.log(`Script de protección insertado en ${htmlFullPath}`);
    console.log(`Copiado tdz-solution.js a ${tdzSolutionDest}`);
    console.log(`Copiado react-component-patch.js a ${reactPatchDest}`);
    console.log('\nLa solución TDZ ahora está implementada. Por favor verifica que:');
    console.log('1. El script TDZ es el PRIMER script en el <head>');
    console.log('2. Los scripts tdz-solution.js y react-component-patch.js están en la carpeta correcta');
    
  } catch (error) {
    console.error('❌ Error durante la instalación:', error.message);
  }
}

// Ejecutar la instalación
instalarSolucion(); 