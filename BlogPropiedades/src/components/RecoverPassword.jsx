import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestPasswordRecovery } from '../services/api';

export default function RecoverPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setIsError(false);
        setMessage('');

        try {
            // Verificamos que el email tenga un formato válido
            if (!validateEmail(email)) {
                setIsError(true);
                setMessage('Por favor, ingrese un correo electrónico válido.');
                setIsLoading(false);
                return;
            }

            // Usamos la función de la API para solicitar la recuperación
            await requestPasswordRecovery(email);
            
            // Si llegamos aquí, la solicitud fue exitosa
            setEmailSent(true);
            setMessage('Se ha enviado un enlace de recuperación a tu correo electrónico.');
            
        } catch (error) {
            console.error('Error al solicitar recuperación de contraseña:', error);
            setIsError(true);
            setMessage(error.message || 'Ha ocurrido un error. Por favor, inténtelo de nuevo más tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    return (
        <div className="bg-gradient-to-tr from-blue-900 to-black/60 min-h-screen flex flex-col justify-start">
            <h1 className="text-4xl font-bold text-center mb-8 relative mt-[25vh]">
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white">
                    Recuperar Contraseña
                </span>
            </h1>
            <div className="flex flex-col justify-center items-center">
                {!emailSent ? (
                    <form onSubmit={handleSubmit} className="flex flex-col justify-center items-center w-full max-w-lg">
                        <p className="text-white text-center mb-6">
                            Ingrese su correo electrónico y le enviaremos un enlace para restablecer su contraseña.
                        </p>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            className="w-full p-2 mb-4 rounded-md border-2 border-gray-300"
                            required
                        />
                        
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
                            {isLoading ? 'Enviando...' : 'Solicitar recuperación de contraseña'}
                        </button>
                        
                        <div className="mt-6 text-white text-center">
                            <Link to="/signin" className="text-yellow-400 hover:text-white">
                                Volver a Iniciar Sesión
                            </Link>
                        </div>
                    </form>
                ) : (
                    <div className="text-green-500 text-center">
                        <p>{message}</p>
                        <Link to="/signin" className="text-yellow-400 hover:text-white">Volver a Iniciar Sesión</Link>
                    </div>
                )}
            </div>
        </div>
    );
} 