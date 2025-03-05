import React, { useState, useEffect, useContext } from 'react';
import { updateProfile } from '../services/api'; // Asegúrate de que este endpoint esté configurado para recibir FormData
import { UserContext } from './UserContext';


export default function CambiarPerfil() {
  const { user, setUser } = useContext(UserContext);
  const [name, setName] = useState(user.name || '');
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(user.profilePic || '');
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

      // En lugar de pasar una función, pasamos directamente el objeto
      const newUserData = {
        ...user, // Mantener el token y otros datos existentes
        name: result.name || user.name,
        profilePic: result.profilePic || user.profilePic
      };
      
      console.log("Datos a actualizar:", newUserData);
      setUser(newUserData);
      
      // Verificar el localStorage después de la actualización
      setTimeout(() => {
        console.log("localStorage después de actualizar:", {
          name: localStorage.getItem('name'),
          profilePic: localStorage.getItem('profilePic'),
          token: localStorage.getItem('token')
        });
      }, 100);

      setMessage('Perfil actualizado correctamente');
    } catch (error) {
      console.error("Error detallado al actualizar el perfil:", error);
      setMessage('Hubo un error al actualizar el perfil. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-black to-amarillo p-4">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Cambiar Perfil</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre (opcional)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Ingresa tu nuevo nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="profilePic" className="block text-sm font-medium text-gray-700">
              Foto de Perfil (opcional)
            </label>
            <input
              type="file"
              id="profilePic"
              name="profilePic"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full"
            />
            {preview && (
              <img
                src={preview}
                alt="Vista previa"
                className="mt-2 h-20 w-20 rounded-full object-cover"
              />
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-2 px-4 rounded hover:bg-amarillo hover:text-black transition-colors duration-300"
          >
            Guardar Cambios
          </button>
          {message && <p className="text-center text-red-600">{message}</p>}
        </form>
      </div>
    </div>
  );
}
