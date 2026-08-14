import { Link } from 'react-router-dom';

export default function Home({ usuarioActivo }) {
  const cardStyle = {
    border: '1px solid #ddd', padding: '20px', borderRadius: '10px', 
    textAlign: 'center', textDecoration: 'none', color: '#333', 
    backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', 
    alignItems: 'center', gap: '10px', width: '250px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s'
  };

  return (
    <div>
      <h2>Bienvenido al Sistema, {usuarioActivo.nombre}</h2>
      <p>Seleccione una de las opciones del panel de control:</p>
      <hr style={{ marginBottom: '30px' }} />
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Opción 1: Cotizar */}
        <Link to="/cotizar" style={{...cardStyle, border: '2px solid #000000', backgroundColor: '#ffffff'}}>
          <span style={{ fontSize: '40px' }}>💰</span>
          <h3 style={{ color: '#000000', margin: '10px 0' }}>Nueva Cotización</h3>
          <span style={{ fontSize: '14px', color: '#666' }}>Punto de venta y corte manual</span>
        </Link>

        {/* Opción 2: Ver Inventario */}
        <Link to="/inventario" style={{...cardStyle, border: '2px solid #000000', backgroundColor: '#ffffff'}}>
          <span style={{ fontSize: '40px' }}>📦</span>
          <h3 style={{ color: '#000000', margin: '10px 0' }}>Ver Inventario</h3>
          <span style={{ fontSize: '14px', color: '#666' }}>Consultar stock y mermas</span>
        </Link>

        {/* Opción 3: Historial de Ventas */}
        <Link to="/historial" style={{...cardStyle, border: '2px solid #000000', backgroundColor: '#ffffff'}}>
          <span style={{ fontSize: '40px' }}>📋</span>
          <h3 style={{ color: '#000000', margin: '10px 0' }}>Historial de Ventas</h3>
          <span style={{ fontSize: '14px', color: '#666' }}>Ver órdenes y gestión de estados</span>
        </Link>

        {/* Opción 4: Gestión de Bodega (SOLO ADMINISTRADORES) */}
        {usuarioActivo.rol === 'Administrador' && (
          <Link to="/gestion-bodega" style={{...cardStyle, border: '2px solid #000000', backgroundColor: '#ffffff'}}>
            <span style={{ fontSize: '40px' }}>⚙️</span>
            <h3 style={{ color: '#000000', margin: '10px 0' }}>Gestión Bodega</h3>
            <span style={{ fontSize: '14px', color: '#666' }}>Agregar o eliminar stock manual</span>
          </Link>
        )}

      </div>
    </div>
  );
}