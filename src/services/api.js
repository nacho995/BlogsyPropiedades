export async function postBlogPosts(data) {
    const response = await fetch('http://localhost:3000/blog', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })

    return response.json()
}

export async function getBlogPosts() {
    const response = await fetch('http://localhost:3000/blog')
    return response.json()
}

export async function deleteBlogPost(id) {
    const response = await fetch(`http://localhost:3000/blog/${id}`, {
        method: 'DELETE',
    })

    return response.json()
}

export async function updateBlogPost(id, data) {
    const response = await fetch(`http://localhost:3000/blog/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })

    return response.json()
}


export async function getBlogById(id) {
    const response = await fetch(`http://localhost:3000/blog/${id}`);
    const data = await response.json();
    return data;
};

const API_BASE_URL = "http://localhost:3000";

export async function createUser(data) {
  try {
    const response = await window.fetch(`${API_BASE_URL}/user/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    throw new Error("Hubo un error al crear el usuario.");
  }
}

export async function loginUser(data) {
  try {
    const response = await window.fetch(`${API_BASE_URL}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    throw new Error("Hubo un error al iniciar sesión.");
  }
}

export async function getUsers() {
  try {
    const response = await window.fetch(API_BASE_URL, {
      headers: {
        usersorization: `${localStorage.getItem("token")}`,
      },
    });
    const data = await response.json();
    if (response.status !== 200) {
      throw new Error(data.message);
    }
    console.log("response from service api", data);
    return data;
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    throw new Error("Hubo un error al obtener los usuarios.");
  }
}


export const requestPasswordReset = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/request-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    return response.json(); // Devuelve el resetLink
  } catch (err) {
    throw new Error("Error al solicitar reseteo", err.message);
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    return response.json();
  } catch (err) {
    throw new Error("Error al cambiar la contraseña", err.message);
  }
};

export const updateProfile = async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/update-profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el perfil");
      }
      return response.json();
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      throw new Error("Error al actualizar el perfil: " + error.message);
    }
  };