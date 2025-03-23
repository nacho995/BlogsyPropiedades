import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
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

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <UserProvider>
                    <ImageLoader />
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Principal />} />
                        <Route path="/login" element={<SignIn />} />
                        <Route path="/crear-blog" element={<BlogCreation />} />
                        <Route path="/ver-blogs" element={<SeeBlogs />} />
                        <Route path="/blog/:id" element={<BlogDetail />} />
                        <Route path="/cambiar-perfil" element={<CambiarPerfil/>} />
                        <Route path="/propiedades" element={<SeeProperty/>} />
                        <Route path="/add-property" element={<PropertyCreation/>} />
                        <Route path="/property/:id" element={<PropertyDetail/>} />
                        <Route path="/subir" element={
                            <ProtectedRoute>
                                <SubirPage />
                            </ProtectedRoute>
                        } />
                    </Routes>
                    <Toaster position="top-right" />
                </UserProvider>
            </div>
        </BrowserRouter>
    );
}

export default App;

