'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogContent, AlertDialogCancel, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { buildApiUrl } from '@/config/api';

interface BotaoExcluirProps {
  eventoId: number;
}

export default function BotaoExcluir({ eventoId }: BotaoExcluirProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`eventos/${eventoId}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        // Fechar o diálogo e redirecionar
        setOpen(false);
        router.push('/eventos');
        router.refresh();
      } else {
        console.error('Erro ao excluir evento:', await response.text());
        alert('Ocorreu um erro ao excluir o evento. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      alert('Ocorreu um erro ao excluir o evento. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="h-10 flex items-center space-x-2">
          <Trash className="h-4 w-4" />
          <span>Excluir</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza que deseja excluir este evento?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Excluindo...' : 'Excluir Permanentemente'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 