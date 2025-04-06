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
    // Verificação de segurança para garantir que o ID é válido
    if (!eventoId || isNaN(eventoId) || eventoId <= 0) {
      alert('ID do evento inválido: ' + eventoId);
      setOpen(false);
      return;
    }

    setLoading(true);
    
    try {
      // Log para depuração
      console.log(`Enviando solicitação para finalizar evento com ID: ${eventoId} (${typeof eventoId})`);
      
      // Converter explicitamente o ID para número
      const idNumerico = Number(eventoId);
      console.log(`ID numérico convertido: ${idNumerico}`);
      
      // Construir a URL com o ID convertido
      const url = buildApiUrl(`eventos/${idNumerico}/finalizar`);
      console.log(`URL da requisição: ${url}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: idNumerico  // Incluir o ID explicitamente no corpo
        }),
      });
      
      if (response.ok) {
        // Fechar o diálogo e atualizar a página
        console.log('Evento finalizado com sucesso!');
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