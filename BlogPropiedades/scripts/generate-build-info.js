// Script para generar información de compilación
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener información del package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Crear información de compilación
const buildInfo = {
  version: packageJson.version,
  name: packageJson.name,
  buildDate: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  apiEndpoint: process.env.VITE_API_URL || 'No definido',
  buildNumber: process.env.BUILD_NUMBER || Date.now().toString(),
  commitHash: process.env.COMMIT_HASH || 'development'
};

// Guardar en archivo para referencia
const buildInfoPath = path.join(__dirname, '..', 'public', 'build-info.json');
fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

// También exponer como variables de entorno para Vite
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = `
# Este archivo es generado automáticamente por el script prebuild
VITE_APP_VERSION=${packageJson.version}
VITE_APP_BUILD_DATE=${buildInfo.buildDate}
VITE_APP_BUILD_NUMBER=${buildInfo.buildNumber}
VITE_APP_ENVIRONMENT=${buildInfo.environment}
`;

fs.writeFileSync(envPath, envContent);

console.log('✅ Información de compilación generada con éxito');
console.log(buildInfo); 