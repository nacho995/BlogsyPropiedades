import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import Navbar from './components/NavBar';
import ImageLoader from './components/ImageLoader';
import ErrorBoundary from './components/ErrorBoundary';

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
  
  // Si está cargando, mostrar un loader simple
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
        <p className="ml-2 text-gray-700">Cargando...</p>
      </div>
    );
  }
  
  // Redireccionar según el estado de autenticación
  return isAuthenticated ? <Principal /> : <SignIn />;
}

function App() {
    return (
        <ErrorBoundary>
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
                            <Route path="/login" element={<HomeRoute />} />
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
        </ErrorBoundary>
    );
}

export default App;

