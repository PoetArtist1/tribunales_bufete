import { useRef, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import './App.css';
import Logo from '@/assets/logo.png';

const API_BASE = (import.meta.env.VITE_EMISOR_API_BASE || '').trim();

function App() {
  const [nombreOriginal, setNombreOriginal] = useState('');
  const [enviando, setEnviando] = useState(false);
  const formRef = useRef(null);
  const fileRef = useRef(null);
  const toastTheme = {
    style: {
      background: 'var(--app-background)',
      color: 'var(--app-foreground)',
      border: '1px solid var(--app-foreground-traslucent)',
    },
    // iconTheme: {
    //   primary: 'var(--app-foreground)',
    //   secondary: 'var(--app-background)',
    // },
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const archivo = fileRef.current?.files?.[0];
    if (!archivo) {
      toast.error('Seleccione un archivo.', toastTheme);
      return;
    }

    setEnviando(true);
    const formData = new FormData();
    formData.append('archivo', archivo);
    if (nombreOriginal.trim()) {
      formData.append('nombreOriginal', nombreOriginal.trim());
    }

    try {
      const endpoint = `${API_BASE}/api/enviar`;
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(
          data.error || res.statusText || 'Error al enviar.',
          toastTheme,
        );
        return;
      }

      toast.success(`Documento enviado correctamente`, toastTheme);

      setNombreOriginal('');
      if (fileRef.current) {
        fileRef.current.value = '';
      }
      formRef.current?.reset?.();
    } catch (err) {
      toast.error(`Error de red o servidor: ${err.message}`, toastTheme);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className='min-h-screen w-full'>
      <header className='flex flex-row w-full border-b border-gray-400 bg-(--app-background)'>
        <img
          src={Logo}
          alt='Logo del sistema'
          className='h-18 w-18 object-contain ml-10 my-auto -mr-10'
        />
        <div className='w-full px-6 py-6 text-center'>
          <div className='text-4xl font-semibold text-slate-800 title'>
            Sistema Emisor de Documentos Jurídicos
          </div>
          <p className='mt-5 text-sm text-slate-500 subtitle font-semibold text-traslucent'>
            Bufete — Envío a tribunales
          </p>
        </div>
      </header>

      <main className='mx-auto w-full max-w-4xl px-6 py-10'>
        <div>
          <Toaster position='top-center' reverseOrder={false} />
        </div>
        <Card className='border-gray-400 shadow-sm bg-(--app-background)'>
          <CardHeader>
            <CardTitle className='text-xl subtitle'>Enviar documento</CardTitle>
            <CardDescription>
              Adjunte un archivo y, si lo desea, indique un nombre visible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className='space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='archivo'>Archivo</Label>
                <Input
                  id='archivo'
                  className='cursor-pointer bg-(--app-foreground-traslucent) text-(--app-background)!'
                  name='archivo'
                  type='file'
                  ref={fileRef}
                  required
                  accept='*'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='nombreOriginal'>
                  Nombre a mostrar (opcional)
                </Label>
                <Input
                  id='nombreOriginal'
                  name='nombreOriginal'
                  className='bg-(--app-foreground-traslucent) text-(--app-background)!'
                  type='text'
                  placeholder='Dejar vacío para usar el nombre del archivo'
                  value={nombreOriginal}
                  onChange={(event) => setNombreOriginal(event.target.value)}
                />
              </div>
              <div className='flex items-center gap-3'>
                <Button
                  type='submit'
                  disabled={enviando}
                  className='bg-(--app-primary)! hover:bg-(--app-accent)! mt-5 shadow-lg shadow-gray-900 hover:shadow-xl text-(--black)! transition-colors duration-200'
                >
                  {enviando ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default App;
