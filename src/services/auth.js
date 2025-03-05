export const login = async (credentials) => {
  try {
    return await fetchAPI('/user/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    return await fetchAPI('/user/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  } catch (error) {
    console.error('Error en registro:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
}; 