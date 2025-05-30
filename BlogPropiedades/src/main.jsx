import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
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

// Crear root y renderizar la aplicación
const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);