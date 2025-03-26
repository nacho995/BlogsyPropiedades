import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import React, { Suspense, lazy } from "react";
import "./index.css";

// Solución para errores TDZ (Temporal Dead Zone)
const y = {};
const wi = {};
const Fp = {};
const Nc = {};

// Script sencillo para verificar que Nc esté definido
if (typeof window.Nc === 'undefined') {
  window.Nc = {};
  console.log('Definido Nc en main.jsx');
}

// Importar App con lazy loading
const App = lazy(() => import("./App"));

// Componente límite para capturar errores
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error en aplicación:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">¡Algo salió mal!</h1>
            <p className="mb-4 text-gray-700">
              Lo sentimos, ha ocurrido un error inesperado.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Componente de carga para mostrar mientras se carga la aplicación
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto"></div>
      <p className="mt-4 text-white text-xl">Cargando aplicación...</p>
    </div>
  </div>
);

// Función para retrasar el renderizado para asegurar que todo esté cargado
const initializeApp = () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("No se encontró el elemento root");
  
  const root = createRoot(rootElement);
  
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <App />
        </Suspense>
      </ErrorBoundary>
    </StrictMode>
  );
};

// Añadir un pequeño retraso antes de inicializar para evitar accesos a variables no inicializadas
setTimeout(initializeApp, 100);