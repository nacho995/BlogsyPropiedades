import React, { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, createUser } from "../services/api";
import { useUser } from "../context/UserContext";
import toast from "react-hot-toast";
import { UserContext } from '../context/UserContext';
import PropTypes from 'prop-types';
import { detectAndPreventLoopError } from '../utils';

const SignIn = ({ isRegistering = false }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showRecover, setShowRecover] = useState(false);
    const [loadingTimeout, setLoadingTimeout] = useState(null);
    const navigate = useNavigate();
    const authAttemptCount = useRef(0);
    const isSubmitting = useRef(false);
    
    const { isAuthenticated, user, login } = useContext(UserContext);

    // Limpiar localStorage al cargar el componente para prevenir problemas
    useEffect(() => {
        // Solo limpiar datos específicos que podrían estar causando problemas
        try {
            if (localStorage.getItem('homeRouteCycleDetected')) {
                console.log("🧹 Limpiando detección de ciclos previos");
                localStorage.removeItem('homeRouteCycleDetected');
            }
            
            // Verificar si hay demasiados intentos de autenticación
            const authAttempts = JSON.parse(localStorage.getItem('authAttempts') || '[]');
            if (authAttempts.length > 5) {
                const lastAttempt = new Date(authAttempts[0].timestamp);
                const now = new Date();
                // Si han pasado menos de 2 minutos desde el último intento y hay muchos intentos
                if ((now - lastAttempt) < 120000 && authAttempts.length > 10) {
                    console.warn("⚠️ Demasiados intentos de autenticación, limpiando datos de sesión");
                    localStorage.clear();
                    // Guardar un indicador de que se realizó esta limpieza
                    localStorage.setItem('sessionCleanedAt', new Date().toISOString());
                }
            }
        } catch (e) {
            console.error("Error al limpiar localStorage:", e);
        }
    }, []);

    // Redirigir si ya está autenticado
    useEffect(() => {
        let isMounted = true;
        let redirectTimer = null;
        
        // Solo redirigir si este componente aún está montado y existe información de usuario
        if (isMounted && isAuthenticated && user) {
            console.log("Usuario ya autenticado, preparando redirección...");
            
            // Verificar si ya estamos en un bucle de redirección
            if (detectAndPreventLoopError('auth_redirect', 5000, 3)) {
                console.warn("⚠️ Posible bucle de redirección detectado, omitiendo redirección automática");
                return;
            }
            
            // Usar un temporizador pequeño para evitar redirecciones inmediatas
            // que puedan causar problemas de renders
            redirectTimer = setTimeout(() => {
                if (isMounted) {
                    console.log("Redirigiendo a Principal...");
                    navigate("/");
                }
            }, 300);
            
            return () => {
                clearTimeout(redirectTimer);
                isMounted = false;
            };
        }
        
        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, user, navigate]);

    // Temporizador de seguridad para evitar carga infinita
    useEffect(() => {
        if (loading) {
            // Si la carga dura más de 10 segundos, detenerla automáticamente
            const timeout = setTimeout(() => {
                console.error("🚨 Tiempo de carga excedido - Deteniendo");
                setLoading(false);
                setError("La aplicación tardó demasiado en responder. Por favor, intente nuevamente.");
                setShowRecover(true);
                
                // Limpiar local storage si está atascado
                if (detectAndPreventLoopError('signin_timeout', 30000, 2)) {
                    console.log("🧹 Limpiando datos de sesión por timeout repetido");
                    localStorage.removeItem('token');
                }
            }, 10000);
            
            setLoadingTimeout(timeout);
            
            return () => clearTimeout(timeout);
        } else {
            if (loadingTimeout) {
                clearTimeout(loadingTimeout);
            }
        }
    }, [loading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // MEJORA 1: Prevención temprana de múltiples envíos
        if (isSubmitting.current || loading) {
            console.log("Omitiendo nuevo envío: ya hay una solicitud en curso");
            return;
        }
        
        // MEJORA 2: Verificar si estamos en un bucle y romperlo definitivamente
        try {
            // Usar el detector de bucles
            if (detectAndPreventLoopError('login_attempts', 3000, 2)) {
                console.error("🛑 BUCLE DE LOGIN DETECTADO - Limpiando token");
                // Limpiar token para romper bucle
                localStorage.removeItem('token');
                // Mostrar mensaje de error
                setError("Demasiados intentos en poco tiempo. Por favor, espere unos segundos e intente de nuevo.");
                setLoading(false);
                isSubmitting.current = false;
                return;
            }
        } catch (e) {
            console.error("Error al verificar bucles:", e);
        }
        
        isSubmitting.current = true;
        setLoading(true);
        setError("");
        
        // MEJORA 3: Simplificar registro del intento
        try {
            const attempts = JSON.parse(localStorage.getItem('authAttempts') || '[]');
            attempts.unshift({
                timestamp: new Date().toISOString(),
                email
            });
            
            // Mantener solo los últimos 10 intentos
            if (attempts.length > 10) {
                attempts.length = 10;
            }
            
            localStorage.setItem('authAttempts', JSON.stringify(attempts));
        } catch (e) {
            console.error("Error al registrar intento:", e);
        }

        try {
            if (isRegistering) {
                if (password !== confirmPassword) {
                    setError("Las contraseñas no coinciden");
                    setLoading(false);
                    isSubmitting.current = false;
                    return;
                }

                const response = await createUser({ email, password });
                if (response) {
                    toast("Registro exitoso", {
                        icon: "✅",
                        duration: 4000
                    });
                    
                    // Intentar el login y verificar que fue exitoso
                    const loginSuccess = await login(response.token, response.user);
                    
                    if (loginSuccess) {
                        console.log("✅ Login exitoso después del registro");
                        setTimeout(() => navigate("/"), 300);
                    } else {
                        console.warn("⚠️ El registro fue exitoso pero el login falló");
                        setError("El registro fue exitoso pero hubo un problema al iniciar sesión automáticamente. Por favor, intenta iniciar sesión manualmente.");
                    }
                }
            } else {
                // MEJORA 4: Simplificar el flujo de login y manejar errores
                console.log("Intentando iniciar sesión con:", { email, password: '***' });
                
                try {
                    // Paso 1: Intentar login con la API
                    const response = await loginUser({ 
                        email: email,
                        password: password 
                    });
                    
                    // Verificar si tenemos un error de API
                    if (response.error) {
                        console.error("Error en respuesta de API:", response.message);
                        
                        // Mensajes personalizados según el tipo de error
                        if (response.message.includes("incorrecta")) {
                            setError("Contraseña incorrecta. Por favor, verifica tus credenciales.");
                        } 
                        else if (response.message.includes("no encontrado") || response.message.includes("not found")) {
                            setError("Este correo electrónico no está registrado. Por favor, regístrate primero.");
                        }
                        else if (response.status === 400) {
                            setError("Datos de inicio de sesión incorrectos. Por favor, intenta nuevamente.");
                        }
                        else {
                            setError(response.message || "Error de autenticación. Por favor, intente más tarde.");
                        }
                        
                        setLoading(false);
                        isSubmitting.current = false;
                        return;
                    }
                    
                    // Paso 2: Verificar si tenemos una respuesta válida
                    if (!response) {
                        throw new Error("No se recibió respuesta del servidor");
                    }
                    
                    // Paso 3: Intentar login en el contexto
                    let loginSuccess = false;
                    
                    if (response.token && response.user) {
                        // Caso normal: tenemos token y usuario
                        loginSuccess = await login(response.token, response.user);
                    } else if (response.token) {
                        // Caso parcial: solo tenemos token
                        const minimalUser = {
                            email,
                            name: email.split('@')[0] || "Usuario",
                            role: 'user'
                        };
                        loginSuccess = await login(response.token, minimalUser);
                    } else {
                        // No tenemos token, no podemos hacer login
                        throw new Error("La respuesta del servidor no incluye un token válido");
                    }
                    
                    // Paso 4: Redireccionar si el login fue exitoso
                    if (loginSuccess) {
                        toast("¡Inicio de sesión exitoso!", { icon: "✅", duration: 3000 });
                        // MEJORA 5: Retardo para evitar redireccionamiento inmediato
                        setTimeout(() => navigate("/"), 300);
                    }
                } catch (error) {
                    console.error("Error durante el login:", error);
                    
                    // Verificar si es un error de servidor interno
                    if (error.message && error.message.includes('500')) {
                        setError("El servidor no está disponible en este momento. Por favor, intente más tarde.");
                    } else if (error.message && error.message.includes('401')) {
                        setError("Credenciales incorrectas. Por favor, verifique su email y contraseña.");
                    } else {
                        setError(error.message || "Error al iniciar sesión. Por favor, intente de nuevo.");
                    }
                }
            }
        } catch (err) {
            console.error("Error general durante la autenticación:", err);
            setError(err.message || "Error durante la autenticación");
        } finally {
            setLoading(false);
            isSubmitting.current = false;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-amber-500 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 backdrop-blur-lg bg-white/10 p-8 rounded-xl shadow-2xl border border-white/20">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Iniciar Sesión
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        ¿No tienes una cuenta?{" "}
                        <Link
                            to="/register"
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            Regístrate aquí
                        </Link>
                    </p>
                </div>
                
                {/* ⚠️ Mensaje de Recuperación de Emergencia ⚠️ */}
                {showRecover && (
                    <div className="p-4 mb-4 bg-red-50 border-l-4 border-red-500 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">¿Problemas de carga?</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>Parece que la aplicación está teniendo problemas. Intente:</p>
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        <li>Refrescar la página</li>
                                        <li>Revisar su conexión a internet</li>
                                        <li>
                                            <button 
                                                onClick={() => {
                                                    localStorage.clear();
                                                    window.location.href = '/login';
                                                }}
                                                className="text-red-800 font-medium hover:text-red-900"
                                            >
                                                Reiniciar sesión (borrar datos)
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                        <p>{error}</p>
                    </div>
                )}
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Correo electrónico
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Correo electrónico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {isRegistering && (
                            <div>
                                <label htmlFor="confirm-password" className="sr-only">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Confirmar Contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link
                                to="/recover-password"
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

SignIn.propTypes = {
    isRegistering: PropTypes.bool,
};

export default SignIn; 