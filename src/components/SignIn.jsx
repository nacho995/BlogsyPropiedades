import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, getCurrentUser } from '../services/api';
import { UserContext } from './UserContext';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayError, setDisplayError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { setUser } = useContext(UserContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const loginResponse = await loginUser({ email, password });
            console.log('Login Response completa:', loginResponse);
            
            // Guardamos el token en localStorage
            const token = loginResponse.token;
            localStorage.setItem('token', token);
            
            // Extraemos el email del formulario como nombre temporal
            const userName = email.split('@')[0]; // Usamos la parte antes del @ como nombre
            
            // Actualizamos el contexto con el token y un nombre temporal
            setUser({
                name: userName, // Usamos el email como nombre temporal
                profilePic: '',
                token: token
            });
            
            // Intentamos obtener los datos completos del usuario
            getCurrentUser(token).then(userData => {
                console.log('Datos del usuario obtenidos:', userData);
                
                // Actualizamos el contexto con los datos completos
                setUser({
                    name: userData.name || userName,
                    profilePic: userData.profilePic && userData.profilePic.src ? userData.profilePic.src : '',
                    token: token
                });
            }).catch(error => {
                console.error('Error al obtener datos del usuario:', error);
                // Ya hemos establecido los datos básicos, así que no hacemos nada más
            });
            
            navigate('/');
        } catch (err) {
            console.error('Error en handleSubmit:', err);
            // Mostrar mensaje de error específico
            if (err.message.includes('Usuario no encontrado')) {
                setDisplayError('El correo electrónico no está registrado');
            } else if (err.message.includes('Contraseña incorrecta')) {
                setDisplayError('La contraseña es incorrecta');
            } else if (err.message.includes('conexión')) {
                setDisplayError('Error de conexión con el servidor. Intenta más tarde.');
            } else {
                setDisplayError(err.message || 'Error al iniciar sesión');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Iniciar Sesión</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Correo electrónico"
                            required
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Contraseña"
                            required
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>
                    {displayError && <p className="text-red-500 text-center">{displayError}</p>}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                        Iniciar Sesión
                    </button>
                </form>
                <div className="text-center mt-4">
                    <Link to="/register" className="text-blue-600 hover:underline">¿No tienes una cuenta? Regístrate</Link>
                    <br />
                    <Link to="/recover-password" className="text-blue-600 hover:underline">¿Olvidaste tu contraseña?</Link>
                </div>
            </div>
        </div>
    );
} 