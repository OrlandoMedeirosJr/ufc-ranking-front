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
    // Verificar se o ID é válido
    if (!eventoId || isNaN(eventoId)) {
      alert('ID do evento inválido. Por favor, recarregue a página e tente novamente.');
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      console.log(`Enviando solicitação para excluir evento com ID: ${eventoId}`);
      
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
        const errorText = await response.text();
        console.error('Erro ao excluir evento:', errorText);
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
        <Button 
          variant="destructive" 
          className="h-10 flex items-center space-x-2"
          onClick={() => console.log('Botão Excluir clicado para evento ID:', eventoId)}
        >
          <Trash className="h-4 w-4" />
          <span>Excluir</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza que deseja excluir este evento?</AlertDialogTitle>
          <p className="text-sm text-gray-500">
            Esta ação não pode ser desfeita. Todas as lutas associadas a este evento também serão excluídas.
          </p>
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