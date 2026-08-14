import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Inventario() {
  // 1. Unificamos el estado para recibir los 3 grupos de datos juntos
  const [inventario, setInventario] = useState({
    planchas: [],
    marcos: [],
    retazos: []
  });

  useEffect(() => {
    // 2. Llamamos al Súper Endpoint para no sobrecargar el servidor con 3 peticiones
    axios.get('http://localhost:3001/api/inventario/general')
      .then(response => setInventario(response.data))
      .catch(error => console.error("Error al cargar inventario:", error));
  }, []);

  // 3. Estilos conservados
  const tablaStyle = { width: '100%', borderCollapse: 'collapse', marginBottom: '40px', textAlign: 'left', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
  const thStyle = { backgroundColor: '#f4f4f9', padding: '12px', borderBottom: '2px solid #ddd', color: '#333' };
  const tdStyle = { padding: '12px', borderBottom: '1px solid #ddd' };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h2>📦 Control de Inventario General</h2>
      <p>Visualización del stock principal, marcos y material reutilizable en bodega.</p>
      <hr style={{ marginBottom: '30px' }} />

      {/* SECCIÓN 1: PLANCHAS NUEVAS */}
      <h3 style={{ color: '#2c3e50' }}>🟩 Planchas Completas (Sin Usar)</h3>
      <table style={tablaStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Tipo de Vidrio</th>
            <th style={thStyle}>Ancho Estándar</th>
            <th style={thStyle}>Alto Estándar</th>
            <th style={thStyle}>Cantidad en Stock</th>
          </tr>
        </thead>
        <tbody>
          {inventario.planchas.map((plancha) => (
            <tr key={plancha.id_plancha}>
              <td style={tdStyle}><strong>{plancha.nombre} ({plancha.espesor_mm}mm)</strong></td>
              <td style={tdStyle}>{plancha.ancho_estandar_cm} cm</td>
              <td style={tdStyle}>{plancha.alto_estandar_cm} cm</td>
              <td style={tdStyle}>
                <span style={{ 
                  backgroundColor: plancha.cantidad_stock > 5 ? '#4CAF50' : '#ff9800', 
                  color: 'white', padding: '4px 10px', borderRadius: '15px', fontWeight: 'bold' 
                }}>
                  {plancha.cantidad_stock} Unidades
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SECCIÓN 2: MARCOS DE ALUMINIO/PVC (NUEVO) */}
      <h3 style={{ color: '#2c3e50' }}>⚙️ Perfiles y Marcos</h3>
      <table style={tablaStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Tipo de Perfil</th>
            <th style={thStyle}>Material</th>
            <th style={thStyle}>Largo Estándar</th>
            <th style={thStyle}>Cantidad en Stock</th>
          </tr>
        </thead>
        <tbody>
          {inventario.marcos.map((marco) => (
            <tr key={marco.id_inventario_marco}>
              <td style={tdStyle}><strong>{marco.nombre}</strong></td>
              <td style={tdStyle}>{marco.material}</td>
              <td style={tdStyle}>{marco.largo_estandar_cm} cm (6mts)</td>
              <td style={tdStyle}>
                <span style={{ 
                  backgroundColor: marco.cantidad_stock > 5 ? '#4CAF50' : '#ff9800', 
                  color: 'white', padding: '4px 10px', borderRadius: '15px', fontWeight: 'bold' 
                }}>
                  {marco.cantidad_stock} Barras
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SECCIÓN 3: RETAZOS DISPONIBLES */}
      <h3 style={{ color: '#2c3e50' }}>🟨 Retazos (Reutilizables)</h3>
      <table style={tablaStyle}>
        <thead>
          <tr>
            <th style={{ ...thStyle, color: '#d35400' }}>ID Retazo (Para Bajas)</th>
            <th style={thStyle}>Tipo de Vidrio</th>
            <th style={thStyle}>Ancho (Sobrante)</th>
            <th style={thStyle}>Alto (Sobrante)</th>
            <th style={thStyle}>Ubicación</th>
          </tr>
        </thead>
        <tbody>
          {inventario.retazos.length === 0 ? (
            <tr><td colSpan="5" style={{...tdStyle, textAlign: 'center', color: 'gray'}}>No hay retazos disponibles en bodega.</td></tr>
          ) : (
            inventario.retazos.map((retazo) => (
              <tr key={retazo.id_retazo}>
                <td style={{ ...tdStyle, color: '#d35400', fontWeight: 'bold' }}>#{retazo.id_retazo}</td>
                <td style={tdStyle}><strong>{retazo.tipo_vidrio} ({retazo.espesor_mm}mm)</strong></td>
                <td style={tdStyle}>{retazo.ancho_cm} cm</td>
                <td style={tdStyle}>{retazo.alto_cm} cm</td>
                <td style={tdStyle}>{retazo.ubicacion}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}