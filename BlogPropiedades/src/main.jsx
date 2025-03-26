import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
import "./index.css";

// Script sencillo para verificar que Nc esté definido
if (typeof window.Nc === 'undefined') {
  window.Nc = {};
  console.log('Definido Nc en main.jsx');
}

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

// Renderizar la aplicación con manejo de errores
try {
  // Asegurarnos de que existe el elemento root
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    const newRoot = document.createElement("div");
    newRoot.id = "root";
    document.body.appendChild(newRoot);
  }

  // Renderizar con un pequeño retraso para asegurar inicialización
  setTimeout(() => {
    try {
      createRoot(document.getElementById("root")).render(
        <StrictMode>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </StrictMode>
      );
    } catch(error) {
      console.error("Error al renderizar la aplicación:", error);
    }
  }, 150);
} catch (error) {
  console.error("Error crítico en la inicialización:", error);
}