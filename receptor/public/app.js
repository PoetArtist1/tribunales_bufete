/**
 * lista de documentos recibidos y acciones desencriptar/descargar.
 */

const API_BASE = ""; // mismo origen (receptor)

async function cargarDocumentos() {
  const mensaje = document.getElementById("mensaje-lista");
  try {
    const res = await fetch(`${API_BASE}/api/documentos`);
    if (!res.ok) throw new Error("Error al cargar la lista");
    const datos = await res.json();
    mensaje?.remove();
    renderizarDocumentos(datos);
  } catch (err) {
    mensaje.textContent = "Error al cargar los documentos. " + err.message;
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatearFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function abrirDesencriptado(id, descargar) {
  const url = `${API_BASE}/api/documentos/${id}/decrypt${descargar ? "?download=1" : ""}`;
  if (descargar) {
    window.location.href = url;
  } else {
    window.open(url, "_blank", "noopener");
  }
}

function renderizarDocumentos(datos) {
  const contenedor = document.getElementById("lista-documentos");

  if (datos.length === 0) {
    contenedor.innerHTML = '<p class="mensaje">No hay documentos.</p>';
    return;
  }

  // contenedor.innerHTML = datos
  //   .map(
  //     (d) => `
  //     <div class="item-documento" data-id="${d.id}">
  //       <div>
  //         <span class="nombre">${escapeHtml(d.nombreOriginal || "Documento sin nombre")}</span>
  //         <div class="fecha">${formatearFecha(d.fechaRecepcion)}</div>
  //       </div>
  //       <div class="acciones">
  //         <button type="button" class="btn btn-secundario" data-action="ver" data-id="${d.id}">Ver</button>
  //         <button type="button" class="btn" data-action="descargar" data-id="${d.id}">Descargar</button>
  //       </div>
  //     </div>
  //   `,
  //   )
  //   .join("");
  contenedor.innerHTML = datos
    .map((d) => {
      return `
      <div class="item-documento" data-id="${d.id}">
        <div>
          <span class="nombre">${escapeHtml(d.nombreOriginal || "Documento sin nombre")}</span>
          <div class="fecha">${formatearFecha(d.fechaRecepcion)}</div>
        </div>
        <div class="acciones">
          <button type="button" class="btn btn-secundario" data-action="ver" data-id="${d.id}">Ver</button>
          <button type="button" class="btn" data-action="descargar" data-id="${d.id}">Descargar</button>
          <button type="button" class="btn btn-peligro" data-action="eliminar" data-id="${d.id}">del</button>
        </div>
      </div>
    `;
    })
    .join("");

  contenedor.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      const action = e.currentTarget.dataset.action;
      if (action === "ver") abrirDesencriptado(id, false);
      else if (action === "descargar") abrirDesencriptado(id, true);
      else if (action === "eliminar") eliminarDocumento(id);
    });
  });
}

async function eliminarDocumento(id) {
  if (!confirm("¿Eliminar este documento?")) return;
  try {
    const res = await fetch(`${API_BASE}/api/documentos/${id}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "No se pudo eliminar");
    }
    cargarDocumentos();
  } catch (err) {
    alert("Error al eliminar: " + err.message);
  }
}

async function buscarDocumentos(q) {
  const contenedor = document.getElementById("lista-documentos");

  if (q.length === 0) {
    cargarDocumentos();
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/documentos/buscar?q=${encodeURIComponent(q)}`,
    );
    if (!res.ok) throw new Error("Error en la búsqueda");
    const datos = await res.json();
    renderizarDocumentos(datos);
  } catch (err) {
    contenedor.innerHTML = '<p class="mensaje">Error al buscar documentos.</p>';
  }
}

const inputBuscador = document.getElementById("buscador");
let timeoutBusqueda;

if (inputBuscador) {
  inputBuscador.addEventListener("input", () => {
    clearTimeout(timeoutBusqueda);
    const q = inputBuscador.value.trim();
    timeoutBusqueda = setTimeout(() => buscarDocumentos(q), 300);
  });
}

document.addEventListener("DOMContentLoaded", cargarDocumentos);
