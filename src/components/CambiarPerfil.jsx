import React, { useState, useEffect } from 'react';
import { updateProfile } from '../services/api'; // Asegúrate de que este endpoint esté configurado para recibir FormData
import { useUser } from "../context/UserContext";

export default function CambiarPerfil() {
  const { user, login } = useUser();
  const [name, setName] = useState(user?.name || '');
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(user?.profilePic || '');
  const [message, setMessage] = useState('');

  // Maneja el cambio del input de archivo y genera una vista previa
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log("Archivo seleccionado:", file);
    setProfilePic(file);
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      console.log("Vista previa URL generada:", objectUrl);
      setPreview(objectUrl);
    }
  };

  // Limpieza de URL de objeto cuando cambia o se desmonta
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Manejador del envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!name.trim() && !profilePic) {
      setMessage('Por favor ingresa al menos un valor para actualizar.');
      return;
    }

    // Crear objeto con los datos a actualizar
    const userData = {};
    if (name.trim() !== '') {
      userData.name = name;
    }
    if (profilePic) {
      userData.profilePic = profilePic;
    }

    try {
      // Pasar el token del usuario a la función updateProfile
      const result = await updateProfile(userData, user.token);
      console.log("Respuesta del servidor en CambiarPerfil:", result);
      
      // Verificar que los datos lleguen correctamente
      if (!result.name && !result.profilePic) {
        console.warn("La respuesta del servidor no incluye name ni profilePic:", result);
      }

      // Actualizar el estado del usuario con los nuevos datos
      login({
        token: user.token,
        name: result.name || user.name,
        profilePic: result.profilePic || user.profilePic
      });
      
      setMessage('Perfil actualizado correctamente');
    } catch (error) {
      console.error("Error detallado al actualizar el perfil:", error);
      setMessage('Hubo un error al actualizar el perfil. Intenta de nuevo.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Actualizar Perfil</h2>
      
      {message && (
        <div className={`p-4 mb-4 rounded ${message.includes('error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="profilePic" className="block text-sm font-medium text-gray-700">
            Foto de Perfil
          </label>
          <input
            type="file"
            id="profilePic"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        {preview && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
            <img 
              src={preview} 
              alt="Vista previa" 
              className="w-32 h-32 object-cover rounded-full mx-auto border-2 border-gray-300" 
            />
          </div>
        )}
        
        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Actualizar Perfil
          </button>
        </div>
      </form>
    </div>
  );
}
