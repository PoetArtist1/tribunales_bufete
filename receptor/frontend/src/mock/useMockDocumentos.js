import { useEffect, useRef } from 'react';

const DEFAULT_DOCUMENTOS = [
  {
    id: 'mock-1',
    nombreOriginal: 'Demanda_Civil_Expediente_2034.pdf',
    fechaRecepcion: '2026-02-05T14:32:00.000Z',
  },
  {
    id: 'mock-2',
    nombreOriginal: 'Prueba_Pericial_Contrato_Alquiler.docx',
    fechaRecepcion: '2026-02-06T09:18:00.000Z',
  },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const toPath = (input) => {
  try {
    const url = new URL(input, window.location.origin);
    return `${url.pathname}${url.search}`;
  } catch {
    return input;
  }
};

export default function useMockDocumentos(enabled = true) {
  const documentosRef = useRef(DEFAULT_DOCUMENTOS);
  const fetchRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    if (!fetchRef.current) {
      fetchRef.current = window.fetch.bind(window);
    }

    window.fetch = async (input, init = {}) => {
      const method = (init.method || 'GET').toUpperCase();
      const path = toPath(input);

      if (path.startsWith('/api/documentos')) {
        await delay(350);

        if (method === 'GET' && path === '/api/documentos') {
          return jsonResponse(documentosRef.current);
        }

        if (method === 'GET' && path.startsWith('/api/documentos/buscar')) {
          const url = new URL(path, window.location.origin);
          const q = (url.searchParams.get('q') || '').toLowerCase();
          const filtrados = documentosRef.current.filter((doc) =>
            (doc.nombreOriginal || '').toLowerCase().includes(q),
          );
          return jsonResponse(filtrados);
        }

        if (method === 'DELETE') {
          const id = path.split('/api/documentos/')[1]?.split('?')[0];
          documentosRef.current = documentosRef.current.filter(
            (doc) => String(doc.id) !== String(id),
          );
          return jsonResponse({ ok: true });
        }
      }

      return fetchRef.current(input, init);
    };

    return () => {
      if (fetchRef.current) {
        window.fetch = fetchRef.current;
      }
    };
  }, [enabled]);
}
