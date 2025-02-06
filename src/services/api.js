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