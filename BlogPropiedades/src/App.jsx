import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import Navbar from './components/NavBar';
import ImageLoader from './components/ImageLoader';

import SignIn from './components/SignIn';
import BlogCreation from './components/blogCreation';
import BlogDetail from './components/BlogDetail';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

import Principal from './components/Principal';
import SeeBlogs from './components/SeeBlogs';
import SeeProperty from './components/SeeProperties';
import CambiarPerfil from './components/CambiarPerfil';
import PropertyCreation from './components/addProperties';
import PropertyDetail from './components/PropertyDetail';
import SubirPage from './components/SubirPage';
import ProtectedRoute from './components/ProtectedRoute';
import DiagnosticPage from './components/DiagnosticPage';
import DocsPage from './components/DocsPage';

// Detección de ciclos de renderizado
const RENDER_CYCLE_THRESHOLD = 10; // Número máximo de renderizados en un corto período de tiempo
const RENDER_CYCLE_WINDOW = 3000; // Ventana de tiempo en ms
let renderCount = 0;
let lastRenderTime = Date.now();
let cycleDetected = false;

// Reiniciar contador en intervalos regulares
setInterval(() => {
  renderCount = 0;
  lastRenderTime = Date.now();
  cycleDetected = false;
}, RENDER_CYCLE_WINDOW);

// Función para verificar ciclos de renderizado
function checkRenderCycle() {
  const now = Date.now();
  
  // Si estamos dentro de la ventana de tiempo
  if (now - lastRenderTime < RENDER_CYCLE_WINDOW) {
    renderCount++;
    
    // Si superamos el umbral, hay un ciclo
    if (renderCount > RENDER_CYCLE_THRESHOLD && !cycleDetected) {
      cycleDetected = true;
      console.error(`🔄 Detectado posible ciclo de renderizado: ${renderCount} renderizados en ${now - lastRenderTime}ms`);
      
      // Registrar en localStorage para diagnóstico
      try {
        const cycleInfo = {
          count: renderCount,
          timeWindow: now - lastRenderTime,
          timestamp: new Date().toISOString(),
          url: window.location.href
        };
        
        localStorage.setItem('lastRenderCycle', JSON.stringify(cycleInfo));
      } catch (e) {
        console.error("No se pudo guardar información del ciclo:", e);
      }
      
      return true;
    }
  } else {
    // Fuera de la ventana, reiniciar
    renderCount = 1;
    lastRenderTime = now;
  }
  
  return false;
}

