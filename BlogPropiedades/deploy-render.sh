#!/bin/bash

# Script para facilitar el despliegue en Render
echo "🚀 Iniciando despliegue para subir.realestategozamadrid.com"

# Construir la aplicación
echo "📦 Construyendo la aplicación..."
npm run build

# Verificar si la construcción fue exitosa
if [ $? -ne 0 ]; then
    echo "❌ Error al construir la aplicación"
    exit 1
fi

echo "✅ Construcción completada"

echo "📋 Instrucciones para Render:"
echo "1. Si no tienes un servicio en Render, crea uno nuevo de tipo 'Static Site'"
echo "2. Configura los siguientes ajustes:"
echo "   - Build Command: npm run build"
echo "   - Publish Directory: dist"
echo "   - Environment Variables:"
echo "     VITE_BACKEND_URL=https://api.realestategozamadrid.com"
echo "     VITE_API_URL=https://api.realestategozamadrid.com"
echo "     VITE_API_PUBLIC_API_URL=https://api.realestategozamadrid.com"
echo ""
echo "🔄 Para configurar el dominio personalizado en Render:"
echo "1. Ve a 'Settings' > 'Custom Domains'"
echo "2. Agrega 'subir.realestategozamadrid.com'"
echo ""
echo "🌐 Para configurar el registro DNS en Cloudflare:"
echo "- Tipo: CNAME"
echo "- Nombre: subir"
echo "- Contenido: [tu-app].onrender.com (URL de Render sin https://)"
echo "- TTL: Auto"
echo "- Proxy status: Activado (nube naranja)"
echo ""
echo "🔍 Para verificar si la configuración DNS está propagada:"
echo "dig subir.realestategozamadrid.com"

exit 0 