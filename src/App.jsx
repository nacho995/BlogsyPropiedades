
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Home } from './pages/home';  // Importación con nombre

import GetBlogs from './pages/GetBlogs';
import BlogPost from './pages/blogPost';
import BlogData from './pages/DetailBlogs';






export default function App() {
  

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<BlogPost/>} />"
          <Route path="/ver-blogs" element={<GetBlogs/>} />
          <Route path="/blog/:id" element={<BlogData />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