// Componente de barra de estado de la aplicación
function StatusBar() {
  const { state } = useAppState();
  const { user } = useUser();
  const [showDetails, setShowDetails] = useState(false);
  
  // Solo mostrar en modo debug o para administradores
  if (!state.debugMode && (!user || user.role !== 'admin')) {
    return null;
  }
  
  // Determinar clases según estado de la red
  const getNetworkStatusClasses = () => {
    if (!state.networkStatus.online) {
      return 'bg-red-500 text-white';
    }
    
    if (!state.networkStatus.apiConnected) {
      return 'bg-orange-500 text-white';
    }
    
    switch (state.networkStatus.connectionQuality) {
      case 'poor':
        return 'bg-yellow-500 text-black';
      case 'fair':
        return 'bg-blue-400 text-white';
      default:
        return 'bg-green-500 text-white';
    }
  };
  
  // Determinar clases según uso de memoria
  const getMemoryStatusClasses = () => {
    switch (state.memoryUsage.usageLevel) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-green-500 text-white';
    }
  };
  
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-800 text-white text-xs border-t border-gray-700 px-2 py-1"
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex justify-between items-center">
        <div className="flex space-x-2 items-center">
          {/* Estado de red */}
          <span 
            className={`px-1 rounded flex items-center ${getNetworkStatusClasses()}`}
            title="Estado de la red"
          >
            {state.networkStatus.online ? (
              state.networkStatus.apiConnected ? '🌐 Online' : '🔌 API Desconectado'
            ) : '📶 Offline'}
          </span>
          
          {/* Estado de memoria */}
          <span 
            className={`px-1 rounded ${getMemoryStatusClasses()}`}
            title="Uso de memoria"
          >
            💾 {state.memoryUsage.approximateUsageMb || 0}MB
          </span>
        </div>
        
        <div className="flex space-x-2 items-center">
          {/* Indicador de modo */}
          {state.debugMode && (
            <span className="bg-purple-600 px-1 rounded" title="Modo depuración">
              🛠️ Debug
            </span>
          )}
          
          {/* Errores recientes */}
          {state.errorLog.length > 0 && (
            <span className="bg-red-600 px-1 rounded" title="Errores recientes">
              ⚠️ {state.errorLog.length}
            </span>
          )}
          
          {/* Tiempo de ejecución */}
          <span className="text-gray-400" title="Tiempo de ejecución">
            ⏱️ {Math.round((Date.now() - state.diagnostics.appStartTime) / 1000 / 60)}m
          </span>
        </div>
      </div>
      
      {/* Panel detallado */}
      {showDetails && (
        <div className="mt-1 p-2 bg-gray-900 rounded-md text-xs max-h-40 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <h5 className="font-bold mb-1 text-gray-400">Red</h5>
              <p>Estado: {state.networkStatus.online ? 'Conectado' : 'Desconectado'}</p>
              <p>API: {state.networkStatus.apiConnected ? 'Conectado' : 'Error'}</p>
              <p>Calidad: {state.networkStatus.connectionQuality}</p>
              {state.networkStatus.responseTime && (
                <p>Latencia: {state.networkStatus.responseTime}ms</p>
              )}
            </div>
            
            <div>
              <h5 className="font-bold mb-1 text-gray-400">Memoria</h5>
              <p>Uso: {state.memoryUsage.approximateUsageMb || 0}MB</p>
              <p>Nivel: {state.memoryUsage.usageLevel}</p>
              {state.memoryUsage.usagePercentage && (
                <p>Porcentaje: {state.memoryUsage.usagePercentage}%</p>
              )}
            </div>
            
            {state.errorLog.length > 0 && (
              <div className="col-span-2 mt-2">
                <h5 className="font-bold mb-1 text-gray-400">Errores recientes</h5>
                <ul className="pl-2 space-y-1">
                  {state.errorLog.slice(0, 3).map((error, index) => (
                    <li key={index} className="truncate">
                      {error.message || 'Error desconocido'}
                    </li>
                  ))}
                  {state.errorLog.length > 3 && (
                    <li className="text-gray-500">
                      + {state.errorLog.length - 3} más...
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            <div className="col-span-2 mt-2 text-right">
              <a 
                href="/diagnostico" 
                className="text-blue-400 hover:text-blue-300"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                Ver panel de diagnóstico
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente seguro para la aplicación que previene ciclos de renderizado
function SafeAppContainer({ children }) {
  const [hasCycle, setHasCycle] = useState(false);
  
  useEffect(() => {
    // Comprobar si hay un ciclo al montar
    if (checkRenderCycle()) {
      setHasCycle(true);
    }
    
    // Verificar si hay información de un ciclo previo
    try {
      const lastCycle = localStorage.getItem('lastRenderCycle');
      if (lastCycle) {
        const cycleInfo = JSON.parse(lastCycle);
        const timeSinceCycle = Date.now() - new Date(cycleInfo.timestamp).getTime();
        
        // Si el ciclo fue reciente (menos de 1 minuto), mostrar la pantalla de emergencia
        if (timeSinceCycle < 60000) {
          console.warn("⚠️ Ciclo de renderizado reciente detectado, mostrando pantalla de emergencia");
          setHasCycle(true);
        } else {
          // Limpiar ciclos antiguos
          localStorage.removeItem('lastRenderCycle');
        }
      }
    } catch (e) {
      console.error("Error al verificar ciclos previos:", e);
    }
  }, []);
  
  // Si se detecta un ciclo, mostrar una pantalla de emergencia
  if (hasCycle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Modo de emergencia activado
          </h2>
          
          <p className="text-gray-700 mb-4">
            Hemos detectado un problema con la aplicación. Para proteger tu experiencia, hemos activado el modo de emergencia.
          </p>
          
          <div className="bg-gray-100 p-3 rounded-md mb-4">
            <p className="text-sm text-gray-700">
              Se detectó un ciclo de renderizado que podría causar problemas de rendimiento o bloqueos.
            </p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => {
                localStorage.removeItem('lastRenderCycle');
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/login';
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Reiniciar completamente
            </button>
            
            <button 
              onClick={() => {
                setHasCycle(false);
                localStorage.removeItem('lastRenderCycle');
                renderCount = 0;
                lastRenderTime = Date.now();
                cycleDetected = false;
              }}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition"
            >
              Intentar continuar de todas formas
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return children;
}

// Componente para mostrar errores de manera amigable pero permitir continuar
function ErrorFallback({ error, resetError }) {
  const [countdown, setCountdown] = useState(5);
  const [showDetails, setShowDetails] = useState(false);
  
  // Efecto para el contador regresivo
  useEffect(() => {
    if (countdown <= 0) {
      resetError();
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, resetError]);
  
  // Almacenar el error en localStorage para diagnóstico
  useEffect(() => {
    try {
      const errorInfo = {
        message: error.message,
        stack: error.stack,
        date: new Date().toISOString(),
        url: window.location.href
      };
      
      // Guardar solo los últimos 5 errores
      const savedErrors = JSON.parse(localStorage.getItem('errorHistory') || '[]');
      savedErrors.unshift(errorInfo);
      
      if (savedErrors.length > 5) {
        savedErrors.pop();
      }
      
      localStorage.setItem('errorHistory', JSON.stringify(savedErrors));
      console.log("Error guardado en localStorage para diagnóstico");
    } catch (e) {
      console.error("No se pudo guardar el error:", e);
    }
  }, [error]);
  
  // Función para manejar la redirección forzada a login
  const handleForceLogin = () => {
    try {
      // Preservar información de diagnóstico
      const email = localStorage.getItem('email');
      const errorHistory = localStorage.getItem('errorHistory');
      
      // Limpiar todo el almacenamiento
      localStorage.clear();
      sessionStorage.clear();
      
      // Restaurar información de diagnóstico
      if (email) localStorage.setItem('email', email);
      if (errorHistory) localStorage.setItem('errorHistory', errorHistory);
      
      // Redirigir a login
      window.location.href = '/login';
    } catch (e) {
      console.error("Error al redirigir:", e);
      window.location.reload();
    }
  };
  
  // Mostrar un error más amigable
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          ¡Algo salió mal!
        </h2>
        
        <p className="text-gray-700 mb-4">
          Lo sentimos, ha ocurrido un error inesperado. Estamos intentando recuperar tu sesión.
        </p>
        
        <div className="bg-gray-100 p-3 rounded-md mb-4">
          <p className="text-sm text-gray-700 font-mono">
            {error.message || 'Error desconocido'}
          </p>
          
          {showDetails && error.stack && (
            <div className="mt-2 pt-2 border-t border-gray-300">
              <p className="text-xs text-gray-600 font-mono whitespace-pre-wrap overflow-auto max-h-32">
                {error.stack.split('\n').slice(0, 3).join('\n')}
              </p>
            </div>
          )}
          
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
          >
            {showDetails ? 'Ocultar detalles' : 'Mostrar detalles técnicos'}
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Continuando automáticamente en {countdown} segundos...
        </p>
        
        <div className="flex flex-col space-y-2">
          <button
            onClick={resetError}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Continuar ahora
          </button>
          
          <button 
            onClick={handleForceLogin}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition"
          >
            Limpiar datos y redirigir a login
          </button>
          
          <button 
            onClick={() => {
              // Recargar la página como último recurso
              window.location.reload();
            }}
            className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded hover:bg-gray-200 transition"
          >
            Recargar página
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente de Error Boundary para capturar errores en componentes hijos
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
    
    // Registrar errores para diagnóstico
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      };
      
      // Guardar en localStorage para referencia
      const errorsHistory = JSON.parse(localStorage.getItem('errorsHistory') || '[]');
      errorsHistory.unshift(errorData);
      
      // Mantener solo los últimos 5 errores
      if (errorsHistory.length > 5) {
        errorsHistory.length = 5;
      }
      
      localStorage.setItem('errorsHistory', JSON.stringify(errorsHistory));
    } catch (e) {
      console.error("No se pudo registrar el error:", e);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Componente para rutas protegidas por rol de administrador
function AdminRoute({ children }) {
  const { user } = useUser();
  
  if (!user || user.role !== 'admin') {
    // Si no es admin, redirigir a la página principal
    return <Navigate to="/" />;
  }
  
  return children;
}

function HomeRoute() {
  const { user } = useUser();
  const [hasError, setHasError] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  
  // Protección contra bucles infinitos
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    
    // Si el componente se renderiza demasiadas veces en poco tiempo
    if (renderCount > 5) {
      console.warn("⚠️ Detectado posible ciclo de renderizado en HomeRoute, forzando vista segura");
      setHasError(true);
    }
  }, []);
  
  // Si detectamos un posible bucle, mostrar un componente seguro
  if (hasError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Bienvenido a Blogs y Propiedades</h2>
          <p className="mb-4 text-gray-600">
            Hay un problema al cargar tu perfil. Puedes intentar:
          </p>
          <div className="space-y-2">
            <a href="/login" className="block w-full py-2 px-4 bg-blue-600 text-white text-center rounded hover:bg-blue-700">
              Iniciar sesión
            </a>
            <button 
              onClick={() => window.location.reload()} 
              className="block w-full py-2 px-4 bg-gray-200 text-gray-800 text-center rounded hover:bg-gray-300"
            >
              Recargar página
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Comportamiento normal si no hay error
  return user ? <Principal /> : <SignIn />;
}

function App() {
    // Verificar si hay un ciclo al renderizar App
    checkRenderCycle();
    
    return (
        <ErrorBoundary>
          <AppStateProvider>
            <SafeAppContainer>
                <UserProvider>
                    <div className="min-h-screen bg-gray-100">
                        <Toaster 
                            position="top-center"
                            reverseOrder={false}
                            gutter={8}
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    background: '#363636',
                                    color: '#fff',
                                },
                            }}
                        />
                        <BrowserRouter>
                            <ImageLoader />
                            <Navbar />
                            <Routes>
                                <Route path="/" element={<HomeRoute />} />
                                <Route path="/login" element={<SignIn />} />
                                <Route path="/crear-blog" element={<ProtectedRoute><BlogCreation /></ProtectedRoute>} />
                                <Route path="/ver-blogs" element={<SeeBlogs />} />
                                <Route path="/blog/:id" element={<BlogDetail />} />
                                <Route path="/cambiar-perfil" element={<ProtectedRoute><CambiarPerfil/></ProtectedRoute>} />
                                <Route path="/propiedades" element={<SeeProperty/>} />
                                <Route path="/add-property" element={<ProtectedRoute><PropertyCreation/></ProtectedRoute>} />
                                <Route path="/property/:id" element={<PropertyDetail/>} />
                                <Route path="/subir" element={<ProtectedRoute><SubirPage /></ProtectedRoute>} />
                                <Route path="/diagnostico" element={<AdminRoute><DiagnosticPage /></AdminRoute>} />
                                <Route path="/documentacion" element={<AdminRoute><DocsPage /></AdminRoute>} />
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                            <StatusBar />
                        </BrowserRouter>
                    </div>
                </UserProvider>
            </SafeAppContainer>
          </AppStateProvider>
        </ErrorBoundary>
    );
}

export default App;

