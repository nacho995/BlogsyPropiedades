import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import React, { useEffect } from "react";
import App from "./App";
import "./index.css";
import { initializeErrorHandlers, logError } from "./utils/errorHandler";

// Componente de error para capturar errores a nivel de aplicación
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualizar estado para mostrar la UI de respaldo
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Registrar el error usando nuestro manejador personalizado
    logError(error, "ErrorBoundary", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI de respaldo
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">¡Algo salió mal!</h1>
            <p className="mb-4 text-gray-700">
              Lo sentimos, ha ocurrido un error inesperado. Por favor, intenta recargar la página.
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
    // Inicializar manejadores de errores globales
    initializeErrorHandlers();
    
    // Registrar información del entorno para diagnóstico
    console.log(`Entorno: ${process.env.NODE_ENV}`);
    console.log(`API URL: ${import.meta.env.VITE_BACKEND_URL || 'No definida'}`);
    
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
  }, []);

  return <App />;
};

// Agregar la configuración para la recuperación en caso de error fatal
// Esta configuración ayuda a resolver errores de pantalla en blanco
if (process.env.NODE_ENV === 'production') {
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

createRoot(document.getElementById("root")).render(
  process.env.NODE_ENV === 'production' ? (
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