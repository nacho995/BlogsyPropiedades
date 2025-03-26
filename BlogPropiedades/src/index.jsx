import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Envolver la renderización en un try-catch para evitar errores
const renderApp = () => {
  try {
    // Renderizar la aplicación con un pequeño retraso para evitar problemas de inicialización
    setTimeout(() => {
      try {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
          <React.StrictMode>
            <App />
          </React.StrictMode>
        );
      } catch (error) {
        console.error('Error al renderizar la aplicación:', error);
        
        // Renderizar un mensaje de error amigable
        const errorElement = document.createElement('div');
        errorElement.innerHTML = `
          <div style="padding: 20px; text-align: center; font-family: sans-serif;">
            <h2 style="color: #e53e3e;">Error al cargar la aplicación</h2>
            <p>Lo sentimos, ha ocurrido un error inesperado.</p>
            <button onclick="window.location.reload()" style="
              background-color: #3182ce;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              margin-top: 15px;
            ">Reintentar</button>
          </div>
        `;
        
        document.body.appendChild(errorElement);
      }
    }, 100);
  } catch (error) {
    console.error('Error crítico en la inicialización:', error);
  }
};

// Iniciar la aplicación
renderApp(); 