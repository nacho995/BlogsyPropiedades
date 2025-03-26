import React, { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, createUser } from "../services/api";
import { useUser } from "../context/UserContext";
import toast from "react-hot-toast";
import { UserContext } from '../context/UserContext';
import PropTypes from 'prop-types';

const SignIn = ({ isRegistering = false }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
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
            console.log("Usuario ya autenticado, redirigiendo a Principal...");
            
            // Usar un temporizador pequeño para evitar redirecciones inmediatas
            // que puedan causar problemas de renders
            redirectTimer = setTimeout(() => {
                if (isMounted) {
                    console.log("Redirigiendo a Principal...");
                    navigate("/");
                }
            }, 100);
            
            return () => {
                clearTimeout(redirectTimer);
                isMounted = false;
            };
        }
        
        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // MEJORA 1: Prevención temprana de múltiples envíos
        if (isSubmitting.current || loading) {
            console.log("Omitiendo nuevo envío: ya hay una solicitud en curso");
            return;
        }
        
        // MEJORA 2: Verificar si estamos en un bucle y romperlo definitivamente
        try {
            const now = new Date();
            const loginAttempts = JSON.parse(localStorage.getItem('authAttempts') || '[]');
            const recentAttempts = loginAttempts.filter(
                attempt => (now - new Date(attempt.timestamp)) < 3000 // últimos 3 segundos
            );
            
            // Si hay más de 2 intentos en 3 segundos, es un bucle
            if (recentAttempts.length > 2) {
                console.error("🛑 BUCLE DE LOGIN DETECTADO - Limpiando todo");
                // Limpiar datos de sesión para romper cualquier bucle
                localStorage.clear();
                // Forzar recarga de la página para reiniciar completamente
                window.location.reload();
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
                    } else {
                        throw new Error("No se pudo iniciar sesión con los datos proporcionados");
                    }
                } catch (loginError) {
                    console.error("Error durante login:", loginError);
                    setError(loginError.message || "Error durante la autenticación");
                    
                    toast("Error de autenticación: " + (loginError.message || "Credenciales inválidas"), {
                        icon: "❌",
                        duration: 4000
                    });
                }
            }
        } catch (err) {
            console.error("Error general durante la autenticación:", err);
            setError(err.message || "Error durante la autenticación");
        } finally {
            setLoading(false);
            // MEJORA 6: Permitir nuevos envíos con un retardo más largo
            setTimeout(() => {
                isSubmitting.current = false;
            }, 1500); // Esperar 1.5 segundos antes de permitir otro envío
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-900 to-indigo-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
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