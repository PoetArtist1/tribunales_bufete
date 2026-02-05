/**
 * formulario de subida y envío cifrado al receptor
 */

const form = document.getElementById('form-envio');
const btnEnviar = document.getElementById('btn-enviar');
const resultado = document.getElementById('resultado');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultado.textContent = '';
  resultado.className = 'resultado';
  const fileInput = document.getElementById('archivo');
  const nombreInput = document.getElementById('nombreOriginal');
  const file = fileInput.files[0];
  if (!file) {
    resultado.className = 'resultado error';
    resultado.textContent = 'Seleccione un archivo.';
    return;
  }

  btnEnviar.disabled = true;
  const formData = new FormData();
  formData.append('archivo', file);
  if (nombreInput.value.trim()) {
    formData.append('nombreOriginal', nombreInput.value.trim());
  }

  try {
    const res = await fetch('/api/enviar', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      resultado.className = 'resultado error';
      resultado.textContent = data.error || res.statusText || 'Error al enviar.';
      return;
    }
    resultado.className = 'resultado ok';
    resultado.textContent = `Documento enviado correctamente. ID en receptor: ${data.id || '—'}. Fecha recepción: ${data.fechaRecepcion || '—'}.`;
    form.reset();
  } catch (err) {
    resultado.className = 'resultado error';
    resultado.textContent = 'Error de red o servidor: ' + err.message;
  } finally {
    btnEnviar.disabled = false;
  }
});
