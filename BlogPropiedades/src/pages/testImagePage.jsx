import React from 'react';
import Navbar from "../components/NavBar";
import TestProfileImage from '../components/TestProfileImage';

/**
 * Página para diagnóstico de problemas con imágenes de perfil
 */
export default function TestImagePage() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-900">
          Diagnóstico de Imágenes de Perfil
        </h1>
        <TestProfileImage />
        
        <div className="mt-10 bg-yellow-50 p-4 rounded-lg border border-yellow-200 max-w-xl mx-auto">
          <h2 className="text-lg font-bold text-yellow-800 mb-2">Notas de uso:</h2>
          <ul className="list-disc pl-5 text-yellow-700 space-y-1">
            <li>Esta herramienta es solo para fines de diagnóstico</li>
            <li>Utiliza imágenes pequeñas para realizar pruebas más rápidas</li>
            <li>Revisa la consola del navegador para información detallada</li>
            <li>La función "Verificar Estado" muestra el estado actual de la imagen en localStorage</li>
            <li>La función "Forzar Sincronización" intenta sincronizar manualmente la imagen guardada</li>
          </ul>
        </div>
      </div>
    </>
  );
} 