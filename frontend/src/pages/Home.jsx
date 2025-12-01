import Navbar from '../components/Navbar'

function Home() {
  return (
    <div>
      <Navbar />
      <div style={{ padding: '20px' }}>
        <h1>Painel de Vendas</h1>
        <p>Bem-vindo ao sistema!</p>
      </div>
    </div>
  )
}

export default Home