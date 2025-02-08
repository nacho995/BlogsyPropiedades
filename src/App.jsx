
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Home } from './pages/home';  // Importación con nombre

import GetBlogs from './pages/GetBlogs';
import BlogPost from './pages/blogPost';
import BlogData from './pages/DetailBlogs';
import { SignInPage } from './pages/signInPage';

import { RegisterPage } from './pages/registerForm';
import ChangeProfile from './pages/changeProfilePage';






export default function App() {
  

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<BlogPost/>} />"
          <Route path="/ver-blogs" element={<GetBlogs/>} />
          <Route path="/blog/:id" element={<BlogData />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ChangeProfile />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

