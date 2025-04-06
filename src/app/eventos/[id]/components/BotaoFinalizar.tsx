'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogContent, AlertDialogCancel, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { FlagIcon } from 'lucide-react';
import { buildApiUrl } from '@/config/api';

interface BotaoFinalizarProps {
  eventoId: number;
  finalizado?: boolean;
}

export default function BotaoFinalizar({ eventoId, finalizado = false }: BotaoFinalizarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleFinalizar = async () => {
    // Verificar se o ID é válido
    if (!eventoId || isNaN(eventoId)) {
      alert('ID do evento inválido. Por favor, recarregue a página e tente novamente.');
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      console.log(`Enviando solicitação para finalizar evento com ID: ${eventoId}`);
      
      const response = await fetch(buildApiUrl(`eventos/${eventoId}/finalizar`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Fechar o diálogo e atualizar a página
        setOpen(false);
        router.refresh();
      } else {
        const errorText = await response.text();
        console.error('Erro ao finalizar evento:', errorText);
        alert('Ocorreu um erro ao finalizar o evento. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao finalizar evento:', error);
      alert('Ocorreu um erro ao finalizar o evento. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant={finalizado ? "outline" : "secondary"} 
          className="h-10 flex items-center space-x-2"
          onClick={() => console.log('Botão Finalizar clicado para evento ID:', eventoId)}
        >
          <FlagIcon className="h-4 w-4" />
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
          <p className="text-sm text-gray-500">
            {finalizado
              ? 'O evento ficará disponível para edições novamente.'
              : 'O evento será marcado como concluído e os rankings serão atualizados.'}
          </p>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button 
            variant={finalizado ? "outline" : "secondary"} 
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