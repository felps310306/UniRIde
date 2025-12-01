// 1. Importar as ferramentas de rota
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// 2. Importar as tuas páginas
import Home from './pages/Home'
import Login from './pages/Login'

function App() {
  return (
    // O BrowserRouter habilita a navegação sem recarregar a página
    <BrowserRouter>
      
      {/* O Routes escolhe APENAS UMA das opções abaixo para mostrar */}
      <Routes>
        
        {/* Se o link for "/" mostra a Home */}
        <Route path="/" element={<Home />} />
        
        {/* Se o link for "/login" mostra o Login */}
        <Route path="/login" element={<Login />} />

      </Routes>

    </BrowserRouter>
  )
}

export default App