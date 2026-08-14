import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Inventario from './pages/Inventario';
import Cotizacion from './pages/Cotizacion';
import Login from './pages/Login';
import GestionBodega from './pages/GestionBodega';
import HistorialCotizaciones from './pages/HistorialCotizaciones';
import logo from './assets/logo-empresa.png';

function App() {
  const [usuarioActivo, setUsuarioActivo] = useState(null);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('sgv_usuario');
    if (usuarioGuardado) {
      setUsuarioActivo(JSON.parse(usuarioGuardado));
    }
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('sgv_usuario');
    setUsuarioActivo(null);
  };

  if (!usuarioActivo) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <Login setUsuarioActivo={setUsuarioActivo} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* BARRA SUPERIOR LIMPIA: Solo navegación global */}
      <nav style={{ display: 'flex', gap: '20px', padding: '15px 30px', backgroundColor: '#7BC97F', color: 'black', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }}>
        {/* --- CAMBIO APLICADO AQUÍ --- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
          <img 
            src={logo} 
            alt="Logo Vidriería" 
            style={{ height: '40px', objectFit: 'contain', borderRadius: '4px' }} 
          />
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'black' }}>LAMM</span>
        </div>
        {/* ---------------------------- */}
        
        <Link to="/" style={{ color: 'black', textDecoration: 'none', fontWeight: 'bold' }}>🏠 Inicio</Link>
        <Link to="/inventario" style={{ color: 'black', textDecoration: 'none', fontWeight: 'bold' }}>📦 Inventario</Link>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: 'black', fontSize: '14px', fontWeight: 'bold' }}>
            Hola, {usuarioActivo.nombre} ({usuarioActivo.rol})
          </span>
          <button onClick={cerrarSesion} style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Salir
          </button>
        </div>
      </nav>

      <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
        <Routes>
          <Route path="/" element={<Home usuarioActivo={usuarioActivo} />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/cotizar" element={<Cotizacion />} />
          <Route path="/gestion-bodega" element={<GestionBodega />} />
          <Route path="/historial" element={<HistorialCotizaciones />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;