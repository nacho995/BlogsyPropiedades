import React, { useEffect, useState, lazy, Suspense } from 'react';
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
import ProtectedRoute from './components/ProtectedRoute';

// Componente para mostrar errores de manera amigable pero permitir continuar
function ErrorFallback({ error, resetError }) {
  const [countdown, setCountdown] = useState(5);
  
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
            onClick={() => {
              // Limpiar localStorage y recargar
              try {
                const email = localStorage.getItem('email');
                localStorage.clear();
                if (email) localStorage.setItem('email', email);
                window.location.reload();
              } catch (e) {
                window.location.reload();
              }
            }}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition"
          >
            Limpiar datos y recargar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente simple que redirecciona según la autenticación
function HomeRoute() {
  const { isAuthenticated, loading, user } = useUser();
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  const [criticalError, setCriticalError] = useState(null);
  
  // Función para reiniciar después de un error crítico
  const resetCriticalError = () => {
    console.log("🔄 Reiniciando después de error crítico");
    setCriticalError(null);
    setHasError(false);
    setErrorDetails(null);
  };
  
  // Efecto para detectar errores en la renderización
  useEffect(() => {
    const handleError = (event) => {
      console.error("🔥 Error de renderización capturado:", event.error);
      
      // Registrar el error
      setCriticalError(event.error);
      
      // Prevenir el comportamiento por defecto (página de error del navegador)
      event.preventDefault();
    };
    
    // Suscribirse a errores globales
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  // Efecto para mostrar notificación cuando se recupera la sesión
  useEffect(() => {
    const handleSessionRecovery = () => {
      toast.success('Sesión recuperada con éxito', {
        icon: '🔄',
        duration: 3000
      });
    };
    
    const handlePartialRecovery = () => {
      toast.warning('Sesión parcialmente recuperada', {
        icon: '⚠️',
        duration: 4000
      });
    };
    
    window.addEventListener('sessionRecovered', handleSessionRecovery);
    window.addEventListener('sessionPartiallyRecovered', handlePartialRecovery);
    
    return () => {
      window.removeEventListener('sessionRecovered', handleSessionRecovery);
      window.removeEventListener('sessionPartiallyRecovered', handlePartialRecovery);
    };
  }, []);
  
  // Efecto para diagnóstico - registra los valores clave para debugging
  useEffect(() => {
    console.log("🔍 HomeRoute - Estado actual:", {
      isAuthenticated: isAuthenticated,
      loading: loading,
      userExists: !!user,
      userProps: user ? Object.keys(user).join(', ') : 'N/A',
      recoveryAttempt: recoveryAttempt,
      token: localStorage.getItem('token') ? 'Presente' : 'Ausente',
      error: hasError ? (errorDetails || 'Error sin detalles') : 'Ninguno',
      criticalError: criticalError ? criticalError.message : 'Ninguno'
    });
  }, [isAuthenticated, loading, user, hasError, errorDetails, recoveryAttempt, criticalError]);
  
  // Si hay un error crítico, mostrar el componente de fallback
  if (criticalError) {
    return <ErrorFallback error={criticalError} resetError={resetCriticalError} />;
  }
  
  // Sistema de recuperación automática
  useEffect(() => {
    // Si hay errores pero estamos en proceso de recuperación, no hacer nada
    if (hasError && recoveryAttempt > 0) return;

    // Si hay un error y no hemos intentado recuperarnos, intentarlo
    if (hasError && recoveryAttempt === 0) {
      console.log("🔄 Iniciando recuperación automática - Intento 1");
      
      setRecoveryAttempt(1);
      
      // Esperar un momento y reintentar la carga de usuario
      const recoveryTimer = setTimeout(() => {
        console.log("🔄 Ejecutando recuperación...");
        
        // Intentar obtener los datos del usuario desde localStorage
        try {
          const email = localStorage.getItem('email');
          const name = localStorage.getItem('name');
          const token = localStorage.getItem('token');
          
          console.log("📋 Datos disponibles para recuperación:", { 
            email: email ? "Disponible" : "No disponible", 
            name: name ? "Disponible" : "No disponible",
            token: token ? "Disponible" : "No disponible"
          });
          
          setHasError(false);
          setErrorDetails(null);
        } catch (recoverError) {
          console.error("❌ Error durante recuperación:", recoverError);
          setErrorDetails(`Error en recuperación: ${recoverError.message}`);
        }
      }, 1500);
      
      return () => clearTimeout(recoveryTimer);
    }
  }, [hasError, recoveryAttempt]);
  
  // Timeout para detectar problemas de carga
  useEffect(() => {
    // Si no está cargando, no necesitamos el timer
    if (!loading) return;
    
    console.log("⏱️ Iniciando temporizador de detección de problemas de carga");
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("⏱️ La carga de usuario está tomando demasiado tiempo");
        setHasError(true);
        setErrorDetails("Timeout en carga de usuario");
      }
    }, 5000); // 5 segundos
    
    return () => clearTimeout(timer);
  }, [loading]);
  
  // Si hay error, mostrar una opción para ir a login directamente
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Parece que hay un problema</h2>
        <p className="text-gray-600 mb-6 text-center">
          No pudimos determinar tu estado de inicio de sesión. Puedes intentar las siguientes opciones:
        </p>
        {errorDetails && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 w-full max-w-md">
            <p className="text-yellow-800 text-sm font-mono">
              Diagnóstico: {errorDetails}
            </p>
          </div>
        )}
        <div className="space-y-4 w-full max-w-md">
          <button 
            onClick={() => window.location.href = '/login'} 
            className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
          >
            Ir a iniciar sesión
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition"
          >
            Recargar la página
          </button>
          <button 
            onClick={() => {
              try {
                // Preservar email para facilitar el inicio de sesión posterior
                const email = localStorage.getItem('email');
                localStorage.clear();
                if (email) localStorage.setItem('email', email);
                window.location.reload();
              } catch (e) {
                console.error("Error al limpiar localStorage:", e);
                alert("Error al limpiar datos. Intenta recargar manualmente.");
                window.location.reload();
              }
            }} 
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
          >
            Limpiar datos y recargar
          </button>
        </div>
      </div>
    );
  }
  
  // Si está cargando, mostrar un loader simple
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
        <p className="ml-2 text-gray-700">Cargando...</p>
      </div>
    );
  }
  
  try {
    // Verificar explícitamente el estado de autenticación
    console.log("🚀 Renderizando componente principal basado en autenticación:", isAuthenticated);
    
    if (isAuthenticated === true) {
      return <Principal />;
    } else {
      // Si no está autenticado pero hay token, podría ser un problema de sincronización
      if (localStorage.getItem('token')) {
        console.warn("⚠️ Se encontró token pero isAuthenticated=false, posible error de sincronización");
      }
      return <SignIn />;
    }
  } catch (error) {
    console.error("❌ Error al renderizar componente:", error);
    
    // Guardar el error crítico
    setCriticalError(error);
    
    // Proporcionar un componente de fallback
    return <ErrorFallback error={error} resetError={resetCriticalError} />;
  }
}

function App() {
    return (
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
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </BrowserRouter>
            </div>
        </UserProvider>
    );
}

export default App;

