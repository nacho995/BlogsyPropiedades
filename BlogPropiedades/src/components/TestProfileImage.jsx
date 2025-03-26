import React, { useState, useRef } from 'react';
import { testImageUpload, checkProfileImageState, forceProfileImageSync } from '../debug-utils';

/**
 * Componente para diagnosticar problemas de subida de imágenes de perfil
 */
export default function TestProfileImage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [name, setName] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Manejar cambio en la selección de archivo
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Manejar prueba de subida de imagen
  const handleTestUpload = async () => {
    if (!selectedFile) {
      alert("Por favor selecciona un archivo de imagen primero");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const result = await testImageUpload(selectedFile, name || undefined);
      setResults(result);
    } catch (error) {
      setResults({
        success: false,
        error: error.message || "Error desconocido durante la prueba"
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar estado actual
  const handleCheckState = () => {
    const state = checkProfileImageState();
    setSyncStatus(state);
  };

  // Forzar sincronización si hay imagen en localStorage
  const handleForceSync = () => {
    const currentImage = localStorage.getItem('profilePic');
    
    if (!currentImage) {
      alert("No hay imagen en localStorage para sincronizar");
      return;
    }
    
    const success = forceProfileImageSync(currentImage);
    
    if (success) {
      setSyncStatus({
        forcedSync: true,
        timestamp: new Date().toISOString()
      });
    } else {
      setSyncStatus({
        forcedSync: false,
        error: "Error al sincronizar imagen",
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 text-blue-800">Diagnóstico de Subida de Imágenes</h2>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800 mb-2">Esta herramienta te ayuda a diagnosticar problemas con la subida de imágenes de perfil.</p>
      </div>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-gray-700 mb-2">Seleccionar imagen:</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600">
              Archivo seleccionado: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 mb-2">Nombre (opcional):</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingresa tu nombre"
          />
        </div>
      </div>
      
      <div className="flex space-x-2 mb-6">
        <button
          onClick={handleTestUpload}
          disabled={loading || !selectedFile}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? "Probando..." : "Probar Subida"}
        </button>
        
        <button
          onClick={handleCheckState}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Verificar Estado
        </button>
        
        <button
          onClick={handleForceSync}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          Forzar Sincronización
        </button>
      </div>
      
      {/* Resultados de prueba */}
      {results && (
        <div className={`p-4 rounded-md mb-6 ${results.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <h3 className={`font-bold mb-2 ${results.success ? 'text-green-800' : 'text-red-800'}`}>
            Resultado: {results.success ? 'Éxito' : 'Error'}
          </h3>
          
          {results.status && (
            <p className="mb-2">
              <span className="font-semibold">Estado:</span> {results.status} {results.statusText}
            </p>
          )}
          
          {results.duration && (
            <p className="mb-2">
              <span className="font-semibold">Duración:</span> {results.duration}ms
            </p>
          )}
          
          {results.error && (
            <p className="text-red-600 mb-2">
              <span className="font-semibold">Error:</span> {results.error}
            </p>
          )}
          
          {results.jsonData && (
            <div className="mb-2">
              <p className="font-semibold mb-1">Datos JSON:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(results.jsonData, null, 2)}
              </pre>
            </div>
          )}
          
          {results.textData && (
            <div className="mb-2">
              <p className="font-semibold mb-1">Datos de texto:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                {results.textData.length > 500 ? 
                  `${results.textData.substring(0, 500)}... (truncado)` : 
                  results.textData}
              </pre>
            </div>
          )}
        </div>
      )}
      
      {/* Estado de sincronización */}
      {syncStatus && (
        <div className="p-4 rounded-md bg-blue-50">
          <h3 className="font-bold mb-2 text-blue-800">Estado de Imagen de Perfil</h3>
          
          {syncStatus.forcedSync !== undefined && (
            <p className="mb-2">
              <span className="font-semibold">Sincronización forzada:</span> 
              {syncStatus.forcedSync ? 
                ' ✅ Exitosa' : 
                ` ❌ Fallida - ${syncStatus.error || 'Error desconocido'}`}
            </p>
          )}
          
          {syncStatus.localStorage && (
            <div className="mb-2">
              <p className="font-semibold mb-1">Estado en localStorage:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(syncStatus.localStorage, null, 2)}
              </pre>
            </div>
          )}
          
          {syncStatus.imagesMatch !== undefined && (
            <p className="mb-2">
              <span className="font-semibold">¿Coinciden las imágenes?</span> 
              {syncStatus.imagesMatch ? ' ✅ Sí' : ' ❌ No'}
            </p>
          )}
          
          {syncStatus.timestamp && (
            <p className="text-xs text-gray-500 mt-2">
              Verificado: {new Date(syncStatus.timestamp).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
} 