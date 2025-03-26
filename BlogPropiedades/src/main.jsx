import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import React, { useEffect } from "react";
import App from "./App";
import "./index.css";
import { initializeErrorHandlers, logError, handleUrlErrors } from "./utils/errorHandler";
import { initEnvValidation, getSafeEnvValue } from "./utils/validateEnv";
import { cleanupStorage, fixRenderCycleIssues } from './utils/storageCleanup';

// SCRIPT DE RECUPERACIÓN DE EMERGENCIA
// Este script debe ejecutarse antes que nada para permitir la recuperación
// en caso de errores críticos durante la inicialización
const setupEmergencyRecovery = () => {
  try {
    const script = document.createElement('script');
    script.innerHTML = `
      window.addEventListener('error', function(e) {
        if (e && e.message && e.message.includes("Cannot access") && e.message.includes("before initialization")) {
          console.error("Detectado error crítico de inicialización:", e.message);
          
          // Recargar automáticamente después de error crítico
          localStorage.setItem('lastCriticalError', JSON.stringify({
            timestamp: new Date().toISOString(),
            message: e.message
          }));
          window.location.reload();
        }
      });
    `;
    document.head.appendChild(script);
  } catch (e) {
    console.error("Error al configurar recuperación de emergencia:", e);
  }
};

// Configurar la recuperación de emergencia de inmediato
setupEmergencyRecovery();

// Limpieza preventiva de localStorage antes de inicializar la aplicación
try {
  console.log("🔍 Verificando posibles problemas de almacenamiento...");
  const cycleFixed = fixRenderCycleIssues();
  if (cycleFixed) {
    console.log("🛠️ Detectados y corregidos problemas de ciclos de renderizado");
  }
  
  cleanupStorage();
} catch (error) {
  console.error("❌ Error durante la limpieza inicial:", error);
}

// Limpiar cualquier error inicial que pueda causar problemas
try {
  // Solo limpiar errores específicos que pueden causar problemas 
  // sin interrumpir la sesión del usuario
  const errorKeys = ['env_validation', 'app_errors'];
  errorKeys.forEach(key => {
    try {
      // Verificar si hay errores guardados
      const storedData = localStorage.getItem(key);
      if (storedData) {
        const data = JSON.parse(storedData);
        // Si los datos son antiguos (más de 1 día), limpiarlos
        if (data.timestamp) {
          const timestamp = new Date(data.timestamp);
          const now = new Date();
          const diffMs = now - timestamp;
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays > 1) {
            localStorage.removeItem(key);
            console.log(`Limpiados datos antiguos de ${key}`);
          }
        }
      }
    } catch (e) {
      // Ignorar errores al limpiar datos
    }
  });
} catch (e) {
  // Ignorar errores en el proceso de limpieza
}

// Iniciar la validación del entorno con manejo de errores
let envValidation;
try {
  envValidation = initEnvValidation();
  
  // Verificar si hay errores específicos de validación de URL y recargar automáticamente
  if (!envValidation.isValid) {
    const urlErrors = envValidation.issues.filter(issue => 
      issue.includes('URL') && issue.includes('no contiene una URL válida')
    );
    
    // Usar la nueva función para manejar errores de URL
    handleUrlErrors(urlErrors);
  }
} catch (e) {
  console.error("Error al validar entorno:", e);
  envValidation = { isValid: false, issues: ["Error en la inicialización"] };
}

// Registrar valores importantes para diagnóstico
try {
  console.log(`Entorno: ${getSafeEnvValue('MODE') || 'producción'}`);
  console.log(`API URL: ${getSafeEnvValue('VITE_BACKEND_URL') || 'URL predeterminada'}`);
  console.log(`Debug Level: ${getSafeEnvValue('VITE_DEBUG_LEVEL') || 'info'}`);
} catch (e) {
  console.error("Error al registrar información de diagnóstico:", e);
}

