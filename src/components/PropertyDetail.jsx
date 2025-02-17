"use client";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { getPropertyById, updatePropertyPost } from "../services/api";

export default function PropertyDetail() {
    const { id } = useParams();
    const [property, setProperty] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedProperty, setEditedProperty] = useState({});
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const data = await getPropertyById(id);
                setProperty(data);
                setEditedProperty(data);
            } catch (error) {
                console.error("Error al obtener la propiedad:", error);
            }
        };
        fetchProperty();
    }, [id]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const openModifiedModal = () => {
        setIsOpen(true);
    };

    const handleSave = async () => {
        try {
            console.log("Datos que se enviarán a la API:", editedProperty);
            await updatePropertyPost(id, editedProperty);
            setProperty(editedProperty);
            setIsEditing(false);
            setIsOpen(false);
        } catch (error) {
            console.error("Error al guardar cambios:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Si se edita la imagen, actualizamos el primer elemento del array images
        if (name === "image") {
            const images = editedProperty.images && Array.isArray(editedProperty.images)
                ? [...editedProperty.images]
                : [];
            if (images.length > 0) {
                images[0] = { src: value, alt: "Imagen de previsualización" };
            } else {
                images.push({ src: value, alt: "Imagen de previsualización" });
            }
            setEditedProperty({
                ...editedProperty,
                images,
            });
        } else {
            setEditedProperty({ ...editedProperty, [name]: value });
        }
    };

    if (!property) {
        return <p className="text-center text-gray-500">Cargando...</p>;
    }

    return (
        <div className=" bg-gradient-to-br from-blue-900 to-black bg-fixed">
            <div className="max-w-2xl mx-auto p-6 bg-gradient-to-bl from-white to-blue-900 rounded-lg shadow-md">
                {/* Tipo de Propiedad */}
                <h1 className="text-3xl font-bold mb-4">
                    {isEditing ? (
                        <input
                            type="text"
                            name="typeProperty"
                            value={editedProperty.typeProperty || ""}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                        />
                    ) : (
                        property.typeProperty
                    )}
                </h1>

                {/* Descripción */}
                <div className="mb-4">
                    <label className="block font-semibold">Descripción:</label>
                    <textarea
                        name="description"
                        value={editedProperty.description || ""}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                        readOnly={!isEditing}
                    />
                </div>

                {/* Dirección */}
                <div className="mb-4">
                    <label className="block font-semibold">Dirección:</label>
                    <input
                        type="text"
                        name="address"
                        value={editedProperty.address || ""}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                        readOnly={!isEditing}
                    />
                </div>

                {/* Precio */}
                <div className="mb-4">
                    <label className="block font-semibold">Precio:</label>
                    <input
                        type="text"
                        name="price"
                        value={editedProperty.price || ""}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                        readOnly={!isEditing}
                    />
                </div>

                {/* Metros Cuadrados */}
                <div className="mb-4">
                    <label className="block font-semibold">Metros Cuadrados:</label>
                    <input
                        type="text"
                        name="m2"
                        value={editedProperty.m2 || ""}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                        readOnly={!isEditing}
                    />
                </div>

                {/* Planta */}
                <div className="mb-4">
                    <label className="block font-semibold">Planta:</label>
                    <input
                        type="text"
                        name="piso"
                        value={editedProperty.piso || ""}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                        readOnly={!isEditing}
                    />
                </div>

                {/* Habitaciones */}
                <div className="mb-4">
                    <label className="block font-semibold">Habitaciones:</label>
                    <input
                        type="text"
                        name="rooms"
                        value={editedProperty.rooms || ""}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                        readOnly={!isEditing}
                    />
                </div>

                {/* Baños */}
                <div className="mb-4">
                    <label className="block font-semibold">Baños:</label>
                    <input
                        type="text"
                        name="wc"
                        value={editedProperty.wc || ""}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                        readOnly={!isEditing}
                    />
                </div>

                {/* Campo para editar la URL de la imagen (primera imagen) */}
                <div className="mb-4">
                    <label className="block font-semibold">URL de la Imagen:</label>
                    <input
                        type="text"
                        name="image"
                        value={
                            editedProperty.images && editedProperty.images[0]
                                ? editedProperty.images[0].src
                                : ""
                        }
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                        readOnly={!isEditing}
                    />
                </div>

                {/* Dropdown para seleccionar el template */}
                <div className="mb-4">
                    <label className="block font-semibold">Template:</label>
                    <select
                        name="template"
                        value={editedProperty.template || "default"}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                        disabled={!isEditing}
                    >
                        <option value="default">Por defecto</option>
                        <option value="estiloA">Estilo A</option>
                        <option value="estiloB">Estilo B</option>
                    </select>
                </div>

                {/* Previsualización de la imagen */}
                {editedProperty.images &&
                    editedProperty.images[0] &&
                    editedProperty.images[0].src && (
                        <div className="mt-4">
                            <img
                                src={editedProperty.images[0].src}
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

                {/* Modal de confirmación */}
                <Dialog
                    open={isOpen}
                    onClose={() => setIsOpen(false)}
                    className="fixed inset-0 flex items-center justify-center p-4"
                >
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                        <Dialog.Title className="text-lg font-semibold">
                            Confirmar modificación
                        </Dialog.Title>
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
                            <Link
                                to={"/ver-propiedades"}
                                onClick={handleSave}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Guardar cambios
                            </Link>
                        </div>
                    </div>
                </Dialog>
            </div>
        </div>
    );
}
