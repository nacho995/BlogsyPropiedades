import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import React, { useEffect } from "react";
import App from "./App";
import "./index.css";
import { initializeErrorHandlers, logError } from "./utils/errorHandler";
import { initEnvValidation, getSafeEnvValue } from "./utils/validateEnv";

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
} catch (e) {
  console.error("Error fatal al renderizar la aplicación:", e);
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1 style="color: #e53e3e;">Error fatal en la aplicación</h1>
      <p>No se pudo inicializar la aplicación. Por favor, intente recargar la página.</p>
      <button onclick="window.location.reload()" style="background: #3182ce; color: white; 
      padding: 8px 16px; border: none; border-radius: 4px; margin-top: 16px; cursor: pointer;">
      Recargar página</button>
    </div>
  `;
}