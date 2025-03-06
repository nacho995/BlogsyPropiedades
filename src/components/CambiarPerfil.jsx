import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

export default function CambiarPerfil() {
  const [name, setName] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const { user, refreshUserData } = useUser();
  
  // Versión simplificada que no intenta crear vista previa
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Archivo seleccionado:", file.name);
      setProfilePic(file);
      // No crear vista previa para evitar el error
    }
  };
  
  // Manejar envío de formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name && !profilePic) {
      setError("Debes cambiar al menos un campo.");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Crear FormData
      const userData = new FormData();
      if (name) userData.append('name', name);
      if (profilePic) userData.append('profilePic', profilePic);
      
      // Enviar al servidor
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_PUBLIC_API_URL}/user/update-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: userData
      });
      
      if (!response.ok) {
        throw new Error("Error al actualizar el perfil");
      }
      
      const result = await response.json();
      console.log("Respuesta del servidor en CambiarPerfil:", result);
      
      // Guardar imagen en localStorage
      if (result.profilePic && typeof result.profilePic === 'string') {
        // Convertir URL a HTTPS
        const secureUrl = result.profilePic.replace('http://', 'https://');
        localStorage.setItem("profilePic", secureUrl);
      }
      
      // Actualizar datos de usuario
      await refreshUserData();
      
      // Mensaje y redirección
      alert("Perfil actualizado correctamente");
      navigate("/");
      
    } catch (error) {
      console.error("Error detallado al actualizar el perfil:", error);
      setError("No se pudo actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Cambiar Perfil</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="name">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Nuevo nombre"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="profilePic">
            Imagen de perfil
          </label>
          <input
            id="profilePic"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
        </div>
        
        {profilePic && (
          <div className="mb-4">
            <p className="text-gray-700 mb-2">✅ Imagen seleccionada: {profilePic.name}</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
