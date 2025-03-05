import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './components/UserContext';
import SignIn from './components/SignIn';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import CambiarPerfil from './components/CambiarPerfil';
import Principal from './components/Principal';
import Navbar from './components/NavBar';
import SeeBlogs from './components/SeeBlogs';
import SeeProperty from './components/SeeProperties';
import RecoverPassword from './components/RecoverPassword';
import BlogDetail from './components/BlogDetail';
import PropertyDetail from './components/PropertyDetail';
import BlogCreation from './components/blogCreation';
import PropertyCreation from './components/addProperties';


function App() {
    return (
        <UserProvider>
            <Router>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Principal />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/recover-password" element={<RecoverPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/profile" element={<CambiarPerfil />} />
                    <Route path="/blog" element={<BlogCreation />} />
                    <Route path="/propiedades" element={<PropertyCreation />} />
                    <Route path="/ver-blogs" element={<SeeBlogs />} />
                    <Route path="/ver-propiedades" element={<SeeProperty />} />
                    <Route path="/blog/:id" element={<BlogDetail />} />
                    <Route path="/property/:id" element={<PropertyDetail />} />
                </Routes>
            </Router>
        </UserProvider>
    );
}

export default App;

