import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Navbar from './components/NavBar';

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
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    const [isAppReady, setIsAppReady] = useState(false);
    
    useEffect(() => {
        setIsAppReady(true);
    }, []);
    
    if (!isAppReady) {
        return <div className="loading">Cargando...</div>;
    }

    return (
        <BrowserRouter>
            <UserProvider>
                <div className="App">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Principal />} />
                        <Route path="/login" element={<SignIn />} />
                        <Route path="/crear-blog" element={
                            <ProtectedRoute>
                                <BlogCreation />
                            </ProtectedRoute>
                        } />
                        <Route path="/ver-blogs" element={<SeeBlogs />} />
                        <Route path="/blog/:id" element={<BlogDetail />} />
                        <Route path="/cambiar-perfil" element={
                            <ProtectedRoute>
                                <CambiarPerfil />
                            </ProtectedRoute>
                        } />
                        <Route path="/propiedades" element={<SeeProperty/>} />
                        <Route path="/add-property" element={
                            <ProtectedRoute>
                                <PropertyCreation />
                            </ProtectedRoute>
                        } />
                        <Route path="/property/:id" element={<PropertyDetail/>} />
                    </Routes>
                    <Toaster position="top-right" />
                </div>
            </UserProvider>
        </BrowserRouter>
    );
}

export default App;

