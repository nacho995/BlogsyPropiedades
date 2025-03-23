import React, { useState, useEffect } from 'react';
import { uploadImageProperty } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const SubirPage = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si estamos en el subdominio correcto
    const hostname = window.location.hostname;
    const isSubdomain = hostname.startsWith('subir.') || import.meta.env.VITE_APP_MODE === 'upload';
    
    console.log('Hostname:', hostname);
    console.log('¿Es subdominio de subir?:', isSubdomain);
    console.log('Modo de App:', import.meta.env.VITE_APP_MODE);
    
    // Si no estamos en el modo correcto, mostrar mensaje
    if (!isSubdomain && import.meta.env.VITE_APP_MODE !== 'upload') {
      console.log('Esta página está diseñada para funcionar en subir.realestategozamadrid.com');
    }

    // Verificar autenticación
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para subir imágenes');
    }
  }, [isAuthenticated, navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }
    
    // Validar que es una imagen
    if (!selectedFile.type.startsWith('image/')) {
      setError('El archivo seleccionado no es una imagen');
      setFile(null);
      setPreview(null);
      return;
    }
    
    // Validar tamaño (máximo 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      setFile(null);
      setPreview(null);
      return;
    }
    
    setFile(selectedFile);
    setError('');
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para subir imágenes');
      return;
    }
    
    if (!file) {
      setError('Por favor, selecciona una imagen para subir');
      return;
    }
    
    if (!title.trim()) {
      setError('Por favor, ingresa un título para la imagen');
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      
      console.log('Subiendo imagen...');
      const result = await uploadImageProperty(formData);
      
      console.log('Resultado de la subida:', result);
      
      if (result && result.src) {
        setSuccess(`Imagen subida correctamente: ${result.src}`);
        
        // Copiar al portapapeles
        navigator.clipboard.writeText(result.src)
          .then(() => console.log('URL copiada al portapapeles'))
          .catch(err => console.error('Error al copiar URL:', err));
        
        // Reiniciar formulario
        setFile(null);
        setTitle('');
        setPreview(null);
      } else {
        throw new Error('No se recibió una URL válida del servidor');
      }
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      setError(`Error al subir la imagen: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Subir Imagen</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
          <div className="mt-2 text-sm">
            <p>La URL ha sido copiada al portapapeles</p>
            <p className="mt-1 font-mono bg-gray-100 p-2 rounded overflow-auto">{success.split(': ')[1]}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            Título de la imagen
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="title"
            type="text"
            placeholder="Ingresa un título descriptivo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
            Selecciona una imagen
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
          <p className="text-gray-600 text-xs mt-1">Formato: JPG, PNG, GIF - Tamaño máximo: 5MB</p>
        </div>
        
        {preview && (
          <div className="mb-6">
            <p className="block text-gray-700 text-sm font-bold mb-2">Vista previa</p>
            <img src={preview} alt="Vista previa" className="max-w-full h-auto border rounded" />
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <button
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            type="submit"
            disabled={uploading}
          >
            {uploading ? 'Subiendo...' : 'Subir Imagen'}
          </button>
        </div>
      </form>
      
      <div className="text-center text-gray-500 text-sm">
        <p>Esta herramienta está diseñada para subir imágenes al servidor.</p>
        <p>Las imágenes subidas estarán disponibles para su uso en el sitio web.</p>
      </div>
    </div>
  );
};

export default SubirPage; 