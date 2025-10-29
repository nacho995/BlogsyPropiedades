import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { Toaster, toast } from 'sonner';
import 'react-toastify/dist/ReactToastify.css';

// Primero cargar componentes básicos y utilidades
import Navbar from './components/NavBar';
import ImageLoader from './components/ImageLoader';
import SafeRender from './components/SafeRender';

// Luego cargar componentes de páginas
import Principal from './components/Principal';
import SignIn from './components/SignIn';
import BlogCreation from './components/blogCreation';
import BlogDetail from './components/BlogDetail';
import SeeBlogs from './components/SeeBlogs';
import SeeProperty from './components/SeeProperties';
import PropertyCreation from './components/addProperties';
import PropertyDetail from './components/PropertyDetail';
import CambiarPerfil from './components/CambiarPerfil';
import SubirPage from './components/SubirPage';
import DiagnosticPage from './components/DiagnosticPage';
import NotFound from './components/NotFound';
import TestImagePage from './pages/testImagePage';
import RecoverPassword from './components/RecoverPassword';
import ResetPassword from './components/ResetPassword';
import Register from './components/Register';

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
  
  // Agregar logs para debugging
  console.log("🧭 HomeRoute render:", { 
    loading, 
    isAuthenticated, 
    hasUser: !!user,
    userEmail: user?.email 
  });
  
  // Si está cargando, mostrar un spinner
  if (loading) {
    console.log("⏳ Showing loading spinner");
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-tr from-blue-900 to-black/60">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }
  
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
  console.log('🔗 Backend URL:', import.meta.env.VITE_BACKEND_URL || 'https://nextjs-gozamadrid-qrfk.onrender.com');
  
  // Verificar si hay un ciclo al renderizar App
  checkRenderCycle();
  
  // Estado para seguimiento del rendimiento de la app
  const [appHealth, setAppHealth] = useState({
    loadStartTime: Date.now(),
    appLoaded: false,
    renderCount: 0,
    lastRenderTime: null,
    errors: []
  });
  
  // Estado para mostrar el componente de recuperación
  const [showRecovery, setShowRecovery] = useState(false);
  
  // Verificar el rendimiento de la aplicación
  useEffect(() => {
    // Marcar que la app está cargada
    setAppHealth(prev => ({
      ...prev,
      appLoaded: true,
      lastRenderTime: Date.now(),
      renderCount: prev.renderCount + 1
    }));
    
    // Sistema de detección y recuperación automática
    const healthCheck = setInterval(() => {
      // Comprobar si la aplicación está congelada
      const now = Date.now();
      const lastRender = appHealth.lastRenderTime;
      
      // Si han pasado más de 20 segundos desde el último render y ha habido errores
      if (lastRender && (now - lastRender > 20000) && (appHealth.errors.length > 0)) {
        console.error("⚠️ Aplicación posiblemente congelada - Activando recuperación");
        setShowRecovery(true);
        clearInterval(healthCheck);
      }
    }, 5000);
    
    // Capturar errores globales
    const errorHandler = (error) => {
      console.error("Capturado error global:", error);
      setAppHealth(prev => ({
        ...prev,
        errors: [...prev.errors, {
          message: error.message || "Error desconocido",
          time: Date.now()
        }]
      }));
      
      // Si hay muchos errores, mostrar recuperación
      if (appHealth.errors.length >= 5) {
        setShowRecovery(true);
      }
    };
    
    // Escuchar evento de cierre de sesión para sincronizar la aplicación
    const handleUserLogout = (event) => {
      console.log("🔐 Evento de cierre de sesión detectado en App:", event.detail?.reason || "desconocido");
      
      // Si el cierre es por token expirado, mostrar mensaje
      if (event.detail?.reason === 'token_expired') {
        toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        
        // Forzar redirección si no estamos ya en la página de login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (event.detail?.reason === 'token_invalid') {
        toast.error('Tu sesión no es válida. Por favor, inicia sesión nuevamente.');
        
        // Forzar redirección a login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    };
    
    // Evento para detectar cuando se inicia sesión
    const handleUserLogin = () => {
      console.log("🔐 Evento de inicio de sesión detectado en App");
      
      // Si estamos en la página de login, redirigir a la página principal
      if (window.location.pathname === '/login') {
        console.log("Redirigiendo a página principal después de inicio de sesión");
        window.location.href = '/';
      }
    };
    
    // Sistema para detectar errores de autenticación repetidos
    let authErrors = 0;
    const handleAuthError = () => {
      authErrors++;
      
      // Si hay muchos errores de autenticación seguidos, limpiar el estado
      if (authErrors > 3) {
        console.warn("⚠️ Múltiples errores de autenticación detectados, limpiando estado");
        try {
          // Preservar solo imagen de perfil
          const profilePic = localStorage.getItem('profilePic');
          const profilePic_local = localStorage.getItem('profilePic_local');
          
          // Limpiar localStorage
          localStorage.clear();
          
          // Restaurar imágenes
          if (profilePic) localStorage.setItem('profilePic', profilePic);
          if (profilePic_local) localStorage.setItem('profilePic_local', profilePic_local);
          
          // Redirigir a login
          window.location.href = '/login';
        } catch (e) {
          console.error("Error al limpiar estado tras errores de autenticación:", e);
        }
      }
    };
    
    // Resetear contador de errores de autenticación cada 2 minutos
    const authErrorReset = setInterval(() => {
      authErrors = 0;
    }, 120000);
    
    // Suscribirse a eventos
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', errorHandler);
    window.addEventListener('userLoggedOut', handleUserLogout);
    window.addEventListener('userLoggedIn', handleUserLogin);
    window.addEventListener('authError', handleAuthError);
    
    return () => {
      clearInterval(healthCheck);
      clearInterval(authErrorReset);
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', errorHandler);
      window.removeEventListener('userLoggedOut', handleUserLogout);
      window.removeEventListener('userLoggedIn', handleUserLogin);
      window.removeEventListener('authError', handleAuthError);
    };
  }, [appHealth.errors.length]);
  
  // Función para reiniciar la aplicación
  const handleAppReset = useCallback(() => {
    localStorage.clear();
    window.location.href = '/';
  }, []);
  
  // Componente de recuperación de emergencia
  const EmergencyRecovery = () => (
    <div className="fixed inset-0 bg-red-800 bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-700 text-center mb-4">¡Oops! Algo salió mal</h2>
        <p className="text-gray-700 mb-4">La aplicación está experimentando problemas. Por favor, elija una opción:</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            Recargar la página
          </button>
          
          <button 
            onClick={handleAppReset}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
          >
            Reiniciar aplicación (borra datos locales)
          </button>
          
          <button 
            onClick={() => setShowRecovery(false)}
            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Continuar de todos modos
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <ErrorBoundary>
      <SafeAppContainer>
        <UserProvider>
          <div className="min-h-screen bg-gray-100">
            <Toaster position="top-right" richColors />
            <BrowserRouter>
              <ImageLoader />
              <Navbar />
              <Routes>
                <Route path="/" element={<SafeRender><HomeRoute /></SafeRender>} />
                <Route path="/login" element={<SafeRender><SignIn /></SafeRender>} />
                <Route path="/register" element={<SafeRender><Register /></SafeRender>} />
                <Route path="/recover-password" element={<SafeRender><RecoverPassword /></SafeRender>} />
                <Route path="/reset-password/:token" element={<SafeRender><ResetPassword /></SafeRender>} />
                <Route path="/crear-blog" element={<ProtectedRoute><SafeRender><BlogCreation /></SafeRender></ProtectedRoute>} />
                <Route path="/ver-blogs" element={<SafeRender><SeeBlogs /></SafeRender>} />
                <Route path="/blog/:id" element={<SafeRender><BlogDetail /></SafeRender>} />
                <Route path="/cambiar-perfil" element={<ProtectedRoute><SafeRender><CambiarPerfil/></SafeRender></ProtectedRoute>} />
                <Route path="/propiedades" element={<SafeRender><SeeProperty/></SafeRender>} />
                <Route path="/add-property" element={<ProtectedRoute><SafeRender><PropertyCreation/></SafeRender></ProtectedRoute>} />
                <Route path="/property/:id" element={<SafeRender><PropertyDetail/></SafeRender>} />
                <Route path="/subir" element={<ProtectedRoute><SafeRender><SubirPage /></SafeRender></ProtectedRoute>} />
                <Route path="/diagnostico" element={<AdminRoute><SafeRender><DiagnosticPage /></SafeRender></AdminRoute>} />
                <Route path="/test-imagen" element={<ProtectedRoute><SafeRender><TestImagePage /></SafeRender></ProtectedRoute>} />
                <Route path="/not-found" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/not-found" replace />} />
              </Routes>
              
              {/* Componente de recuperación de emergencia */}
              {showRecovery && <EmergencyRecovery />}
            </BrowserRouter>
          </div>
        </UserProvider>
      </SafeAppContainer>
    </ErrorBoundary>
  );
}

export default App;

