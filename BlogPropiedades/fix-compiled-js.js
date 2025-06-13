/**
 * Script para aplicar corrección a los archivos JS compilados
 * Este script busca instancias del dominio antiguo en los archivos compilados
 * y las reemplaza por el nuevo dominio con las rutas correctas
 */

const fs = require('fs');
const path = require('path');

// Configuración
const DIST_FOLDER = path.join(__dirname, 'dist', 'assets');
const OLD_DOMAIN = 'nextjs-gozamadrid-qrfk.onrender.com';
const NEW_DOMAIN = 'blogs.realestategozamadrid.com';

// Patrones a corregir
const PATTERNS = [
  // Dominio antiguo con rutas específicas
  {
    search: new RegExp(`https?://${OLD_DOMAIN}/blogs`, 'g'),
    replace: `https://${NEW_DOMAIN}/api/blogs`
  },
  {
    search: new RegExp(`https?://${OLD_DOMAIN}/properties`, 'g'),
    replace: `https://${NEW_DOMAIN}/api/properties`
  },
  {
    search: new RegExp(`https?://${OLD_DOMAIN}/user/profile-image`, 'g'),
    replace: `https://${NEW_DOMAIN}/api/user/profile-image`
  },
  {
    search: new RegExp(`https?://${OLD_DOMAIN}/auth/me`, 'g'),
    replace: `https://${NEW_DOMAIN}/api/user/me`
  },
  // Cualquier otra URL al dominio antiguo
  {
    search: new RegExp(`https?://${OLD_DOMAIN}/`, 'g'),
    replace: `https://${NEW_DOMAIN}/api/`
  },
  // Catch-all para cualquier otra URL al dominio antiguo sin trailing slash
  {
    search: new RegExp(`https?://${OLD_DOMAIN}`, 'g'),
    replace: `https://${NEW_DOMAIN}/api`
  },
];

// Función principal para recorrer y corregir archivos
async function fixCompiledJsFiles() {
  console.log(`🔍 Buscando archivos JS compilados en ${DIST_FOLDER}...`);
  
  try {
    // Verificar si el directorio existe
    if (!fs.existsSync(DIST_FOLDER)) {
      console.error(`❌ El directorio ${DIST_FOLDER} no existe.`);
      return;
    }
    
    // Leer archivos del directorio
    const files = fs.readdirSync(DIST_FOLDER);
    
    // Filtrar solo archivos JS
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    console.log(`📋 Encontrados ${jsFiles.length} archivos JS para procesar`);
    
    // Procesar cada archivo JS
    for (const file of jsFiles) {
      const filePath = path.join(DIST_FOLDER, file);
      console.log(`🔧 Procesando ${filePath}`);
      
      let fileContent = fs.readFileSync(filePath, 'utf8');
      let originalLength = fileContent.length;
      let replacementsCount = 0;
      
      // Aplicar cada patrón
      for (const pattern of PATTERNS) {
        // Guardar contenido antes de reemplazar
        const contentBeforeReplace = fileContent;
        
        // Aplicar reemplazo
        fileContent = fileContent.replace(pattern.search, pattern.replace);
        
        // Contar reemplazos
        const matchesCount = (contentBeforeReplace.match(pattern.search) || []).length;
        replacementsCount += matchesCount;
        
        if (matchesCount > 0) {
          console.log(`✅ Reemplazadas ${matchesCount} instancias de ${pattern.search} por ${pattern.replace}`);
        }
      }
      
      // Agregar código de interceptor al principio del archivo
      const interceptorCode = `
// =====[ FIX API INTERCEPTOR CODE ]=====
// Este código fue insertado automáticamente para corregir URLs de la API
(function(){
  const oldDom = "nextjs-gozamadrid-qrfk.onrender.com", 
        newDom = "blogs.realestategozamadrid.com";
  window.fetch = new Proxy(window.fetch, {
    apply: function(target, thisArg, args) {
      if(args[0] && typeof args[0]==="string") {
        if(args[0].includes(oldDom)) {
          let nu = args[0].replace(oldDom, newDom);
          if(nu.includes("/blogs") && !nu.includes("/api/blogs")) nu=nu.replace("/blogs","/api/blogs");
          if(nu.includes("/properties") && !nu.includes("/api/properties")) nu=nu.replace("/properties","/api/properties");
          if(nu.includes("/user/profile-image") && !nu.includes("/api/user/profile-image")) nu=nu.replace("/user/profile-image","/api/user/profile-image");
          if(nu.includes("/auth/me")) nu=nu.replace("/auth/me","/api/user/me");
          args[0] = nu;
          console.log("🛠️ [FIX COMPILER] URL corregida:", args[0]);
        }
      }
      return Reflect.apply(target, thisArg, args);
    }
  });
})();
// =====[ END FIX API INTERCEPTOR CODE ]=====
`;
      
      // Insertar el interceptor al principio del archivo
      fileContent = interceptorCode + fileContent;
      
      // Guardar el archivo modificado
      fs.writeFileSync(filePath, fileContent);
      
      console.log(`📝 Archivo ${file} procesado:`);
      console.log(`   - Tamaño original: ${originalLength} bytes`);
      console.log(`   - Reemplazos realizados: ${replacementsCount}`);
      console.log(`   - Interceptor de fetch añadido`);
      console.log(`   - Tamaño final: ${fileContent.length} bytes`);
      console.log(`   - Archivo guardado en ${filePath}`);
    }
    
    console.log('\n✨ Proceso completado. Todos los archivos JS han sido corregidos.');
    
  } catch (error) {
    console.error(`⚠️ Error durante el procesamiento:`, error);
  }
}

// Ejecutar función principal
fixCompiledJsFiles();
