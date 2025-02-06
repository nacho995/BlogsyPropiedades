import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { getBlogById, updateBlogPost } from "../services/api";

export default function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBlog, setEditedBlog] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const data = await getBlogById(id);
        setBlog(data);
        setEditedBlog(data);
      } catch (error) {
        console.error("Error al obtener el blog:", error);
      }
    };
    fetchBlog();
  }, [id]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const openModifiedModal = () => {
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      console.log("Datos que se enviarán a la API:", editedBlog);
      await updateBlogPost(id, editedBlog);
      setBlog(editedBlog);
      setIsEditing(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Error al guardar cambios:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "image") {
      setEditedBlog({
        ...editedBlog,
        image: { src: value }, // Ajustar si la API espera { image: { src: "URL" } }
      });
    } else {
      setEditedBlog({ ...editedBlog, [name]: value });
    }
  };

  if (!blog) {
    return <p className="text-center text-gray-500">Cargando...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-4">
        {isEditing ? (
          <input
            type="text"
            name="title"
            value={editedBlog.title}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        ) : (
          blog.title
        )}
      </h1>

      <div className="mb-4">
        <label className="block font-semibold">Descripción:</label>
        <textarea
          name="description"
          value={editedBlog.description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          readOnly={!isEditing}
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Autor:</label>
        <input
          type="text"
          name="author"
          value={editedBlog.author}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          readOnly={!isEditing}
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Categoría:</label>
        <input
          type="text"
          name="category"
          value={editedBlog.category}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          readOnly={!isEditing}
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Tiempo de lectura:</label>
        <input
          type="text"
          name="readTime"
          value={editedBlog.readTime}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          readOnly={!isEditing}
        />
      </div>

      {/* CAMPO PARA EDITAR LA IMAGEN */}
      <div className="mb-4">
        <label className="block font-semibold">URL de la Imagen:</label>
        <input
          type="text"
          name="image"
          value={editedBlog.image?.src || ""}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          readOnly={!isEditing}
        />
      </div>

      {/* PREVISUALIZACIÓN DE LA IMAGEN */}
      {editedBlog.image?.src && (
        <div className="mt-4">
          <img
            src={editedBlog.image.src}
            alt="Vista previa de la imagen"
            className="w-[20vh] h-[20vh] rounded-md object-cover"
          />
        </div>
      )}

      <div className="mt-6 flex gap-4">
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Modificar
          </button>
        ) : (
          <button
            onClick={openModifiedModal}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Guardar cambios
          </button>
        )}
      </div>

      {/* MODAL */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <Dialog.Title className="text-lg font-semibold">Confirmar modificación</Dialog.Title>
          <Dialog.Description className="mt-2">
            ¿Estás seguro de que quieres guardar los cambios?
          </Dialog.Description>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <Link to={"/blog"}
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Guardar cambios
            </Link>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
