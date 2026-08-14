import { useState, useEffect } from 'react';
import axios from 'axios';

export default function GestionBodega() {
  // Estados para cargar los catálogos y poblar los selectores
  const [planchas, setPlanchas] = useState([]);
  const [marcos, setMarcos] = useState([]);

  // Estado del formulario
  const [movimiento, setMovimiento] = useState({
    tipo_movimiento: 'Ingreso', // 'Ingreso' o 'Baja'
    tipo_elemento: 'Plancha',   // 'Plancha', 'Marco' o 'Retazo'
    id_elemento: '',
    cantidad: 1,
    motivo: ''
  });

  // Cargar datos al abrir la pantalla para saber qué elementos existen
  useEffect(() => {
    // Traer tipos de vidrio / planchas
    axios.get('http://localhost:3001/api/inventario/tipos-vidrio')
      .then(res => setPlanchas(res.data))
      .catch(err => console.error("Error al cargar vidrios:", err));

    // Traer tipos de marco
    axios.get('http://localhost:3001/api/inventario/marcos')
      .then(res => setMarcos(res.data))
      .catch(err => console.error("Error al cargar marcos:", err));
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    
    // Ajuste automático: los retazos solo pueden ser dados de baja
    if (name === 'tipo_elemento' && value === 'Retazo') {
      setMovimiento(prev => ({
        ...prev,
        tipo_elemento: value,
        tipo_movimiento: 'Baja',
        id_elemento: '' 
      }));
    } else {
      setFormularioOpcion(name, value);
    }
  };

  const setFormularioOpcion = (name, value) => {
    setMovimiento(prev => ({ ...prev, [name]: value }));
  };

  const ejecutarMovimiento = async (e) => {
    e.preventDefault();

    
    const datosEnviar = {
      tipo_elemento: movimiento.tipo_elemento,
      id_elemento: parseInt(movimiento.id_elemento),
      cantidad: parseInt(movimiento.cantidad),
      id_usuario: 1, 
      motivo: movimiento.motivo
    };

    // Determinar a qué endpoint del backend apuntar
    const url = movimiento.tipo_movimiento === 'Ingreso' 
      ? 'http://localhost:3001/api/inventario/ingreso'
      : 'http://localhost:3001/api/inventario/baja';

    try {
      const response = await axios.post(url, datosEnviar);
      if (response.data.success) {
        alert(response.data.mensaje);
        // Limpiar formulario tras el éxito
        setMovimiento({
          tipo_movimiento: 'Ingreso',
          tipo_elemento: 'Plancha',
          id_elemento: '',
          cantidad: 1,
          motivo: ''
        });
      }
    } catch (error) {
      alert(error.response?.data?.error || "Error al procesar la acción en bodega");
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fdfdfd', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
      <h2 style={{ marginTop: 0, color: '#d84315', display: 'flex', alignItems: 'center', gap: '10px' }}>
        ⚙️ Panel de Gestión de Bodega
      </h2>
      <p style={{ color: '#666', fontSize: '14px' }}>Área exclusiva para el ajuste manual, ingreso de proveedores y control de mermas o pérdidas.</p>
      <hr style={{ border: '0', borderTop: '1px solid #eee', marginBottom: '25px' }} />

      <form onSubmit={ejecutarMovimiento} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 1. TIPO DE MOVIMIENTO */}
        <div>
          <label><strong>Tipo de Operación:</strong></label><br />
          <select name="tipo_movimiento" value={movimiento.tipo_movimiento} onChange={manejarCambio} disabled={movimiento.tipo_elemento === 'Retazo'} style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
            <option value="Ingreso">📥 Ingreso de Material (Aumentar Stock)</option>
            <option value="Baja">📤 Dar de Baja / Descarte (Disminuir Stock)</option>
          </select>
        </div>

        {/* 2. TIPO DE ELEMENTO */}
        <div>
          <label><strong>Categoría del Material:</strong></label><br />
          <select name="tipo_elemento" value={movimiento.tipo_elemento} onChange={manejarCambio} style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
            <option value="Plancha">📦 Plancha de Vidrio Completa</option>
            <option value="Marco">⚙️ Barra de Marco (Aluminio/PVC)</option>
            <option value="Retazo">🧩 Merma / Retazo Sobrante</option>
          </select>
        </div>

        {/* 3. SELECCIÓN DEL ELEMENTO ESPECÍFICO */}
        <div>
          <label><strong>Seleccionar Elemento Específico:</strong></label><br />
          {movimiento.tipo_elemento === 'Plancha' && (
            <select name="id_elemento" value={movimiento.id_elemento} onChange={manejarCambio} required style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
              <option value="">-- Seleccione el Tipo de Vidrio --</option>
              {planchas.map(p => (
                <option key={p.id_vidrio} value={p.id_vidrio}>{p.nombre} ({p.espesor_mm}mm)</option>
              ))}
            </select>
          )}

          {movimiento.tipo_elemento === 'Marco' && (
            <select name="id_elemento" value={movimiento.id_elemento} onChange={manejarCambio} required style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
              <option value="">-- Seleccione el Tipo de Marco --</option>
              {marcos.filter(m => m.id_marco !== 1).map(m => (
                <option key={m.id_marco} value={m.id_marco}>{m.nombre} ({m.material})</option>
              ))}
            </select>
          )}

          {movimiento.tipo_elemento === 'Retazo' && (
            <input 
              type="number" 
              name="id_elemento" 
              placeholder="Escriba el ID numérico del retazo a descartar"
              value={movimiento.id_elemento} 
              onChange={manejarCambio} 
              required 
              style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }} 
            />
          )}
        </div>

        {/* 4. CANTIDAD */}
        {movimiento.tipo_elemento !== 'Retazo' && (
          <div>
            <label><strong>Cantidad:</strong></label><br />
            <input type="number" name="cantidad" min="1" value={movimiento.cantidad} onChange={manejarCambio} required style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }} />
          </div>
        )}

        {/* 5. MOTIVO */}
        <div>
          <label><strong>Motivo / Justificación del Movimiento:</strong></label><br />
          <textarea 
            name="motivo" 
            rows="3" 
            placeholder={movimiento.tipo_movimiento === 'Ingreso' ? "Ej: Recepción camión proveedor, Factura N°405" : "Ej: Vidrio trizado durante descarga, limpieza de mermas inservibles"}
            value={movimiento.motivo} 
            onChange={manejarCambio} 
            required={movimiento.tipo_movimiento === 'Baja'} 
            style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}
          />
        </div>

        {/* BOTÓN DE ACCIÓN */}
        <button type="submit" style={{ 
          backgroundColor: movimiento.tipo_movimiento === 'Ingreso' ? '#1e7e34' : '#bd2130', 
          color: 'white', padding: '12px', border: 'none', borderRadius: '5px', 
          fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px',
          transition: 'background-color 0.2s'
        }}>
          {movimiento.tipo_movimiento === 'Ingreso' ? '📥 Confirmar Ingreso de Stock' : '📤 Confirmar Baja de Material'}
        </button>

      </form>
    </div>
  );
}