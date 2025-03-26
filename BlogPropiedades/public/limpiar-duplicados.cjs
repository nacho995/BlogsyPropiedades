#!/usr/bin/env node
/**
 * Script para limpiar duplicados de protección TDZ
 * Uso: node limpiar-duplicados.cjs [ruta/a/index.html]
 */

const fs = require('fs');
const path = require('path');

// Función principal
function limpiarDuplicados() {
  try {
    // Obtener la ruta del HTML
    const indexPath = process.argv[2] || 'index.html';
    const fullPath = path.resolve(process.cwd(), indexPath);
    
    console.log(`🔍 Procesando archivo: ${fullPath}`);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Error: El archivo ${fullPath} no existe.`);
      console.log('Uso: node limpiar-duplicados.cjs [ruta/a/index.html]');
      process.exit(1);
    }
    
    // Crear copia de seguridad
    const backupPath = `${fullPath}.bak`;
    fs.copyFileSync(fullPath, backupPath);
    console.log(`✅ Copia de seguridad creada en: ${backupPath}`);
    
    // Leer el contenido del HTML
    let contenido = fs.readFileSync(fullPath, 'utf8');
    
    // Contar cuántas ocurrencias de scripts de protección TDZ hay
    const tdzScriptMatches = contenido.match(/SOLUCIÓN TDZ/g);
    if (!tdzScriptMatches || tdzScriptMatches.length <= 1) {
      console.log('✅ No hay duplicados que limpiar.');
      return;
    }
    
    console.log(`ℹ️ Encontrados ${tdzScriptMatches.length} scripts de protección TDZ.`);
    
    // Eliminar todos excepto el primero
    let primeraOcurrencia = true;
    
    // Reemplazar los scripts duplicados
    contenido = contenido.replace(/<script>[\s\S]*?TDZ[\s\S]*?<\/script>/gi, function(match) {
      if (primeraOcurrencia) {
        primeraOcurrencia = false;
        return match; // Mantener la primera ocurrencia
      } else {
        console.log('🗑️ Eliminando script duplicado...');
        return ''; // Eliminar duplicados
      }
    });
    
    // También limpiar cualquier script que contenga "SOLUCIÓN TDZ OPTIMIZADA"
    contenido = contenido.replace(/<script>[\s\S]*?SOLUCIÓN TDZ OPTIMIZADA[\s\S]*?<\/script>/gi, function(match) {
      if (primeraOcurrencia) {
        primeraOcurrencia = false;
        return match; // Mantener la primera ocurrencia
      } else {
        console.log('🗑️ Eliminando script de optimización duplicado...');
        return ''; // Eliminar duplicados
      }
    });
    
    // Limpiar HTML duplicado
    contenido = contenido.replace(/<!DOCTYPE html>[\s\S]*?<html[\s\S]*?<head>/gi, function(match, offset) {
      if (offset === 0) {
        return match; // Mantener la primera ocurrencia
      } else {
        console.log('🗑️ Eliminando declaración HTML duplicada...');
        return '';
      }
    });
    
    // Arreglar etiquetas head duplicadas
    contenido = contenido.replace(/<\/head>[\s\S]*?<head>/gi, function() {
      console.log('🗑️ Eliminando etiquetas <head> duplicadas...');
      return '';
    });
    
    // Arreglar cualquier HTML inválido
    contenido = contenido.replace(/<html[\s\S]*?<html/gi, '<html');
    contenido = contenido.replace(/<\/html>[\s\S]*?<\/html>/gi, '</html>');
    
    // Guardar el contenido limpio
    fs.writeFileSync(fullPath, contenido);
    
    console.log('✅ Duplicados eliminados correctamente.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar la función principal
limpiarDuplicados(); 