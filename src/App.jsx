
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Home } from './pages/home';  // Importación con nombre

import GetBlogs from './pages/GetBlogs';
import BlogPost from './pages/blogPost';






export default function App() {
  

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<BlogPost/>} />"
          <Route path="/ver-blogs" element={<GetBlogs/>} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

