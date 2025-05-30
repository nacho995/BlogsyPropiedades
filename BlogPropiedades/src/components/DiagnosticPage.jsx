import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { toast } from 'sonner';

const DiagnosticPage = () => {
  const { user } = useUser();
  const [systemInfo, setSystemInfo] = useState({});
  const [storageInfo, setStorageInfo] = useState({});
  const [errorHistory, setErrorHistory] = useState([]);
  const [renderCycleHistory, setRenderCycleHistory] = useState(null);
  const [networkStatus, setNetworkStatus] = useState({});
  const [showClearStorageModal, setShowClearStorageModal] = useState(false);
  const [infoLoaded, setInfoLoaded] = useState(false);

  // Verificar si el usuario es administrador
  const isAdmin = user && user.role === 'admin';

  // Cargar información de diagnóstico
  useEffect(() => {
    if (!isAdmin) return;

    const loadDiagnosticInfo = async () => {
      try {
        // Información del sistema
        setSystemInfo({
          userAgent: navigator.userAgent,
          language: navigator.language,
          cookiesEnabled: navigator.cookieEnabled,
          onlineStatus: navigator.onLine,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          dateTime: new Date().toISOString(),
          timezoneOffset: new Date().getTimezoneOffset(),
          referrer: document.referrer || 'Directo',
          currentUrl: window.location.href,
        });

        // Información de almacenamiento
        const localStorageUsage = calculateStorageUsage('localStorage');
        const sessionStorageUsage = calculateStorageUsage('sessionStorage');
        
        setStorageInfo({
          localStorage: {
            size: localStorageUsage.totalSize,
            itemCount: localStorageUsage.itemCount,
            keys: Object.keys(localStorage),
          },
          sessionStorage: {
            size: sessionStorageUsage.totalSize,
            itemCount: sessionStorageUsage.itemCount,
            keys: Object.keys(sessionStorage),
          },
        });

        // Historial de errores
        const savedErrors = JSON.parse(localStorage.getItem('errorHistory') || '[]');
        setErrorHistory(savedErrors);

        // Información del último ciclo de renderizado
        const lastCycle = localStorage.getItem('lastRenderCycle');
        if (lastCycle) {
          setRenderCycleHistory(JSON.parse(lastCycle));
        }

        // Estado de la red
        checkNetworkStatus();

        // Marcar que la información se ha cargado
        setInfoLoaded(true);
      } catch (error) {
        console.error("Error al cargar información de diagnóstico:", error);
        toast.error("Error al cargar información de diagnóstico");
      }
    };

    loadDiagnosticInfo();
  }, [isAdmin]);

  // Comprobar el estado de la red
  const checkNetworkStatus = async () => {
    // Determinar si estamos usando HTTPS
    const isHttps = window.location.protocol === 'https:';
    const API_DOMAIN = 'nextjs-gozamadrid-qrfk.onrender.com';
    const apiUrl = `${isHttps ? 'https' : 'http'}://${API_DOMAIN}`;
    
    // Lista de endpoints a comprobar
    const endpoints = [
      { name: 'Backend API', url: apiUrl },
      { name: 'Google (Internet)', url: 'https://www.google.com' },
    ];

    const results = {};

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(endpoint.url, { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
        });
        const endTime = Date.now();
        
        results[endpoint.name] = {
          status: 'ok',
          latency: endTime - startTime,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        results[endpoint.name] = {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    setNetworkStatus(results);
  };

  // Calcular el uso del almacenamiento
  const calculateStorageUsage = (storageType) => {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      let totalSize = 0;
      const keys = Object.keys(storage);
      
      keys.forEach(key => {
        const value = storage.getItem(key);
        totalSize += key.length + (value ? value.length : 0);
      });

      return {
        totalSize: formatBytes(totalSize),
        itemCount: keys.length
      };
    } catch (error) {
      console.error(`Error al calcular uso de ${storageType}:`, error);
      return { totalSize: 'Error', itemCount: 0 };
    }
  };

  // Formatear bytes a unidades legibles
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Limpiar datos de diagnóstico
  const clearDiagnosticData = () => {
    try {
      localStorage.removeItem('errorHistory');
      localStorage.removeItem('errorsHistory');
      localStorage.removeItem('lastRenderCycle');
      
      setErrorHistory([]);
      setRenderCycleHistory(null);
      
      toast.success("Datos de diagnóstico borrados correctamente");
    } catch (error) {
      console.error("Error al limpiar datos de diagnóstico:", error);
      toast.error("Error al limpiar datos de diagnóstico");
    }
  };

  // Limpiar todo el almacenamiento local
  const clearAllStorage = () => {
    try {
      // Guardar el email temporalmente
      const email = localStorage.getItem('email');
      
      // Limpiar todo
      localStorage.clear();
      sessionStorage.clear();
      
      // Restaurar el email
      if (email) {
        localStorage.setItem('email', email);
      }
      
      // Actualizar la información
      setStorageInfo({
        localStorage: {
          size: formatBytes(0),
          itemCount: 0,
          keys: []
        },
        sessionStorage: {
          size: formatBytes(0),
          itemCount: 0,
          keys: []
        }
      });
      
      setErrorHistory([]);
      setRenderCycleHistory(null);
      
      toast.success("Almacenamiento limpiado correctamente");
      setShowClearStorageModal(false);
    } catch (error) {
      console.error("Error al limpiar almacenamiento:", error);
      toast.error("Error al limpiar almacenamiento");
    }
  };

  // Exportar datos de diagnóstico
  const exportDiagnosticData = () => {
    try {
      const diagnosticData = {
        systemInfo,
        storageInfo,
        errorHistory,
        renderCycleHistory,
        networkStatus,
        exportDate: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(diagnosticData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const filename = `diagnostico-gozamadrid-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', filename);
      linkElement.click();
      
      toast.success("Datos de diagnóstico exportados correctamente");
    } catch (error) {
      console.error("Error al exportar datos:", error);
      toast.error("Error al exportar datos de diagnóstico");
    }
  };

  // Si el usuario no es administrador, redirigir
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-indigo-700">Panel de Diagnóstico</h1>
      
      {/* Botones de acción */}
      <div className="mb-8 flex flex-wrap gap-4">
        <button 
          onClick={checkNetworkStatus}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Comprobar red
        </button>
        
        <button 
          onClick={clearDiagnosticData}
          className="bg-amber-500 text-white py-2 px-4 rounded hover:bg-amber-600 transition"
        >
          Limpiar datos de diagnóstico
        </button>
        
        <button 
          onClick={() => setShowClearStorageModal(true)}
          className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
        >
          Limpiar almacenamiento
        </button>
        
        <button 
          onClick={exportDiagnosticData}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
        >
          Exportar diagnóstico
        </button>
      </div>
      
      {!infoLoaded ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Estado de la red */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-indigo-600">Estado de la Red</h2>
            
            {Object.keys(networkStatus).length === 0 ? (
              <p className="text-gray-500">No hay información de red disponible</p>
            ) : (
              <ul className="space-y-4">
                {Object.entries(networkStatus).map(([name, info]) => (
                  <li key={name} className="border-b pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{name}: </span>
                        <span className={info.status === 'ok' ? 'text-green-600' : 'text-red-600'}>
                          {info.status === 'ok' ? 'Conectado' : 'Error'}
                        </span>
                      </div>
                      
                      {info.status === 'ok' && (
                        <span className="text-sm text-gray-500">
                          {info.latency}ms
                        </span>
                      )}
                    </div>
                    
                    {info.status !== 'ok' && (
                      <p className="text-sm text-red-500 mt-1">{info.error}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Información del sistema */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-indigo-600">Información del Sistema</h2>
            
            <ul className="space-y-2">
              <li><span className="font-medium">Navegador:</span> {systemInfo.userAgent}</li>
              <li><span className="font-medium">Resolución:</span> {systemInfo.screenWidth}x{systemInfo.screenHeight}</li>
              <li><span className="font-medium">Idioma:</span> {systemInfo.language}</li>
              <li><span className="font-medium">Online:</span> {systemInfo.onlineStatus ? 'Sí' : 'No'}</li>
              <li><span className="font-medium">Referencia:</span> {systemInfo.referrer}</li>
              <li><span className="font-medium">Fecha/hora:</span> {new Date(systemInfo.dateTime).toLocaleString()}</li>
            </ul>
          </div>
          
          {/* Uso del almacenamiento */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-indigo-600">Almacenamiento</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">LocalStorage</h3>
                <p><span className="font-medium">Tamaño total:</span> {storageInfo.localStorage?.size}</p>
                <p><span className="font-medium">Elementos:</span> {storageInfo.localStorage?.itemCount}</p>
                
                {storageInfo.localStorage?.keys.length > 0 && (
                  <div className="mt-2">
                    <details>
                      <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800">
                        Ver claves ({storageInfo.localStorage.keys.length})
                      </summary>
                      <ul className="mt-2 pl-4 text-sm max-h-40 overflow-y-auto">
                        {storageInfo.localStorage.keys.map(key => (
                          <li key={key} className="truncate">{key}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">SessionStorage</h3>
                <p><span className="font-medium">Tamaño total:</span> {storageInfo.sessionStorage?.size}</p>
                <p><span className="font-medium">Elementos:</span> {storageInfo.sessionStorage?.itemCount}</p>
                
                {storageInfo.sessionStorage?.keys.length > 0 && (
                  <div className="mt-2">
                    <details>
                      <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800">
                        Ver claves ({storageInfo.sessionStorage.keys.length})
                      </summary>
                      <ul className="mt-2 pl-4 text-sm max-h-40 overflow-y-auto">
                        {storageInfo.sessionStorage.keys.map(key => (
                          <li key={key} className="truncate">{key}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Historial de errores */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-indigo-600">Historial de Errores</h2>
            
            {errorHistory.length === 0 ? (
              <p className="text-gray-500">No hay errores registrados</p>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {errorHistory.map((error, index) => (
                  <div key={index} className="border-l-4 border-red-500 pl-3 py-2 bg-red-50 rounded">
                    <p className="font-medium text-red-700">{error.message || 'Error desconocido'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(error.date).toLocaleString()}
                    </p>
                    <details>
                      <summary className="cursor-pointer text-red-600 hover:text-red-800 text-sm mt-1">
                        Ver stack trace
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                        {error.stack || 'No disponible'}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Ciclo de renderizado */}
          {renderCycleHistory && (
            <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-indigo-600">Último Ciclo de Renderizado Detectado</h2>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                <p className="font-medium text-yellow-700">
                  {renderCycleHistory.count} renderizados en {renderCycleHistory.timeWindow}ms
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Detectado el {new Date(renderCycleHistory.timestamp).toLocaleString()} 
                  en la URL: {renderCycleHistory.url}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Modal de confirmación para limpiar almacenamiento */}
      {showClearStorageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-4">Confirmar limpieza</h3>
            
            <p className="text-gray-700 mb-6">
              Esta acción eliminará todos los datos almacenados en localStorage y sessionStorage.
              La aplicación se reiniciará y tendrás que iniciar sesión nuevamente.
              ¿Estás seguro de continuar?
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearStorageModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              
              <button
                onClick={clearAllStorage}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sí, limpiar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticPage; 