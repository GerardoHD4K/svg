import { useState } from 'react';
import axios from 'axios';
import logo from '../assets/logo-empresa.png';

export default function Login({ setUsuarioActivo }) {
  const [credenciales, setCredenciales] = useState({ nombre_usuario: '', contrasena: '' });
  const [errorMensaje, setErrorMensaje] = useState('');

  const manejarCambio = (e) => {
    setCredenciales({ ...credenciales, [e.target.name]: e.target.value });
  };

  const procesarLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', credenciales);
      
      const datosUsuario = response.data.usuario;
      localStorage.setItem('sgv_usuario', JSON.stringify(datosUsuario));
      
      // Le avisamos a App.jsx que alguien entró
      setUsuarioActivo(datosUsuario);
      
    } catch (error) {
      setErrorMensaje(error.response?.data?.error || "Error al conectar con el servidor.");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div style={{ backgroundColor: '#7BC97F', padding: '40px', borderRadius: '10px', width: '350px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        
        
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <img 
            src={logo} 
            alt="Logo Vidriería LAMM" 
            style={{ height: '80px', objectFit: 'contain', marginBottom: '10px', borderRadius: '5px' }} 
          />
          <h2 style={{ margin: '0', color: '#1e1e2f' }}>Vidriería LAMM</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Acceso al Sistema</p>
        </div>
        

        {errorMensaje && <p style={{ color: 'white', backgroundColor: '#f44336', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>{errorMensaje}</p>}
        
        <form onSubmit={procesarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label><strong>Usuario:</strong></label>
            <input 
              type="text" 
              name="nombre_usuario" 
              value={credenciales.nombre_usuario} 
              onChange={manejarCambio} 
              required 
              style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} 
            />
          </div>
          <div>
            <label><strong>Contraseña:</strong></label>
            <input 
              type="password" 
              name="contrasena" 
              value={credenciales.contrasena} 
              onChange={manejarCambio} 
              required 
              style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} 
            />
          </div>
          <button type="submit" style={{ backgroundColor: '#1e1e2f', color: 'white', padding: '12px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: 'background-color 0.3s' }}>
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}