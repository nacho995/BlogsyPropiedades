import React, { useEffect, useState, lazy, Suspense, useRef, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
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
import DiagnosticPage from './components/DiagnosticPage';

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
    this.state = { 
      hasError: false, 
      error: null,
      lastErrorTime: 0, // Nuevo: para evitar capturar errores demasiado rápido
      errorCount: 0     // Nuevo: contar errores repetidos
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
    
    // Evitar capturar errores demasiado rápido (posible bucle)
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;
    
    this.setState(prevState => ({
      lastErrorTime: now,
      errorCount: prevState.errorCount + 1
    }));
    
    // Si hay muchos errores en poco tiempo, podría ser un bucle
    if (timeSinceLastError < 1000 && this.state.errorCount > 3) {
      console.warn("⚠️ Posible bucle de errores detectado. Intentando recuperación profunda...");
      try {
        // Intentar limpiar datos locales que podrían estar corruptos
        localStorage.removeItem('token');
        localStorage.removeItem('tempToken');
        localStorage.removeItem('profilePic');
        localStorage.removeItem('lastRenderCycle');
        localStorage.removeItem('user');
        
        // Registrar esta acción para diagnóstico
        localStorage.setItem('errorRecoveryAttempt', JSON.stringify({
          timestamp: new Date().toISOString(),
          errorCount: this.state.errorCount,
          errorMessage: error.message
        }));
        
        console.log("🧹 Datos potencialmente problemáticos eliminados");
      } catch (cleanupError) {
        console.error("Error durante la limpieza de emergencia:", cleanupError);
      }
    }
    
    // Registrar errores para diagnóstico
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href, // Añadir URL para mayor contexto
        userAgent: navigator.userAgent // Añadir información del navegador
      };
      
      // Guardar en localStorage para referencia
      const errorsHistory = JSON.parse(localStorage.getItem('errorsHistory') || '[]');
      errorsHistory.unshift(errorData);
      
      // Mantener solo los últimos 5 errores
      if (errorsHistory.length > 5) {
        errorsHistory.length = 5;
      }
      
      localStorage.setItem('errorsHistory', JSON.stringify(errorsHistory));
      console.log("Error registrado en localStorage para diagnóstico");
    } catch (e) {
      console.error("No se pudo registrar el error:", e);
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: null 
    });
  }

  render() {
    if (this.state.hasError) {
      // Si hay demasiados errores en poco tiempo, mostrar una alternativa más simple
      if (this.state.errorCount > 5 && (Date.now() - this.state.lastErrorTime < 5000)) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4 text-red-600">Error persistente detectado</h2>
              <p className="mb-4 text-gray-700">
                Estamos experimentando problemas técnicos. Por favor, intenta una de estas opciones:
              </p>
              <div className="space-y-3">
                <a 
                  href="/login" 
                  className="block w-full py-2 px-4 bg-blue-600 text-white text-center rounded hover:bg-blue-700"
                >
                  Ir a inicio de sesión
                </a>
                <button 
                  onClick={() => {
                    // Limpieza profunda y recarga
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                  className="block w-full py-2 px-4 bg-red-600 text-white text-center rounded hover:bg-red-700"
                >
                  Reinicio de emergencia
                </button>
              </div>
            </div>
          </div>
        );
      }
      
      // Error normal, mostrar el ErrorFallback
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
  const { user, isAuthenticated, loading } = useUser();
  const [hasError, setHasError] = useState(false);
  const renderCountRef = useRef(0);
  const [forcedComponent, setForcedComponent] = useState(null);
  
  // Detectar bucles de renderizado
  useEffect(() => {
    renderCountRef.current += 1;
    
    if (renderCountRef.current > 10) {
      console.warn(`⚠️ Posible ciclo de renderizado en HomeRoute: ${renderCountRef.current} renderizados`);
      
      // Registrar para diagnóstico
      try {
        localStorage.setItem('homeRouteCycleDetected', JSON.stringify({
          timestamp: new Date().toISOString(),
          renderCount: renderCountRef.current
        }));
      } catch (e) {
        console.error("Error al registrar ciclo:", e);
      }
      
      // Forzar una decisión para romper el ciclo
      if (!forcedComponent) {
        console.log("🛑 Rompiendo ciclo de renderizado forzando mostrar SignIn");
        setHasError(true);
        setForcedComponent("SignIn");
      }
    }
    
    return () => {
      // No reseteamos el contador para poder detectar ciclos entre montados y desmontados
    };
  });
  
  // Comprobar si hay problemas de protocolo (HTTP vs HTTPS)
  useEffect(() => {
    try {
      // URL de API actualizada para usar el protocolo correcto
      const isHttps = window.location.protocol === 'https:';
      const API_DOMAIN = 'gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
      const apiUrl = `${isHttps ? 'https' : 'http'}://${API_DOMAIN}`;
      
      console.log(`🌐 App usando API en: ${apiUrl}`);
      
      // Guardar la URL definitiva en localStorage para otros componentes
      localStorage.setItem('definitive_api_url', apiUrl);
      
      // Limpiar cualquier aviso de conflicto de protocolo
      localStorage.removeItem('protocolMismatch');
      
      // Escuchar el evento personalizado de detección de bucles de login
      const handleLoginLoopDetected = () => {
        console.error('⚠️ Se ha detectado un bucle de login, forzando reinicio de la aplicación');
        setForcedComponent('SignIn');
        setHasError(true);
        
        // Limpiar localStorage para romper el bucle
        try {
          // Elementos a preservar
          const profilePic = localStorage.getItem('profilePic');
          const profilePic_local = localStorage.getItem('profilePic_local');
          const profilePic_base64 = localStorage.getItem('profilePic_base64');
          
          // Limpiar todo
          localStorage.clear();
          
          // Restaurar elementos preservados
          if (profilePic) localStorage.setItem('profilePic', profilePic);
          if (profilePic_local) localStorage.setItem('profilePic_local', profilePic_local);
          if (profilePic_base64) localStorage.setItem('profilePic_base64', profilePic_base64);
          
          // Marcar que hubo un reinicio
          localStorage.setItem('appRestarted', 'true');
        } catch (e) {
          console.error('Error al limpiar localStorage:', e);
        }
      };
      
      window.addEventListener('loginLoopDetected', handleLoginLoopDetected);
      
      // Limpiar listener
      return () => {
        window.removeEventListener('loginLoopDetected', handleLoginLoopDetected);
      };
    } catch (error) {
      console.error("Error al verificar protocolos:", error);
    }
  }, []);
  
  // Si hay un error o hemos detectado un ciclo, mostrar SignIn
  if (hasError || forcedComponent === "SignIn") {
    console.log("🚨 Mostrando SignIn debido a error o ciclo detectado");
    return <SignIn />;
  }
  
  // Si está cargando, mostrar un spinner
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-tr from-blue-900 to-black/60">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }
  
  // Verificar si hay un bucle de redirección conocido
  const redirectLoop = localStorage.getItem('redirectLoop') === 'true';
  if (redirectLoop) {
    console.log("🛑 Bucle de redirección detectado, mostrando Principal sin verificar autenticación");
    localStorage.removeItem('redirectLoop');
    return <Principal />;
  }
  
  // Decisión normal basada en autenticación
  console.log("🧭 Decidiendo ruta:", { autenticado: isAuthenticated, usuario: !!user });
  
  // Si está autenticado y hay un usuario, mostrar Principal
  if (isAuthenticated && user) {
    console.log("✅ Usuario autenticado, mostrando Principal");
    return <Principal />;
  }
  
  // De lo contrario, mostrar SignIn
  console.log("🔒 Usuario no autenticado, mostrando SignIn");
  return <SignIn />;
}

// Redefinir ProtectedRoute como una función dentro de App.jsx
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useUser();
  
  // Si está cargando, mostrar un spinner
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }
  
  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    // Para evitar bucles, verificar si hay demasiados redireccionamientos
    try {
      const redirects = localStorage.getItem('authRedirects') || '0';
      const redirectCount = parseInt(redirects, 10) + 1;
      localStorage.setItem('authRedirects', redirectCount.toString());
      
      if (redirectCount > 3) {
        console.warn(`⚠️ Demasiados redireccionamientos (${redirectCount}), mostrando página de login directamente`);
        localStorage.setItem('redirectLoop', 'true');
        localStorage.removeItem('authRedirects');
        return <SignIn />;
      }
      
      // Después de 5 segundos, resetear el contador para permitir futuros intentos
      setTimeout(() => {
        localStorage.removeItem('authRedirects');
      }, 5000);
    } catch (e) {
      console.error("Error al manejar redireccionamiento:", e);
    }
    
    return <Navigate to="/login" />;
  }
  
  // Resetear contador de redirecciones 
  localStorage.removeItem('authRedirects');
  
  // Si está autenticado, mostrar el componente hijo
  return children;
}

function App() {
    // Verificar si hay un ciclo al renderizar App
    checkRenderCycle();
    
    return (
        <ErrorBoundary>
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
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </BrowserRouter>
                    </div>
                </UserProvider>
            </SafeAppContainer>
        </ErrorBoundary>
    );
}

export default App;

