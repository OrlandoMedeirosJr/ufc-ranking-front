'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogContent, AlertDialogCancel, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { apiDelete, buildApiUrl } from '@/config/api';

interface BotaoExcluirProps {
  eventoId: number;
}

export default function BotaoExcluir({ eventoId }: BotaoExcluirProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleDelete = async () => {
    // Verificar se o ID é válido
    if (!eventoId || isNaN(eventoId)) {
      setErro('ID do evento inválido. Por favor, recarregue a página e tente novamente.');
      return;
    }

    setLoading(true);
    setErro(null);
    
    let tentativas = 0;
    const maxTentativas = 3;
    
    while (tentativas < maxTentativas) {
      try {
        console.log(`Tentativa ${tentativas + 1} para excluir evento com ID: ${eventoId}`);
        
        // Primeira tentativa com a função auxiliar apiDelete
        try {
          const response = await apiDelete(`eventos/${eventoId}`);
          
          if (response.ok) {
            console.log(`Evento ${eventoId} excluído com sucesso!`);
            // Fechar o diálogo e redirecionar
            setOpen(false);
            router.push('/eventos');
            router.refresh();
            return; // Sai do loop se bem-sucedido
          } else {
            const errorText = await response.text();
            console.error(`Erro na resposta da API: ${response.status} - ${errorText}`);
            
            // Se tivermos erro HTTP mas não de conexão, não retente automaticamente
            if (response.status >= 400 && response.status < 500) {
              setErro(`Erro ao excluir evento: ${response.status} - ${response.statusText}. ${errorText}`);
              break; // Não tenta novamente para erros do cliente (4xx)
            }
          }
        } catch (error) {
          console.error(`Falha ao usar apiDelete. Tentando com URL direta.`, error);
          
          // Segunda tentativa com URL direta como backup
          try {
            const url = `http://localhost:3334/eventos/${eventoId}`;
            console.log(`Tentando excluir com URL direta: ${url}`);
            
            const directResponse = await fetch(url, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              cache: 'no-store',
              mode: 'cors',
              credentials: 'omit'
            });
            
            if (directResponse.ok) {
              console.log(`Evento ${eventoId} excluído com sucesso usando URL direta!`);
              setOpen(false);
              router.push('/eventos');
              router.refresh();
              return; // Sai do loop se bem-sucedido
            } else {
              const errorText = await directResponse.text();
              console.error(`Erro com URL direta: ${directResponse.status} - ${errorText}`);
              
              // Se tivermos erro HTTP mas não de conexão, não retente automaticamente
              if (directResponse.status >= 400 && directResponse.status < 500) {
                setErro(`Erro ao excluir evento: ${directResponse.status} - ${directResponse.statusText}. ${errorText}`);
                break; // Não tenta novamente para erros do cliente (4xx)
              }
            }
          } catch (directError) {
            console.error(`Também falhou com URL direta:`, directError);
          }
        }
        
        // Aumenta o tempo de espera entre as tentativas
        tentativas++;
        if (tentativas < maxTentativas) {
          const tempoEspera = tentativas * 1000;
          console.log(`Aguardando ${tempoEspera}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, tempoEspera));
        }
      } catch (outerError) {
        console.error('Erro não tratado:', outerError);
        tentativas++;
        if (tentativas < maxTentativas) {
          await new Promise(resolve => setTimeout(resolve, tentativas * 1000));
        }
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam
    if (!erro) {
      setErro(`Não foi possível excluir o evento após ${maxTentativas} tentativas. Verifique sua conexão.`);
    }
    
    setLoading(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="h-10 flex items-center space-x-2"
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
        
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {erro}
          </div>
        )}
        
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