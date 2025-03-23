import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import Navbar from './components/NavBar';
import ImageLoader from './components/ImageLoader';

import SignIn from './components/SignIn';
import BlogCreation from './components/blogCreation';
import BlogDetail from './components/BlogDetail';
import { Toaster } from 'react-hot-toast';

import Principal from './components/Principal';
import SeeBlogs from './components/SeeBlogs';
import SeeProperty from './components/SeeProperties';
import CambiarPerfil from './components/CambiarPerfil';
import PropertyCreation from './components/addProperties';
import PropertyDetail from './components/PropertyDetail';
import SubirPage from './components/SubirPage';
import ProtectedRoute from './components/ProtectedRoute';

// Componente simple que redirecciona según la autenticación
function HomeRoute() {
  const { isAuthenticated, loading } = useUser();
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Timeout para detectar problemas de carga
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("La carga de usuario está tomando demasiado tiempo");
        setHasError(true);
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
              localStorage.clear();
              window.location.reload();
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
    if (isAuthenticated === true) {
      return <Principal />;
    } else {
      return <SignIn />;
    }
  } catch (error) {
    console.error("Error al renderizar componente:", error);
    return <SignIn />; // En caso de error, mostrar SignIn por defecto
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

