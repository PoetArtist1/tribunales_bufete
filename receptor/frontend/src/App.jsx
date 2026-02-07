import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import './App.css';

const API_BASE = (import.meta.env.VITE_API_BASE || '').trim();

function formatearFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function App() {
  const [documentos, setDocumentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const textoBusqueda = useMemo(() => busqueda.trim(), [busqueda]);

  const cargarDocumentos = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/documentos`);
      if (!res.ok) throw new Error('Error al cargar la lista');
      const datos = await res.json();
      setDocumentos(Array.isArray(datos) ? datos : []);
    } catch (err) {
      setError(err.message || 'Error al cargar los documentos.');
      setDocumentos([]);
    } finally {
      setCargando(false);
    }
  };

  const buscarDocumentos = async (q) => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(
        `${API_BASE}/api/documentos/buscar?q=${encodeURIComponent(q)}`,
      );
      if (!res.ok) throw new Error('Error en la búsqueda');
      const datos = await res.json();
      setDocumentos(Array.isArray(datos) ? datos : []);
    } catch (err) {
      setError(err.message || 'Error al buscar documentos.');
      setDocumentos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDocumentos();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!textoBusqueda) {
        cargarDocumentos();
        return;
      }
      buscarDocumentos(textoBusqueda);
    }, 300);

    return () => clearTimeout(timeout);
  }, [textoBusqueda]);

  const abrirDesencriptado = (id, descargar) => {
    const url = `${API_BASE}/api/documentos/${id}/decrypt${descargar ? '?download=1' : ''}`;
    if (descargar) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener');
    }
  };

  const eliminarDocumento = async (id) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/documentos/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo eliminar');
      }
      if (textoBusqueda) {
        buscarDocumentos(textoBusqueda);
      } else {
        cargarDocumentos();
      }
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  return (
    <div className='min-h-screen w-full'>
      <header className='w-full border-b border-gray-400 bg-(--app-background)'>
        <div className='w-full px-6 py-6 text-center font-[Georgia]'>
          <h1 className='text-xl font-semibold text-slate-800'>
            Sistema Receptor de Documentos Jurídicos
          </h1>
          <p className='mt-5 text-sm text-slate-500'>
            Tribunales — Consulta de documentos
          </p>
        </div>
      </header>

      <main className='mx-auto w-full max-w-4xl px-6 py-10'>
        <div className=' flex justify-end  mb-5'>
          <div className='flex gap-2 items-center '>
            <Label htmlFor='buscador'>
              <svg
                width='30'
                height='30'
                viewBox='0 0 15 15'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  className=' text-(--app-background)!'
                  d='M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z'
                  fill='currentColor'
                  fill-rule='evenodd'
                  clip-rule='evenodd'
                ></path>
              </svg>
            </Label>
            <Input
              id='buscador'
              className='bg-(--app-background) text-(--app-foreground)! w-60 border-gray-400'
              placeholder='Buscar...'
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>
        </div>
        <Card className='border-gray-400 shadow-sm bg-(--app-background)'>
          <CardHeader>
            <CardTitle className='text-xl title'>
              Documentos recibidos
            </CardTitle>
            <CardDescription>
              Busque, visualice o descargue documentos cifrados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              <div className='space-y-3' id='lista-documentos'>
                {cargando ? (
                  <Alert
                    id='mensaje-lista'
                    className='border-gray-300 bg-(--app-foreground-traslucent)!'
                  >
                    <AlertTitle className='text-(--app-background)!'>
                      Cargando...
                    </AlertTitle>
                    <AlertDescription className='text-(--app-background)!'>
                      Espera un momento mientras obtenemos los documentos.
                    </AlertDescription>
                  </Alert>
                ) : error ? (
                  <Alert
                    id='mensaje-lista'
                    className='border-gray-300 bg-(--app-foreground-traslucent)!'
                  >
                    <AlertTitle className='text-destructive!'>
                      Error al cargar los documentos
                    </AlertTitle>
                    <AlertDescription className='text-destructive!'>
                      {error}
                    </AlertDescription>
                  </Alert>
                ) : documentos.length === 0 ? (
                  <Alert
                    id='mensaje-lista'
                    className='border-gray-300 bg-(--app-foreground-traslucent)!'
                  >
                    <AlertTitle className='text-(--app-background)!'>
                      No hay documentos
                    </AlertTitle>
                    <AlertDescription className='text-(--app-background)!'>
                      Aún no se han recibido documentos para mostrar.
                    </AlertDescription>
                  </Alert>
                ) : (
                  documentos.map((doc) => (
                    <div
                      key={doc.id}
                      className='flex flex-col gap-3 rounded-lg border border-gray-300 bg-(--app-foreground-traslucent)! p-4 text-(--app-background)! sm:flex-row sm:items-center sm:justify-between'
                    >
                      <div>
                        <span className='block font-semibold text-(--app-background)!'>
                          {doc.nombreOriginal || 'Documento sin nombre'}
                        </span>
                        <span className='mt-1 block text-sm text-slate-700 text-(--app-background)!'>
                          {formatearFecha(doc.fechaRecepcion)}
                        </span>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <Button
                          type='button'
                          className=' w-5 bg-transparent! border border-slate-400 text-slate-800 hover:bg-slate-200!'
                          onClick={() => abrirDesencriptado(doc.id, false)}
                        >
                          <svg
                            width='15'
                            height='15'
                            viewBox='0 0 15 15'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                          >
                            <path
                              className='text-(--app-background)!'
                              d='M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z'
                              fill='currentColor'
                              fill-rule='evenodd'
                              clip-rule='evenodd'
                            ></path>
                          </svg>
                        </Button>
                        <Button
                          type='button'
                          className=' w-5 bg-slate-900! hover:bg-slate-800!'
                          onClick={() => abrirDesencriptado(doc.id, true)}
                        >
                          <svg
                            width='15'
                            height='15'
                            viewBox='0 0 15 15'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                          >
                            <path
                              d='M7.50005 1.04999C7.74858 1.04999 7.95005 1.25146 7.95005 1.49999V8.41359L10.1819 6.18179C10.3576 6.00605 10.6425 6.00605 10.8182 6.18179C10.994 6.35753 10.994 6.64245 10.8182 6.81819L7.81825 9.81819C7.64251 9.99392 7.35759 9.99392 7.18185 9.81819L4.18185 6.81819C4.00611 6.64245 4.00611 6.35753 4.18185 6.18179C4.35759 6.00605 4.64251 6.00605 4.81825 6.18179L7.05005 8.41359V1.49999C7.05005 1.25146 7.25152 1.04999 7.50005 1.04999ZM2.5 10C2.77614 10 3 10.2239 3 10.5V12C3 12.5539 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2239 12.2239 10 12.5 10C12.7761 10 13 10.2239 13 10.5V12C13 13.1041 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2239 2.22386 10 2.5 10Z'
                              fill='currentColor'
                              fill-rule='evenodd'
                              clip-rule='evenodd'
                            ></path>
                          </svg>
                        </Button>
                        <Button
                          type='button'
                          className=' w-5 bg-red-600! hover:bg-red-700!'
                          onClick={() => eliminarDocumento(doc.id)}
                        >
                          <svg
                            width='15'
                            height='15'
                            viewBox='0 0 15 15'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                          >
                            <path
                              d='M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H5H10H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4L3.5 4C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z'
                              fill='currentColor'
                              fill-rule='evenodd'
                              clip-rule='evenodd'
                            ></path>
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default App;
