'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogContent, AlertDialogCancel, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { FlagIcon } from '@heroicons/react/24/outline';
import { apiPut } from '@/config/api';

interface BotaoFinalizarProps {
  eventoId: string;
  finalizado: boolean;
}

export default function BotaoFinalizar({ eventoId, finalizado }: BotaoFinalizarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleFinalizar = async () => {
    setLoading(true);
    try {
      const response = await apiPut(`eventos/${eventoId}/finalizar`, {
        finalizado: !finalizado
      });
      
      if (response.ok) {
        // Fechar o diálogo e atualizar a página
        setOpen(false);
        router.refresh();
      } else {
        console.error('Erro ao alterar status do evento:', await response.text());
        alert('Ocorreu um erro ao alterar o status do evento. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao alterar status do evento:', error);
      alert('Ocorreu um erro ao alterar o status do evento. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant={finalizado ? "default" : "secondary"} 
          className="h-10 flex items-center space-x-2"
        >
          <FlagIcon className="h-5 w-5" />
          <span>{finalizado ? 'Reabrir Evento' : 'Finalizar Evento'}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {finalizado 
              ? 'Tem certeza que deseja reabrir este evento?' 
              : 'Tem certeza que deseja finalizar este evento?'}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button 
            variant={finalizado ? "default" : "secondary"} 
            onClick={handleFinalizar} 
            disabled={loading}
          >
            {loading ? 'Processando...' : finalizado ? 'Reabrir Evento' : 'Finalizar Evento'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 