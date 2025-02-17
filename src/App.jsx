
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Home } from './pages/home';  // Importación con nombre

import GetBlogs from './pages/GetBlogs';
import BlogPost from './pages/blogPost';
import BlogData from './pages/DetailBlogs';
import { SignInPage } from './pages/signInPage';

import { RegisterPage } from './pages/registerForm';
import ChangeProfile from './pages/changeProfilePage';
import { UserProvider } from './components/UserContext';
import PropertyPost from './pages/PropertiesPost';
import GetProperty from './pages/GetProperties';
import PropertyData from './pages/detalProperty';






export default function App() {
  

  return (
    <>
      <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<BlogPost/>} />"
          <Route path="/ver-blogs" element={<GetBlogs/>} />
          <Route path="/blog/:id" element={<BlogData />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ChangeProfile />} />
          <Route path='/propiedades' element={<PropertyPost />} />
          <Route path='ver-propiedades' element={<GetProperty/>} />
          <Route path='property/:id' element={<PropertyData/>} />
        </Routes>
      </BrowserRouter>
      </UserProvider>
    </>
  )
}

