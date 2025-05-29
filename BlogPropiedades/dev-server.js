import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simular datos
const users = [
  {
    id: 1,
    email: 'ignaciodalesio1995@gmail.com',
    password: 'test123',
    name: 'Ignacio Dalesio',
    role: 'admin'
  }
];

const blogs = [
  {
    id: 1,
    title: 'Blog de prueba',
    description: 'Descripción del blog',
    content: 'Contenido del blog',
    author: 'Admin'
  }
];

const properties = [
  {
    id: 1,
    title: 'Propiedad de prueba',
    description: 'Descripción de la propiedad',
    price: 100000,
    location: 'Madrid'
  }
];

// Función para generar token simple
const generateToken = (user) => {
  return Buffer.from(JSON.stringify({
    userId: user.id,
    email: user.email,
    exp: Date.now() + (24 * 60 * 60 * 1000)
  })).toString('base64');
};

// Función para verificar token
const verifyToken = (token) => {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decoded.exp < Date.now()) {
      return null;
    }
    return decoded;
  } catch (e) {
    return null;
  }
};

// Rutas de usuario
app.post('/api/user/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: true, message: 'Credenciales inválidas' });
  }
  
  const token = generateToken(user);
  
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

app.get('/api/user/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'Token requerido' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: true, message: 'Token inválido' });
  }
  
  const user = users.find(u => u.id === decoded.userId);
  if (!user) {
    return res.status(404).json({ error: true, message: 'Usuario no encontrado' });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
});

// Rutas de blogs
app.get('/api/blogs', (req, res) => {
  res.json(blogs);
});

app.post('/api/blogs', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'Token requerido' });
  }
  
  const newBlog = {
    id: Date.now(),
    ...req.body
  };
  
  blogs.push(newBlog);
  res.status(201).json(newBlog);
});

// Rutas de propiedades
app.get('/api/properties', (req, res) => {
  res.json(properties);
});

app.post('/api/properties', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'Token requerido' });
  }
  
  const newProperty = {
    id: Date.now(),
    ...req.body
  };
  
  properties.push(newProperty);
  res.status(201).json(newProperty);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de desarrollo API ejecutándose en http://localhost:${PORT}`);
}); 