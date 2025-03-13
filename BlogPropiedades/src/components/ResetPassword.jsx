import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

export default function ResetPassword() {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    
    const navigate = useNavigate();
    
    // Validación básica del token (opcional)
    useEffect(() => {
        // Agregamos un mensaje para ayudar al debuggeo
        console.log(`Intentando validar token de recuperación: ${token}`);
        
        if (!token || token.length < 10) {
            setTokenValid(false);
            setIsError(true);
            setMessage('El enlace no es válido o ha expirado. Por favor, solicite un nuevo enlace.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validaciones básicas
        if (password !== passwordConfirm) {
            setIsError(true);
            setMessage('Las contraseñas no coinciden.');
            return;
        }
        
        if (password.length < 8) {
            setIsError(true);
            setMessage('La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        
        setIsLoading(true);
        setIsError(false);
        setMessage('');

        try {
            // Llamamos a la función de api.js
            await resetPassword(token, password, passwordConfirm);
            
            // Si llegamos aquí, el cambio fue exitoso
            setIsSuccess(true);
            setMessage('¡Su contraseña ha sido restablecida con éxito!');
            
            // Redirigimos después de 3 segundos
            setTimeout(() => {
                navigate('/signin');
            }, 3000);
            
        } catch (error) {
            console.error('Error al restablecer la contraseña:', error);
            
            setIsError(true);
            if (error.message.includes('token') || error.message.includes('expirado')) {
                setMessage('El enlace ha expirado o no es válido. Por favor, solicite un nuevo enlace.');
            } else {
                setMessage(error.message || 'Ha ocurrido un error. Por favor, inténtelo de nuevo más tarde.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-tr from-blue-900 to-black/60 min-h-screen flex flex-col justify-start">
            <h1 className="text-4xl font-bold text-center mb-8 relative mt-[25vh]">
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white">
                    Restablecer Contraseña
                </span>
            </h1>
            <div className="flex flex-col justify-center items-center">
                {!tokenValid ? (
                    <div className="flex flex-col items-center justify-center max-w-lg px-4">
                        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6">
                            <p className="font-semibold">Enlace inválido</p>
                            <p className="mt-2">{message}</p>
                        </div>
                        
                        <Link to="/recover-password">
                            <button className="bg-black text-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors duration-300">
                                Solicitar nuevo enlace
                            </button>
                        </Link>
                    </div>
                ) : isSuccess ? (
                    <div className="flex flex-col items-center justify-center max-w-lg px-4">
                        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6">
                            <p className="font-semibold">¡Contraseña restablecida!</p>
                            <p className="mt-2">Su contraseña ha sido cambiada exitosamente. Será redirigido a la página de inicio de sesión.</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col justify-center items-center w-full max-w-lg">
                        <p className="text-white text-center mb-6">
                            Ingrese su nueva contraseña
                        </p>
                        
                        <div className="relative w-full mb-4">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nueva contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 rounded-md border-2 border-gray-300"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-2"
                            >
                                {showPassword ? (
                                    <span role="img" aria-label="Ocultar">👁️</span>
                                ) : (
                                    <span role="img" aria-label="Mostrar">🙈</span>
                                )}
                            </button>
                        </div>
                        
                        <div className="relative w-full mb-4">
                            <input
                                id="passwordConfirm"
                                name="passwordConfirm"
                                type={showPasswordConfirm ? 'text' : 'password'}
                                placeholder="Confirmar contraseña"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                className="w-full p-2 rounded-md border-2 border-gray-300"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                className="absolute right-2 top-2"
                            >
                                {showPasswordConfirm ? (
                                    <span role="img" aria-label="Ocultar">👁️</span>
                                ) : (
                                    <span role="img" aria-label="Mostrar">🙈</span>
                                )}
                            </button>
                        </div>
                        
                        {message && (
                            <div className={`mb-4 text-center ${isError ? 'text-red-600' : 'text-green-500'} font-semibold`}>
                                {message}
                            </div>
                        )}
                        
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`bg-black text-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Procesando...' : 'Restablecer Contraseña'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
} 