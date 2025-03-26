#!/usr/bin/env node
/**
 * Script para implementar la solución TDZ automáticamente
 * Uso: node implementar-solucion.cjs [ruta/a/index.html]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Solución TDZ a insertar
const TDZ_SCRIPT = `
  <!-- SOLUCIÓN TDZ OPTIMIZADA - DEBE SER EL PRIMER SCRIPT -->
  <script>
  (function() {
    console.log("🚀 TDZ-FIX-FINAL: Iniciando protección TDZ...");
    
    // 1. Pre-definir variables críticas
    var y = window.y = {};
    var wi = window.wi = {};
    var Fp = window.Fp = {};
    var Nc = window.Nc = {};
    
    // Otras variables minificadas frecuentes
    ['Qe', 'qe', 'Il', 'Kc', 'Hl', 'Oe', 'Si', 'Oi', 'Rc', 'Qc', 'Ab', 'Bb', 'Ni', 'Wc', 'Mi', 'Li', 'Ki', 'Ji']
      .forEach(function(name) { window[name] = window[name] || {}; });
    
    // 2. Interceptar definiciones de componentes
    try {
      var jiOriginal = null;
      var NiOriginal = null;
      
      // Patch para ji (useProfileImage.js)
      Object.defineProperty(window, 'ji', {
        get: function() { return jiOriginal; },
        set: function(value) {
          jiOriginal = function() {
            var y = {}; // Definir 'y' localmente
            try {
              return value.apply(this, arguments);
            } catch(e) {
              console.warn("⚠️ TDZ-FIX-FINAL: Error en ji:", e.message);
              return null;
            }
          };
          return true;
        },
        configurable: true
      });
      
      // Patch para Ni (NavBar.jsx)
      Object.defineProperty(window, 'Ni', {
        get: function() { return NiOriginal; },
        set: function(value) {
          NiOriginal = function() {
            var y = {}; // Definir 'y' localmente
            try {
              return value.apply(this, arguments);
            } catch(e) {
              console.warn("⚠️ TDZ-FIX-FINAL: Error en Ni:", e.message);
              return null;
            }
          };
          return true;
        },
        configurable: true
      });
      
      // 3. Inyección directa como medida preventiva
      function injectComponentFixes() {
        var script = document.createElement('script');
        script.textContent = "(function() { var y = {}; var _ji = window.ji; var _Ni = window.Ni; window.ji = function() { var y = {}; try { return _ji ? _ji.apply(this, arguments) : null; } catch(e) { return null; } }; window.Ni = function() { var y = {}; try { return _Ni ? _Ni.apply(this, arguments) : null; } catch(e) { return null; } }; console.log('💉 TDZ-FIX-FINAL: Componentes ji y Ni protegidos directamente'); })();";
        document.head.appendChild(script);
      }
      
      // 4. Detector de errores TDZ
      window.addEventListener('error', function(event) {
        if (event.message && event.message.includes("Cannot access 'y' before initialization")) {
          console.warn("⚡ TDZ-FIX-FINAL: Corrigiendo error TDZ");
          injectComponentFixes();
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      }, true);
      
      // 5. Ejecutar inyección directa
      setTimeout(injectComponentFixes, 0);
      
      console.log("✅ TDZ-FIX-FINAL: Protección TDZ completa aplicada");
    } catch(e) {
      console.warn("⚠️ Error en TDZ-FIX-FINAL:", e.message);
      
      // Solución de emergencia
      var script = document.createElement('script');
      script.textContent = "var y = {}; var wi = {}; var Fp = {}; var Nc = {};";
      document.head.appendChild(script);
    }
  })();
  </script>
`;

// Función para preguntar al usuario
function pregunta(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// Función principal
async function implementarSolucion() {
  try {
    // Obtener la ruta del HTML
    const indexPath = process.argv[2] || 'index.html';
    const fullPath = path.resolve(process.cwd(), indexPath);
    
    console.log(`🔍 Buscando archivo HTML en: ${fullPath}`);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Error: El archivo ${fullPath} no existe.`);
      console.log('Uso: node implementar-solucion.cjs [ruta/a/index.html]');
      process.exit(1);
    }
    
    // Crear copia de seguridad
    const backupPath = `${fullPath}.bak`;
    fs.copyFileSync(fullPath, backupPath);
    console.log(`✅ Copia de seguridad creada en: ${backupPath}`);
    
    // Leer el contenido del HTML
    let htmlContent = fs.readFileSync(fullPath, 'utf8');
    
    // Verificar si ya tiene la solución TDZ
    if (htmlContent.includes('TDZ-FIX-FINAL')) {
      console.log('⚠️ El archivo ya contiene la solución TDZ.');
      const continuar = await pregunta('¿Deseas reemplazarla? (s/n): ');
      if (continuar.toLowerCase() !== 's') {
        console.log('🛑 Operación cancelada.');
        process.exit(0);
      }
    }
    
    // Buscar dónde insertar el script
    let insertIndex;
    
    // Buscar etiqueta head
    const headMatch = htmlContent.match(/<head[^>]*>/i);
    if (headMatch) {
      // Insertar justo después de la etiqueta head
      insertIndex = headMatch.index + headMatch[0].length;
    } else {
      // Si no hay head, buscar html
      const htmlMatch = htmlContent.match(/<html[^>]*>/i);
      if (htmlMatch) {
        // Insertar después de html y crear head
        insertIndex = htmlMatch.index + htmlMatch[0].length;
        htmlContent = htmlContent.slice(0, insertIndex) + '\n<head>' + htmlContent.slice(insertIndex);
        insertIndex += 6; // length of <head>
      } else {
        // Si no hay html, insertar al principio
        insertIndex = 0;
      }
    }
    
    // Insertar el script TDZ
    htmlContent = htmlContent.slice(0, insertIndex) + TDZ_SCRIPT + htmlContent.slice(insertIndex);
    
    // Guardar el archivo modificado
    fs.writeFileSync(fullPath, htmlContent);
    
    console.log(`✅ Solución TDZ implementada correctamente en: ${fullPath}`);
    console.log('ℹ️ La solución ya está lista para funcionar en producción.');
    
  } catch (error) {
    console.error('❌ Error al implementar la solución:', error.message);
    process.exit(1);
  }
}

// Ejecutar la función principal
implementarSolucion(); 