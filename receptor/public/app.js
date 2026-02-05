/**
 * lista de documentos recibidos y acciones desencriptar/descargar.
 */

const API_BASE = ''; // mismo origen (receptor)

async function cargarDocumentos() {
  const contenedor = document.getElementById('lista-documentos');
  const mensaje = document.getElementById('mensaje-lista');
  try {
    const res = await fetch(`${API_BASE}/api/documentos`);
    if (!res.ok) throw new Error('Error al cargar la lista');
    const datos = await res.json();
    mensaje.remove();
    if (datos.length === 0) {
      contenedor.innerHTML = '<p class="mensaje">No hay documentos recibidos.</p>';
      return;
    }
    contenedor.innerHTML = datos
      .map(
        (d) => `
        <div class="item-documento" data-id="${d.id}">
          <div>
            <span class="nombre">${escapeHtml(d.nombreOriginal)}</span>
            <div class="fecha">${formatearFecha(d.fechaRecepcion)}</div>
          </div>
          <div class="acciones">
            <button type="button" class="btn btn-secundario" data-action="ver" data-id="${d.id}">Ver</button>
            <button type="button" class="btn" data-action="descargar" data-id="${d.id}">Descargar</button>
          </div>
        </div>
      `
      )
      .join('');
    contenedor.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const action = e.currentTarget.dataset.action;
        if (action === 'ver') abrirDesencriptado(id, false);
        else if (action === 'descargar') abrirDesencriptado(id, true);
      });
    });
  } catch (err) {
    mensaje.textContent = 'Error al cargar los documentos. ' + err.message;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatearFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function abrirDesencriptado(id, descargar) {
  const url = `${API_BASE}/api/documentos/${id}/decrypt${descargar ? '?download=1' : ''}`;
  if (descargar) {
    window.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

document.addEventListener('DOMContentLoaded', cargarDocumentos);
