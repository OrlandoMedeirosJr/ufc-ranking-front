'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Lutador {
  id: number;
  nome: string;
  pais: string;
}

interface Evento {
  id: number;
  nome: string;
}

interface FormData {
  categoria: string;
  lutador1Id: number;
  lutador2Id: number;
  resultado?: string;
}

export default function NovaLutaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [lutadores, setLutadores] = useState<Lutador[]>([]);

  const [formData, setFormData] = useState<FormData>({
    categoria: '',
    lutador1Id: 0,
    lutador2Id: 0,
    resultado: ''
  });

  // Lista de categorias do UFC
  const categorias = [
    'Peso Mosca',
    'Peso Galo',
    'Peso Pena',
    'Peso Leve',
    'Peso Meio-Médio',
    'Peso Médio',
    'Peso Meio-Pesado',
    'Peso Pesado',
    'Peso Palha Feminino',
    'Peso Mosca Feminino',
    'Peso Galo Feminino',
    'Peso Pena Feminino',
    'Peso Leve Feminino'
  ];

  useEffect(() => {
    const buscarDados = async () => {
      try {
        // Dados de exemplo para fallback
        const eventosExemplo: Record<string, Evento> = {
          "1": { id: 1, nome: "UFC 299: O'Malley vs. Dvalishvili" },
          "2": { id: 2, nome: "UFC Fight Night: Cannonier vs. Imavov" }
        };

        // Simular lutadores para desenvolvimento
        const lutadoresExemplo: Lutador[] = [
          { id: 1, nome: "Sean O'Malley", pais: "EUA" },
          { id: 2, nome: "Merab Dvalishvili", pais: "Geórgia" },
          { id: 3, nome: "Gilbert Burns", pais: "Brasil" },
          { id: 4, nome: "Jack Della Maddalena", pais: "Austrália" },
          { id: 5, nome: "Jared Cannonier", pais: "EUA" },
          { id: 6, nome: "Nassourdine Imavov", pais: "França" },
          { id: 7, nome: "Renato Moicano", pais: "Brasil" },
          { id: 8, nome: "Drew Dober", pais: "EUA" },
          { id: 9, nome: "Alexandre Pantoja", pais: "Brasil" },
          { id: 10, nome: "Brandon Moreno", pais: "México" }
        ];

        // Buscar evento
        let eventoData: Evento | null = null;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          const resEvento = await fetch(`http://localhost:3333/eventos/${params.id}`, { 
            cache: "no-store",
            signal: controller.signal
          }).catch(() => null);
          
          clearTimeout(timeoutId);
          
          if (resEvento && resEvento.ok) {
            const dadosDaApi = await resEvento.json();
            if (dadosDaApi && dadosDaApi.id) {
              eventoData = dadosDaApi;
            }
          }
        } catch (err) {
          console.error("Erro ao buscar evento da API:", err);
        }

        // Se não encontrou na API, usar dados de exemplo
        if (!eventoData && eventosExemplo[params.id]) {
          eventoData = eventosExemplo[params.id];
          console.warn("Usando dados de exemplo para o evento");
        }

        if (!eventoData) {
          throw new Error('Evento não encontrado');
        }

        setEvento(eventoData);

        // Buscar lutadores
        let lutadoresData: Lutador[] = [];
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          const resLutadores = await fetch(`http://localhost:3333/lutadores`, { 
            cache: "no-store",
            signal: controller.signal
          }).catch(() => null);
          
          clearTimeout(timeoutId);
          
          if (resLutadores && resLutadores.ok) {
            const dadosDaApi = await resLutadores.json();
            if (Array.isArray(dadosDaApi) && dadosDaApi.length > 0) {
              lutadoresData = dadosDaApi;
            }
          }
        } catch (err) {
          console.error("Erro ao buscar lutadores da API:", err);
        }

        // Se não encontrou na API, usar dados de exemplo
        if (lutadoresData.length === 0) {
          lutadoresData = lutadoresExemplo;
          console.warn("Usando dados de exemplo para lutadores");
        }

        setLutadores(lutadoresData);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados iniciais');
        console.error('Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    buscarDados();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name.endsWith('Id') ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validação básica
      if (!formData.categoria || !formData.lutador1Id || !formData.lutador2Id) {
        throw new Error('Categoria e ambos os lutadores são obrigatórios');
      }

      if (formData.lutador1Id === formData.lutador2Id) {
        throw new Error('Os lutadores devem ser diferentes');
      }

      const lutaData = {
        ...formData,
        eventoId: parseInt(params.id),
        // Enviar resultado apenas se estiver preenchido
        resultado: formData.resultado || undefined
      };

      const response = await fetch('http://localhost:3333/lutas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lutaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar luta');
      }

      // Redirecionar para a página do evento
      router.push(`/eventos/${params.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao criar a luta');
      console.error('Erro ao criar luta:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !evento) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded border border-red-300">
        <h2 className="text-xl font-bold mb-2">Erro</h2>
        <p>{error}</p>
        <Link href="/eventos" className="mt-4 inline-block text-blue-600 hover:underline">
          Voltar para a lista de eventos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link href={`/eventos/${params.id}`} className="text-blue-600 hover:text-blue-800 mr-2">
          ← Voltar para o evento
        </Link>
        <h2 className="text-2xl font-bold">Adicionar Nova Luta</h2>
      </div>

      {evento && (
        <div className="mb-6 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-blue-800">
            <strong>Evento:</strong> {evento.nome}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-4">
          <label className="block mb-2 font-medium" htmlFor="categoria">
            Categoria
          </label>
          <select
            id="categoria"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Selecione uma categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-medium" htmlFor="lutador1Id">
              Lutador 1
            </label>
            <select
              id="lutador1Id"
              name="lutador1Id"
              value={formData.lutador1Id || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Selecione o lutador 1</option>
              {lutadores.map((lutador) => (
                <option key={`l1-${lutador.id}`} value={lutador.id}>
                  {lutador.nome} ({lutador.pais})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium" htmlFor="lutador2Id">
              Lutador 2
            </label>
            <select
              id="lutador2Id"
              name="lutador2Id"
              value={formData.lutador2Id || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Selecione o lutador 2</option>
              {lutadores.map((lutador) => (
                <option key={`l2-${lutador.id}`} value={lutador.id}>
                  {lutador.nome} ({lutador.pais})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium" htmlFor="resultado">
            Resultado (opcional)
          </label>
          <textarea
            id="resultado"
            name="resultado"
            value={formData.resultado || ''}
            onChange={handleChange}
            placeholder="Ex: Vitória por nocaute técnico para Silva no round 2"
            className="w-full p-2 border rounded"
            rows={3}
          />
          <p className="mt-1 text-sm text-gray-500">
            Deixe em branco se a luta ainda não aconteceu
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded ${
              submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            } transition-colors`}
          >
            {submitting ? 'Salvando...' : 'Salvar Luta'}
          </button>
          
          <Link
            href={`/eventos/${params.id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
} 