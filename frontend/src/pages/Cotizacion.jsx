import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Cotizacion() {
  // 1. Estados para guardar lo que el usuario escribe en el formulario
  const [tiposVidrio, setTiposVidrio] = useState([]);
  const [marcos, setMarcos] = useState([]);
  
  const [formulario, setFormulario] = useState({
    nombre_cliente: '',
    id_vidrio: '',
    id_marco: '',
    ancho_solicitado: '',
    alto_solicitado: ''
  });


  const [esConfirmada, setEsConfirmada] = useState(false);

  // 2. Estado para mostrar la boleta o resultado final
  const [resultado, setResultado] = useState(null);

  // 3. Al abrir la pantalla
  useEffect(() => {
    // Cargar vidrios
    axios.get('http://localhost:3001/api/inventario/tipos-vidrio')
      .then(response => setTiposVidrio(response.data))
      .catch(error => console.error("Error al cargar vidrios:", error));

    // Cargar marcos
    axios.get('http://localhost:3001/api/inventario/marcos')
      .then(response => setMarcos(response.data))
      .catch(error => console.error("Error al cargar marcos:", error));
  }, []);
  
  // 4. Función para actualizar los datos mientras el usuario escribe
  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  // 5. Función que se ejecuta al presionar cualquiera de los dos botones
  const procesarVenta = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    
    try {
      const response = await axios.post('http://localhost:3001/api/cotizaciones/calcular', {
        id_usuario: 1, // Por ahora fijo, luego lo conectamos con el Login
        nombre_cliente: formulario.nombre_cliente,
        id_vidrio: parseInt(formulario.id_vidrio),
        id_marco: parseInt(formulario.id_marco) || 1, 
        ancho_solicitado: parseFloat(formulario.ancho_solicitado),
        alto_solicitado: parseFloat(formulario.alto_solicitado),
        es_venta_confirmada: esConfirmada // <-- Enviamos la instrucción al backend
      });

      // Guardamos la respuesta del backend para mostrarla en pantalla
      setResultado(response.data);
    } catch (error) {
      alert(error.response?.data?.error || "Ocurrió un error al procesar la cotización");
    }
  };

  return (
    <div style={{ display: 'flex', gap: '40px' }}>
      
      {/* PANEL IZQUIERDO: FORMULARIO DE INGRESO */}
      <div style={{ flex: 1, backgroundColor: '#f4f4f9', padding: '30px', borderRadius: '10px' }}>
        <h2 style={{ marginTop: 0 }}>💰 Nueva Cotización</h2>
        <form onSubmit={procesarVenta} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label><strong>Nombre del Cliente:</strong></label><br/>
            <input type="text" name="nombre_cliente" value={formulario.nombre_cliente} onChange={manejarCambio} required style={{ width: '100%', padding: '8px' }} />
          </div>

          <div>
            <label><strong>Tipo de Vidrio:</strong></label><br/>
            <select name="id_vidrio" value={formulario.id_vidrio} onChange={manejarCambio} required style={{ width: '100%', padding: '8px' }}>
              <option value="">-- Seleccione un material --</option>
              {tiposVidrio.map(vidrio => (
                <option key={vidrio.id_vidrio} value={vidrio.id_vidrio}>
                  {vidrio.nombre} ({vidrio.espesor_mm}mm) - ${vidrio.precio_m2}/m2
                </option>
              ))}
            </select>
          </div>

          <div>
            <label><strong>Tipo de Marco:</strong></label><br/>
            <select name="id_marco" value={formulario.id_marco} onChange={manejarCambio} style={{ width: '100%', padding: '8px' }}>
              <option value="">-- Sin Marco (Solo vidrio) --</option>
              {marcos.map((marco) => (
                <option key={marco.id_marco} value={marco.id_marco}>
                  {marco.nombre} - ${marco.precio_metro_lineal} / metro lineal
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label><strong>Ancho (cm):</strong></label><br/>
              <input type="number" step="0.01" name="ancho_solicitado" value={formulario.ancho_solicitado} onChange={manejarCambio} required style={{ width: '100%', padding: '8px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label><strong>Alto (cm):</strong></label><br/>
              <input type="number" step="0.01" name="alto_solicitado" value={formulario.alto_solicitado} onChange={manejarCambio} required style={{ width: '100%', padding: '8px' }} />
            </div>
          </div>

          
          <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
            <button 
              type="submit" 
              onClick={() => setEsConfirmada(false)}
              style={{ 
                flex: 1, backgroundColor: '#6c757d', color: 'white', padding: '12px', border: 'none', 
                borderRadius: '5px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' 
            }}>
              📄 Solo Generar Cotización
            </button>

            <button 
              type="submit" 
              onClick={() => setEsConfirmada(true)}
              style={{ 
                flex: 1, backgroundColor: '#4CAF50', color: 'white', padding: '12px', border: 'none', 
                borderRadius: '5px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' 
            }}>
              ✅ Confirmar y Cortar
            </button>
          </div>
          

        </form>
      </div>

      {/* PANEL DERECHO: RESULTADO Y BOLETA */}
      <div style={{ flex: 1 }}>
        {resultado ? (
          <div style={{ 
            border: resultado.estado === 'Pendiente' ? '2px dashed #6c757d' : '2px dashed #4CAF50', 
            padding: '30px', 
            borderRadius: '10px', 
            backgroundColor: resultado.estado === 'Pendiente' ? '#f8f9fa' : '#e8f5e9' 
          }}>
            <h2 style={{ color: resultado.estado === 'Pendiente' ? '#495057' : '#2e7d32', marginTop: 0 }}>
              {resultado.estado === 'Pendiente' ? '📄 Cotización Guardada' : '✅ Venta Exitosa'}
            </h2>
            <p><strong>N° Orden:</strong> {resultado.id_cotizacion}</p>
            <h3 style={{ fontSize: '28px', color: resultado.estado === 'Pendiente' ? '#343a40' : '#1b5e20' }}>Total: ${resultado.total}</h3>
            <hr style={{ borderColor: '#ccc' }} />
            <p><strong>Reporte de Bodega:</strong></p>
            <ul style={{ color: '#333' }}>
              <li>{resultado.notificacion_sistema}</li>
              {resultado.retazos_generados && <li>{resultado.retazos_generados}</li>}
            </ul>
          </div>
        ) : (
          <div style={{ border: '2px dashed #ccc', padding: '30px', borderRadius: '10px', color: 'gray', textAlign: 'center' }}>
            <p>Complete el formulario a la izquierda para generar la boleta y registrar el consumo de bodega.</p>
          </div>
        )}
      </div>

    </div>
  );
}