// Componente de error para capturar errores a nivel de aplicación
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Actualizar estado para mostrar la UI de respaldo
    return { hasError: true, error, errorCount: 1 };
  }

  componentDidCatch(error, errorInfo) {
    // Registrar el error usando nuestro manejador personalizado
    try {
      logError(error, "ErrorBoundary", errorInfo);
    } catch (e) {
      console.error("Error al registrar error:", e);
    }
    
    // Actualizar el contador de errores
    this.setState(prevState => ({
      errorCount: prevState.errorCount + 1
    }));
  }

  render() {
    if (this.state.hasError) {
      // Reintento automático después de un error (solo 1 vez)
      if (this.state.errorCount === 1) {
        // Intentar reiniciar automáticamente después de 2 segundos
        setTimeout(() => {
          this.setState({ hasError: false, error: null, errorInfo: null });
        }, 2000);
      }
      
      // Puedes renderizar cualquier UI de respaldo
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">¡Algo salió mal!</h1>
            <p className="mb-4 text-gray-700">
              Lo sentimos, ha ocurrido un error inesperado. {this.state.errorCount === 1 ? "Intentando recuperar automáticamente..." : "Por favor, intenta recargar la página."}
            </p>
            <pre className="bg-gray-100 p-4 rounded text-sm text-left overflow-auto max-h-60 mb-4">
              {this.state.error && this.state.error.toString()}
            </pre>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Recargar página
              </button>
              <button
                onClick={() => {
                  // Limpiar localStorage y recargar
                  try {
                    // Guardar token y datos de perfil
                    const token = localStorage.getItem('token');
                    const profilePic = localStorage.getItem('profilePic');
                    
                    // Limpiar localStorage
                    localStorage.clear();
                    
                    // Restaurar datos importantes
                    if (token) localStorage.setItem('token', token);
                    if (profilePic) localStorage.setItem('profilePic', profilePic);
                    
                    // Recargar
                    window.location.reload();
                  } catch (e) {
                    console.error("Error al limpiar caché:", e);
                    window.location.reload();
                  }
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Limpiar caché y recargar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Desactivar React.StrictMode en producción para evitar dobles renderizados
const AppContainer = () => {
  useEffect(() => {
    try {
      // Inicializar manejadores de errores globales
      initializeErrorHandlers();
      
      // Validar nuevamente las variables de entorno en componente montado
      if (!envValidation.isValid) {
        console.warn("⚠️ Hay problemas con las variables de entorno que podrían causar errores");
      }
      
      // Verificar si hay errores registrados previamente
      try {
        const storedErrors = localStorage.getItem('app_errors');
        if (storedErrors) {
          const errors = JSON.parse(storedErrors);
          if (errors.length > 0) {
            console.log(`Se encontraron ${errors.length} errores previos almacenados`);
          }
        }
      } catch (e) {
        console.error("Error al verificar errores almacenados:", e);
      }
    } catch (error) {
      console.error("Error en AppContainer useEffect:", error);
    }
  }, []);

  return <App />;
};

// Agregar la configuración para la recuperación en caso de error fatal
// Esta configuración ayuda a resolver errores de pantalla en blanco
try {
  const isProduction = getSafeEnvValue('MODE') === 'production';
  
  if (isProduction) {
    try {
      // Agregar script de recuperación de emergencia en caso de error de JS
      const script = document.createElement('script');
      script.innerHTML = `
        window.addEventListener('error', function(e) {
          if (document.body.innerHTML === '') {
            document.body.innerHTML = '<div style="padding: 20px; text-align: center;">'+
              '<h1 style="color: #e53e3e;">Error en la aplicación</h1>'+
              '<p>Ha ocurrido un error inesperado. Por favor, intente recargar la página.</p>'+
              '<button onclick="window.location.reload()" style="background: #3182ce; color: white; '+
              'padding: 8px 16px; border: none; border-radius: 4px; margin-top: 16px; cursor: pointer;">'+
              'Recargar página</button></div>';
          }
        });
      `;
      document.head.appendChild(script);
    } catch (e) {
      console.error("Error al configurar script de recuperación:", e);
    }
  }
} catch (e) {
  console.error("Error al configurar recuperación de emergencia:", e);
}

// Renderizar la aplicación con manejo de errores
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("No se encontró el elemento root. Creando uno...");
    const newRoot = document.createElement("div");
    newRoot.id = "root";
    document.body.appendChild(newRoot);
  }

  // Verificar recargas y problemas anteriores
  const reloadCount = parseInt(localStorage.getItem('app_reload_count') || '0');
  const lastError = localStorage.getItem('app_last_error');
  
  // Si ha habido recargas previas por errores, aumentar el tiempo de espera
  const delayTime = reloadCount > 0 ? 300 + (reloadCount * 150) : 150;
  
  console.log(`🔄 Inicializando aplicación con retraso de ${delayTime}ms (recargas: ${reloadCount})`);
  
  // VERIFICACIÓN ADICIONAL DE NC
  // Este código se ejecuta justo antes de inicializar React
  try {
    // Verificar si Nc existe
    if (typeof window.Nc === 'undefined') {
      console.log('⚠️ Creando Nc antes de inicializar React');
      window.Nc = {};
    } else {
      console.log('✅ Nc ya está definido antes de inicializar React');
    }
    
    // Añadir verificación justo antes de la inicialización
    const NcCheckInterval = setInterval(() => {
      if (typeof window.Nc === 'undefined') {
        console.warn('⚠️ Nc ha desaparecido, reinicializando...');
        window.Nc = {};
      }
    }, 100);
    
    // Limpiar el intervalo después de 5 segundos
    setTimeout(() => {
      clearInterval(NcCheckInterval);
      console.log('Verificación de Nc finalizada');
    }, 5000);
  } catch (e) {
    console.error('Error al verificar Nc:', e);
  }

  if (lastError && lastError.includes('Nc')) {
    console.log('⚠️ Previamente se detectó error de inicialización de Nc, aplicando modo seguro');
    // Establecer una bandera global que será usada por el código minificado para evitar el error
    window.__SAFE_INIT = true;
  }

  // Añadir un retraso para asegurarse de que todos los módulos estén inicializados
  setTimeout(() => {
    try {
      // Envolver en try-catch para capturar errores durante la renderización
      createRoot(document.getElementById("root")).render(
        getSafeEnvValue('MODE') === 'production' ? (
          <ErrorBoundary>
            <AppContainer />
          </ErrorBoundary>
        ) : (
          <StrictMode>
            <ErrorBoundary>
              <AppContainer />
            </ErrorBoundary>
          </StrictMode>
        )
      );
      
      // Si llegamos aquí, todo salió bien, reiniciamos el contador
      if (reloadCount > 0) {
        localStorage.setItem('app_reload_count', '0');
        console.log('✅ Aplicación inicializada correctamente después de reintento');
      }
    } catch(error) {
      console.error("Error al renderizar la aplicación:", error);
      
      // Si hay un error específico, mostrar un mensaje directo
      if (error.message && error.message.includes('Nc')) {
        document.body.innerHTML = `
          <div style="padding: 20px; text-align: center; font-family: sans-serif;">
            <h2 style="color: #e53e3e;">Error al inicializar la aplicación</h2>
            <p>Estamos experimentando un problema técnico específico (Error Nc).</p>
            <p>Intentando recuperación automática...</p>
          </div>
        `;
        
        // Forzar recarga después de un momento
        setTimeout(() => {
          localStorage.setItem('app_reload_count', (reloadCount + 1).toString());
          localStorage.setItem('app_last_error', error.message);
          window.location.reload();
        }, 2000);
      }
    }
  }, delayTime);
} catch (error) {
  console.error("Error crítico en la inicialización:", error);
}