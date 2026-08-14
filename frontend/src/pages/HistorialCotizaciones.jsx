import { useEffect, useState } from 'react';
import axios from 'axios';

export default function HistorialCotizaciones() {
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = () => {
    axios.get('http://localhost:3001/api/cotizaciones/historial')
      .then(response => setHistorial(response.data))
      .catch(error => console.error("Error al cargar historial:", error));
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await axios.put(`http://localhost:3001/api/cotizaciones/${id}/estado`, { estado: nuevoEstado });
      cargarHistorial(); // Recarga la tabla para ver el cambio
    } catch (error) {
      alert("Error al actualizar el estado");
    }
  };

  return (
    <div style={{ width: '95%', margin: '0 auto', padding: '20px' }}>
      <h2>📋 Historial de Órdenes y Cotizaciones</h2>
      <p>Gestión de trabajos en taller y despachos a clientes.</p>
      <hr style={{ marginBottom: '30px' }} />

      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f9', textAlign: 'left', color: '#333' }}>
            <th style={{ padding: '12px', width: '80px', borderBottom: '2px solid #ddd' }}>N° Orden</th>
            <th style={{ padding: '12px', width: '100px', borderBottom: '2px solid #ddd' }}>Fecha</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Cliente</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Detalle</th>
            <th style={{ padding: '12px', width: '100px', borderBottom: '2px solid #ddd' }}>Total</th>
            <th style={{ padding: '12px', width: '130px', borderBottom: '2px solid #ddd' }}>Estado</th>
            <th style={{ padding: '12px', width: '180px', borderBottom: '2px solid #ddd' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {historial.map((orden) => (
            <tr key={orden.id_cotizacion} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>#{orden.id_cotizacion}</td>
              <td style={{ padding: '12px' }}>{new Date(orden.fecha_emision).toLocaleDateString('es-CL')}</td>
              <td style={{ padding: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {orden.nombre_cliente || 'Anónimo'}
              </td>
              <td style={{ padding: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {orden.tipo_vidrio} ({orden.ancho_solicitado_cm}x{orden.alto_solicitado_cm}cm)
              </td>
              <td style={{ padding: '12px', fontWeight: 'bold', color: '#2e7d32' }}>${orden.total_calculado}</td>
              
              <td style={{ padding: '12px' }}>
                <span style={{ 
                  display: 'inline-block',
                  backgroundColor: orden.estado === 'Trabajando' ? '#ff9800' : '#4CAF50', 
                  color: 'white', 
                  padding: '4px 10px', 
                  borderRadius: '15px', 
                  fontWeight: 'bold', 
                  fontSize: '13px',
                  whiteSpace: 'nowrap' 
                }}>
                  {orden.estado === 'Trabajando' ? '🛠️ Trabajando' : '✅ Entregado'}
                </span>
              </td>

              {/* COLUMNA DE ACCIONES ACTUALIZADA */}
              <td style={{ padding: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                
                {/* Botón 1: Descargar PDF (Siempre visible) */}
                <button 
                  onClick={() => window.open(`http://localhost:3001/api/cotizaciones/${orden.id_cotizacion}/pdf`, '_blank')}
                  style={{ padding: '6px 10px', backgroundColor: '#e91e63', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                  📄 PDF
                </button>

                {/* Botón 2: Marcar como Entregado (Solo visible si está trabajando) */}
                {orden.estado === 'Trabajando' && (
                  <button 
                    onClick={() => cambiarEstado(orden.id_cotizacion, 'Entregado')}
                    style={{ padding: '6px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                    ✔ Entregado
                  </button>
                )}
                
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}