'use client'

import { useRouter } from 'next/navigation';

export default function BotaoFinalizar({ id }: { id: string }) {
  const router = useRouter();

  const handleFinalizar = async () => {
    if (!window.confirm('Tem certeza que deseja finalizar este evento? Depois de finalizado, não será possível modificar as lutas ou seus resultados.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3333/eventos/${id}/finalizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Evento finalizado com sucesso!');
        // Recarrega a página para mostrar o status atualizado
        window.location.reload();
      } else {
        const data = await response.json();
        alert(`Erro ao finalizar evento: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao finalizar evento:', error);
      alert('Erro ao finalizar evento. Verifique o console para mais detalhes.');
    }
  };

  return (
    <button
      onClick={handleFinalizar}
      className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm flex items-center justify-center"
      title="Finalizar evento"
    >
      ✓ Finalizar
    </button>
  );
} 