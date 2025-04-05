'use client'

import { useRouter } from 'next/navigation';

export default function BotaoExcluir({ id }: { id: string }) {
  const router = useRouter();

  const handleExcluir = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3333/eventos/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Evento excluído com sucesso!');
        router.push('/eventos');
      } else {
        const data = await response.json();
        alert(`Erro ao excluir evento: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      alert('Erro ao excluir evento. Verifique o console para mais detalhes.');
    }
  };

  return (
    <button
      onClick={handleExcluir}
      className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
      title="Excluir evento"
    >
      🗑️ Excluir
    </button>
  );
} 