import React, { useState, useEffect, useContext } from "react";
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
    
    const { isAuthenticated, user, login } = useContext(UserContext);

    useEffect(() => {
        if (isAuthenticated && user) {
            navigate("/");
        }
    }, [isAuthenticated, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (isRegistering) {
                if (password !== confirmPassword) {
                    setError("Las contraseñas no coinciden");
                    setLoading(false);
                    return;
                }

                const response = await createUser({ email, password });
                if (response) {
                    try {
                        toast("Registro exitoso", {
                            icon: "✅",
                            duration: 4000
                        });
                    } catch (e) {
                        console.error("Error al mostrar notificación:", e);
                    }
                    login(response.token, response.user);
                    navigate("/");
                }
            } else {
                console.log("Intentando iniciar sesión con:", { email, password });
                const response = await loginUser({ email, password });
                
                console.log("Respuesta de inicio de sesión:", response);
                
                if (response) {
                    if (typeof response === "string" && response.trim() === "") {
                        console.warn("Respuesta de inicio de sesión vacía, intentando mantener sesión");
                        try {
                            toast("Sesión mantenida con token existente", {
                                icon: "⚠️",
                                duration: 4000
                            });
                        } catch (e) {
                            console.error("Error al mostrar notificación:", e);
                        }
                    } else {
                        try {
                            toast("¡Inicio de sesión exitoso!", {
                                icon: "✅",
                                duration: 4000
                            });
                        } catch (e) {
                            console.error("Error al mostrar notificación de éxito:", e);
                        }
                    }
                    
                    if (response.token && response.user) {
                        login(response.token, response.user);
                    } else if (response.temporaryToken) {
                        console.warn("Usando token temporal para mantener sesión básica");
                        login(response.temporaryToken, response.user || { email });
                    }
                    
                    navigate("/");
                }
            }
        } catch (err) {
            console.error("Error durante la autenticación:", err);
            setError(err.message || "Error durante la autenticación");
            try {
                toast("Error de autenticación: " + (err.message || "Credenciales inválidas"), {
                    icon: "❌",
                    duration: 4000
                });
            } catch (e) {
                console.error("Error al mostrar notificación:", e);
                alert("Error de autenticación: " + (err.message || "Credenciales inválidas"));
            }
        } finally {
            setLoading(false);
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