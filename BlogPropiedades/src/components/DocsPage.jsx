import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useAppState } from '../context/AppStateContext';

const DocsPage = () => {
  const { user } = useUser();
  const { state } = useAppState();
  const [activeSection, setActiveSection] = useState('architecture');
  
  // Verificar si el usuario es administrador
  const isAdmin = user && user.role === 'admin';
  
  // Si no es admin, redirigir a la página principal
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  // Definición de secciones de documentación
  const sections = [
    {
      id: 'architecture',
      title: 'Arquitectura',
      icon: '🏗️',
    },
    {
      id: 'components',
      title: 'Componentes',
      icon: '🧩',
    },
    {
      id: 'api',
      title: 'API',
      icon: '🔌',
    },
    {
      id: 'deployment',
      title: 'Despliegue',
      icon: '🚀',
    },
    {
      id: 'state',
      title: 'Estado',
      icon: '🔄',
    },
    {
      id: 'security',
      title: 'Seguridad',
      icon: '🔒',
    },
    {
      id: 'performance',
      title: 'Rendimiento',
      icon: '⚡',
    }
  ];
  
  // Contenido de cada sección
  const sectionContent = {
    architecture: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Arquitectura de la Aplicación</h3>
        <p>
          Esta aplicación web está construida con React y sigue una arquitectura de componentes
          modular. La aplicación se comunica con un backend REST API alojado en AWS Elastic Beanstalk.
        </p>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Capas principales</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Presentación:</strong> Componentes React organizados en páginas y componentes reutilizables
            </li>
            <li>
              <strong>Estado:</strong> Contextos de React (UserContext, AppStateContext) para gestionar el estado global
            </li>
            <li>
              <strong>Servicios:</strong> Funciones para comunicación con API y lógica de negocio
            </li>
            <li>
              <strong>Utilidades:</strong> Funciones auxiliares para operaciones comunes
            </li>
          </ul>
        </div>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Flujo de Datos</h4>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`
Usuario → Componente → Servicio API → Backend
   ↑          ↓           ↓
   └─────── Contexto ←────┘
`}
          </pre>
        </div>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Estructura de Directorios</h4>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`
src/
├── components/     # Componentes de UI
├── context/        # Contextos para estado global
├── services/       # Servicios de API y externos
├── utils/          # Utilidades generales
├── hooks/          # Hooks personalizados
└── assets/         # Recursos estáticos
`}
          </pre>
        </div>
      </div>
    ),
    
    components: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Componentes Principales</h3>
        <p>
          La aplicación está estructurada usando componentes funcionales de React con Hooks.
          A continuación se detallan los componentes más importantes:
        </p>
        
        <div className="mt-4 space-y-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="text-lg font-semibold">App.jsx</h4>
            <p className="text-sm text-gray-600">Componente raíz que configura el enrutamiento y los proveedores de contexto</p>
            <div className="mt-2">
              <p className="text-sm"><strong>Características:</strong></p>
              <ul className="list-disc pl-5 text-sm">
                <li>Configuración de rutas con React Router</li>
                <li>Detección de ciclos de renderizado</li>
                <li>Manejo de errores con ErrorBoundary</li>
                <li>Barra de estado para diagnóstico</li>
              </ul>
            </div>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="text-lg font-semibold">NavBar.jsx</h4>
            <p className="text-sm text-gray-600">Barra de navegación principal con enlaces y estado de usuario</p>
            <div className="mt-2">
              <p className="text-sm"><strong>Características:</strong></p>
              <ul className="list-disc pl-5 text-sm">
                <li>Menú responsivo para móviles</li>
                <li>Mostrar/ocultar elementos según el estado de autenticación</li>
                <li>Opciones específicas para administradores</li>
              </ul>
            </div>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="text-lg font-semibold">SignIn.jsx</h4>
            <p className="text-sm text-gray-600">Formulario de inicio de sesión con validación y manejo de errores</p>
            <div className="mt-2">
              <p className="text-sm"><strong>Características:</strong></p>
              <ul className="list-disc pl-5 text-sm">
                <li>Validación de formularios</li>
                <li>Manejo de respuestas de error de API</li>
                <li>Persistencia de sesión con localStorage</li>
              </ul>
            </div>
          </div>
          
          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="text-lg font-semibold">DiagnosticPage.jsx</h4>
            <p className="text-sm text-gray-600">Panel de diagnóstico para administradores</p>
            <div className="mt-2">
              <p className="text-sm"><strong>Características:</strong></p>
              <ul className="list-disc pl-5 text-sm">
                <li>Información del sistema y navegador</li>
                <li>Estado de la red y conexiones</li>
                <li>Registro de errores y rendimiento</li>
                <li>Herramientas para limpiar datos y exportar diagnósticos</li>
              </ul>
            </div>
          </div>
          
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="text-lg font-semibold">ProtectedRoute.jsx</h4>
            <p className="text-sm text-gray-600">Componente de orden superior para proteger rutas por autenticación</p>
            <div className="mt-2">
              <p className="text-sm"><strong>Características:</strong></p>
              <ul className="list-disc pl-5 text-sm">
                <li>Verifica estado de autenticación</li>
                <li>Redirige a login si no hay sesión</li>
                <li>Protege rutas sensibles</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
    
    api: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Integración con API</h3>
        <p>
          La aplicación se comunica con un backend REST API utilizando el cliente HTTP fetch
          con funciones de envoltorio para manejo de errores y reintentos.
        </p>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Endpoints principales</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-2 px-4 text-left">Endpoint</th>
                  <th className="py-2 px-4 text-left">Método</th>
                  <th className="py-2 px-4 text-left">Descripción</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b">
                  <td className="py-2 px-4 font-mono text-sm">/user/login</td>
                  <td className="py-2 px-4">POST</td>
                  <td className="py-2 px-4">Autenticación de usuario</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 font-mono text-sm">/blog/posts</td>
                  <td className="py-2 px-4">GET</td>
                  <td className="py-2 px-4">Obtener listado de blogs</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 font-mono text-sm">/blog/create</td>
                  <td className="py-2 px-4">POST</td>
                  <td className="py-2 px-4">Crear nueva entrada de blog</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 font-mono text-sm">/property/posts</td>
                  <td className="py-2 px-4">GET</td>
                  <td className="py-2 px-4">Obtener listado de propiedades</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 font-mono text-sm">/property/create</td>
                  <td className="py-2 px-4">POST</td>
                  <td className="py-2 px-4">Crear nueva propiedad</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 font-mono text-sm">/user/profile</td>
                  <td className="py-2 px-4">GET</td>
                  <td className="py-2 px-4">Obtener perfil de usuario</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Estructura de la función fetchAPI</h4>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`
fetchAPI(endpoint, options, retryCount)
├── 1. Verificar estado de conexión
├── 2. Comprobar caché si aplica
├── 3. Realizar petición fetch con timeout
├── 4. Manejar respuesta/errores
├── 5. Reintentar automáticamente si falla (5xx)
├── 6. Almacenar en caché si es exitosa
└── 7. Transformar respuesta según contexto
`}
          </pre>
        </div>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Mejoras en manejo de errores</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Reintento automático para errores de red y servidor</li>
            <li>Espera exponencial entre reintentos</li>
            <li>Caché de respuestas para operaciones GET</li>
            <li>Manejo de respuestas vacías o malformadas</li>
            <li>Detección de problemas de red con reconexión</li>
            <li>Mensajes de error amigables para el usuario</li>
          </ul>
        </div>
      </div>
    ),
    
    deployment: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Configuración de Despliegue</h3>
        <p>
          La aplicación está desplegada en múltiples entornos con diferentes configuraciones
          para frontend y backend.
        </p>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Arquitectura de Servidores</h4>
          <div className="bg-gray-100 p-4 rounded">
            <div className="flex flex-col items-center md:flex-row md:justify-around space-y-4 md:space-y-0 md:space-x-4">
              <div className="text-center">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-2">
                  <span className="text-2xl">🖥️</span>
                </div>
                <h5 className="font-medium">Frontend Principal</h5>
                <p className="text-sm text-gray-600">Vercel</p>
                <p className="text-xs mt-1 font-mono">realestategozamadrid.com</p>
              </div>
              
              <div className="text-center">
                <div className="inline-block p-3 bg-green-100 rounded-full mb-2">
                  <span className="text-2xl">🔄</span>
                </div>
                <h5 className="font-medium">Subdominio para Subir</h5>
                <p className="text-sm text-gray-600">Render</p>
                <p className="text-xs mt-1 font-mono">subir.realestategozamadrid.com</p>
              </div>
              
              <div className="text-center">
                <div className="inline-block p-3 bg-yellow-100 rounded-full mb-2">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h5 className="font-medium">Backend API</h5>
                <p className="text-sm text-gray-600">AWS Elastic Beanstalk</p>
                <p className="text-xs mt-1 font-mono">gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Configuración DNS (Cloudflare)</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-2 px-4 text-left">Registro</th>
                  <th className="py-2 px-4 text-left">Tipo</th>
                  <th className="py-2 px-4 text-left">Contenido</th>
                  <th className="py-2 px-4 text-left">Proxy</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b">
                  <td className="py-2 px-4">@</td>
                  <td className="py-2 px-4">CNAME</td>
                  <td className="py-2 px-4 font-mono text-sm">cname.vercel-dns.com</td>
                  <td className="py-2 px-4">Activado</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">www</td>
                  <td className="py-2 px-4">CNAME</td>
                  <td className="py-2 px-4 font-mono text-sm">cname.vercel-dns.com</td>
                  <td className="py-2 px-4">Activado</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">subir</td>
                  <td className="py-2 px-4">CNAME</td>
                  <td className="py-2 px-4 font-mono text-sm">[tu-app].onrender.com</td>
                  <td className="py-2 px-4">Activado</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">www.subir</td>
                  <td className="py-2 px-4">CNAME</td>
                  <td className="py-2 px-4 font-mono text-sm">[tu-app].onrender.com</td>
                  <td className="py-2 px-4">Activado</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">api</td>
                  <td className="py-2 px-4">CNAME</td>
                  <td className="py-2 px-4 font-mono text-sm">gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com</td>
                  <td className="py-2 px-4">Activado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Variables de Entorno</h4>
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <h5 className="font-medium text-blue-800">Desarrollo (.env)</h5>
              <pre className="bg-white p-2 rounded mt-2 text-xs overflow-x-auto">
{`VITE_BACKEND_URL=https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com
VITE_API_URL=https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com
VITE_API_PUBLIC_API_URL=https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com
JWT_SECRET=GozaMadrid`}
              </pre>
            </div>
            
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <h5 className="font-medium text-green-800">Producción (.env.production)</h5>
              <pre className="bg-white p-2 rounded mt-2 text-xs overflow-x-auto">
{`VITE_BACKEND_URL=https://www.realestategozamadrid.com
VITE_API_URL=https://www.realestategozamadrid.com
VITE_API_PUBLIC_API_URL=https://www.realestategozamadrid.com
JWT_SECRET=GozaMadrid`}
              </pre>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Documentación Adicional</h4>
          <p>
            Para más detalles sobre la configuración del subdominio y el despliegue en Render,
            consulta el archivo <code>CONFIGURACION-SUBDOMINIO.md</code> en la raíz del proyecto.
          </p>
          
          <div className="bg-yellow-50 p-4 rounded border border-yellow-300 mt-4">
            <h5 className="font-medium text-yellow-800">⚠️ Importante</h5>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-800">
              <li>Siempre construir con <code>npm run build</code> antes de desplegar</li>
              <li>Usar el script <code>deploy-render.sh</code> para despliegues en Render</li>
              <li>Verificar la configuración de DNS después de cualquier cambio</li>
              <li>Comprobar el funcionamiento de la API con la herramienta de diagnóstico</li>
            </ul>
          </div>
        </div>
      </div>
    ),
    
    state: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Gestión de Estado</h3>
        <p>
          La aplicación utiliza la API de Context de React para gestionar el estado global,
          implementando un patrón similar a Redux pero sin dependencias externas.
        </p>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Contextos Principales</h4>
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <h5 className="font-medium text-blue-800">UserContext</h5>
              <p className="text-sm mt-1">Gestiona el estado de autenticación y datos del usuario.</p>
              <p className="text-xs mt-2 text-blue-600">Ubicación: <code>src/context/UserContext.jsx</code></p>
              <div className="mt-2">
                <p className="text-sm"><strong>Estado:</strong></p>
                <ul className="list-disc pl-5 text-sm">
                  <li>user: Datos del usuario actual</li>
                  <li>loading: Estado de carga</li>
                  <li>error: Errores de autenticación</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <h5 className="font-medium text-green-800">AppStateContext</h5>
              <p className="text-sm mt-1">Gestiona el estado global de la aplicación y diagnósticos.</p>
              <p className="text-xs mt-2 text-green-600">Ubicación: <code>src/context/AppStateContext.jsx</code></p>
              <div className="mt-2">
                <p className="text-sm"><strong>Estado:</strong></p>
                <ul className="list-disc pl-5 text-sm">
                  <li>networkStatus: Estado de la conexión</li>
                  <li>memoryUsage: Uso de memoria</li>
                  <li>errorLog: Registro de errores</li>
                  <li>debugMode: Modo de depuración</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Flujo de Estado</h4>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`
Acción del Usuario
    ↓
Componente dispara acción
    ↓
Contexto procesa acción (reducer)
    ↓
Estado actualizado
    ↓
Componentes re-renderizados
`}
          </pre>
        </div>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Persistencia</h4>
          <p>
            Algunos estados críticos se persisten en localStorage para mantener la
            sesión entre recargas de página:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Token de autenticación</li>
            <li>Datos básicos de usuario</li>
            <li>Preferencias de interfaz</li>
            <li>Logs de errores para diagnóstico</li>
          </ul>
        </div>
      </div>
    ),
    
    security: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Seguridad</h3>
        <p>
          La aplicación implementa varias capas de seguridad para proteger los datos
          del usuario y prevenir vulnerabilidades comunes.
        </p>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Autenticación</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Token JWT almacenado en localStorage</li>
            <li>Expiración de sesión automática</li>
            <li>Verificación de roles para rutas protegidas</li>
            <li>Rutas protegidas con componentes de orden superior</li>
          </ul>
        </div>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Protección de Datos</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sanitización de URLs para prevenir inyecciones</li>
            <li>Validación de datos en formularios</li>
            <li>Comunicación segura con HTTPS</li>
            <li>Headers de seguridad en respuestas API</li>
          </ul>
        </div>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Mitigación de Vulnerabilidades</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-2 px-4 text-left">Vulnerabilidad</th>
                  <th className="py-2 px-4 text-left">Mitigación</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b">
                  <td className="py-2 px-4">XSS (Cross-Site Scripting)</td>
                  <td className="py-2 px-4">Sanitización de entrada/salida, React escapa automáticamente</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">CSRF (Cross-Site Request Forgery)</td>
                  <td className="py-2 px-4">Tokens en cabeceras, validación de origen</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">Inyección de código</td>
                  <td className="py-2 px-4">Validación de entradas, uso de prepared statements en backend</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">Exposición de datos sensibles</td>
                  <td className="py-2 px-4">Sanitización en logs, enmascaramiento en UI</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-6 bg-yellow-50 p-4 rounded border border-yellow-300">
          <h4 className="text-lg font-semibold mb-2 text-yellow-800">⚠️ Notas importantes</h4>
          <ul className="list-disc pl-5 space-y-1 text-yellow-800">
            <li>No almacenar secretos en el código cliente</li>
            <li>Usar variables de entorno para configuración sensible</li>
            <li>Implementar validación tanto en cliente como en servidor</li>
            <li>Minimizar el uso de bibliotecas de terceros sin auditar</li>
          </ul>
        </div>
      </div>
    ),
    
    performance: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Optimización de Rendimiento</h3>
        <p>
          La aplicación implementa varias estrategias para optimizar la carga y el rendimiento
          durante la interacción del usuario.
        </p>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Métricas Actuales</h4>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="bg-blue-50 p-3 rounded border border-blue-200 flex flex-col items-center">
              <span className="text-2xl font-bold text-blue-700">~1.2s</span>
              <span className="text-sm text-blue-600">Tiempo de carga inicial</span>
            </div>
            <div className="bg-green-50 p-3 rounded border border-green-200 flex flex-col items-center">
              <span className="text-2xl font-bold text-green-700">~320KB</span>
              <span className="text-sm text-green-600">Tamaño de bundle JS</span>
            </div>
            <div className="bg-purple-50 p-3 rounded border border-purple-200 flex flex-col items-center">
              <span className="text-2xl font-bold text-purple-700">~200ms</span>
              <span className="text-sm text-purple-600">Tiempo medio de respuesta API</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Estrategias implementadas</h4>
          <ul className="space-y-4">
            <li className="flex">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3">
                <span className="text-blue-600">1</span>
              </div>
              <div>
                <h5 className="font-medium">Optimización de imágenes</h5>
                <p className="text-sm text-gray-600">Carga diferida, tamaños responsivos, formatos optimizados (WebP)</p>
              </div>
            </li>
            <li className="flex">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3">
                <span className="text-blue-600">2</span>
              </div>
              <div>
                <h5 className="font-medium">Memorización de componentes</h5>
                <p className="text-sm text-gray-600">Uso de React.memo, useMemo y useCallback para evitar renders innecesarios</p>
              </div>
            </li>
            <li className="flex">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3">
                <span className="text-blue-600">3</span>
              </div>
              <div>
                <h5 className="font-medium">Caché de API</h5>
                <p className="text-sm text-gray-600">Respuestas almacenadas en caché según tipo de solicitud</p>
              </div>
            </li>
            <li className="flex">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3">
                <span className="text-blue-600">4</span>
              </div>
              <div>
                <h5 className="font-medium">Detección y prevención de ciclos de renderizado</h5>
                <p className="text-sm text-gray-600">Sistema para detectar y romper ciclos infinitos de renderizado</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Diagnóstico de Rendimiento</h4>
          <p className="mb-2">
            La aplicación incluye herramientas internas para diagnosticar problemas de rendimiento:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Panel de diagnóstico para administradores (<code>/diagnostico</code>)</li>
            <li>Registro de tiempos de carga y renders lentos</li>
            <li>Monitoreo de memoria y uso de recursos</li>
            <li>Registro detallado en consola en modo desarrollo</li>
          </ul>
        </div>
      </div>
    )
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2 text-indigo-700">Documentación Técnica</h1>
      <p className="text-gray-600 mb-8">
        Documentación interna para desarrolladores y administradores del sistema.
      </p>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar de navegación */}
        <aside className="md:w-64 flex-shrink-0">
          <nav className="bg-white rounded-lg shadow p-4 sticky top-4">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Contenido</h2>
            <ul className="space-y-2">
              {sections.map(section => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded flex items-center ${
                      activeSection === section.id
                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
            
            {/* Información del entorno */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 mb-2">Entorno actual</h3>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Modo: {process.env.NODE_ENV}</p>
                <p>API: {import.meta.env.VITE_API_URL ? '✅' : '❌'}</p>
                <p>Version: {import.meta.env.VITE_APP_VERSION || '1.0.0'}</p>
              </div>
            </div>
          </nav>
        </aside>
        
        {/* Contenido principal */}
        <main className="flex-1">
          <div className="bg-white rounded-lg shadow p-6">
            {sectionContent[activeSection]}
          </div>
          
          {/* Fecha de actualización */}
          <p className="text-xs text-gray-500 mt-4 text-right">
            Última actualización: {new Date().toLocaleDateString()}
          </p>
        </main>
      </div>
    </div>
  );
};

export default DocsPage; 