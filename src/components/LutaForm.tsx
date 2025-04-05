import React from 'react';

// Tipos de dados para a luta
export interface Luta {
  id?: number;
  lutador1: string;
  lutador2: string;
  resultado: string; // V1, V2, Empate, NC
  tipo: string; // Nocaute, Finalização, Decisão Unânime, Decisão Dividida, Desclassificação
  round: string; // 1 a 5
  titulo: boolean; // Disputa de título? (Sim/Não)
  bonus: string; // Performance da Noite, Luta da Noite, Nenhum
  categoria: string; // Categoria da luta
}

// Props do componente
interface LutaFormProps {
  luta: Luta;
  index: number;
  onChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onRemove: (index: number) => void;
}

// Constantes para opções dos campos
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
  'Peso Leve Feminino',
  'Peso Casado'
];

const resultados = [
  'V1', // Vitória Lutador 1
  'V2', // Vitória Lutador 2
  'Empate',
  'NC' // No Contest (Sem Resultado)
];

const tiposVitoria = [
  'Nocaute',
  'Finalização',
  'Decisão Unânime',
  'Decisão Dividida',
  'Desclassificação'
];

const opcoesBonus = [
  'Performance da Noite',
  'Luta da Noite', 
  'Nenhum'
];

// Componente do formulário de luta
const LutaForm: React.FC<LutaFormProps> = ({ luta, index, onChange, onRemove }) => {
  return (
    <div className="p-4 my-4 border rounded-md bg-gray-50 relative">
      {/* Botão de remover luta */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
        title="Remover luta"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* ID da luta se existir (somente exibição) */}
      {luta.id && (
        <div className="text-xs text-gray-500 mb-3">
          ID: {luta.id}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Lutador 1 */}
        <div>
          <label className="block mb-1 text-sm font-medium" htmlFor={`lutador1-${index}`}>
            Lutador 1
          </label>
          <input
            type="text"
            id={`lutador1-${index}`}
            name="lutador1"
            value={luta.lutador1}
            onChange={(e) => onChange(index, e)}
            className="w-full p-2 border rounded text-sm"
            placeholder="Nome do lutador 1"
          />
        </div>

        {/* Lutador 2 */}
        <div>
          <label className="block mb-1 text-sm font-medium" htmlFor={`lutador2-${index}`}>
            Lutador 2
          </label>
          <input
            type="text"
            id={`lutador2-${index}`}
            name="lutador2"
            value={luta.lutador2}
            onChange={(e) => onChange(index, e)}
            className="w-full p-2 border rounded text-sm"
            placeholder="Nome do lutador 2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Categoria de peso */}
        <div>
          <label className="block mb-1 text-sm font-medium" htmlFor={`categoria-${index}`}>
            Categoria de Peso
          </label>
          <select
            id={`categoria-${index}`}
            name="categoria"
            value={luta.categoria}
            onChange={(e) => onChange(index, e)}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="">Selecione a Categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>

        {/* Resultado */}
        <div>
          <label className="block mb-1 text-sm font-medium" htmlFor={`resultado-${index}`}>
            Resultado
          </label>
          <select
            id={`resultado-${index}`}
            name="resultado"
            value={luta.resultado}
            onChange={(e) => onChange(index, e)}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="">Selecione o Resultado</option>
            {resultados.map((resultado) => (
              <option key={resultado} value={resultado}>
                {resultado === 'V1' ? `Vitória de ${luta.lutador1 || 'Lutador 1'}` :
                  resultado === 'V2' ? `Vitória de ${luta.lutador2 || 'Lutador 2'}` :
                  resultado}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Só mostra os detalhes do resultado se houver um resultado selecionado */}
      {luta.resultado && luta.resultado !== '' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Tipo de vitória */}
          <div>
            <label className="block mb-1 text-sm font-medium" htmlFor={`tipo-${index}`}>
              Método
            </label>
            <select
              id={`tipo-${index}`}
              name="tipo"
              value={luta.tipo}
              onChange={(e) => onChange(index, e)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="">Selecione o Tipo</option>
              {tiposVitoria.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          {/* Round */}
          <div>
            <label className="block mb-1 text-sm font-medium" htmlFor={`round-${index}`}>
              Round
            </label>
            <select
              id={`round-${index}`}
              name="round"
              value={luta.round}
              onChange={(e) => onChange(index, e)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="">Selecione o Round</option>
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Round {i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Bônus */}
          <div>
            <label className="block mb-1 text-sm font-medium" htmlFor={`bonus-${index}`}>
              Bônus
            </label>
            <select
              id={`bonus-${index}`}
              name="bonus"
              value={luta.bonus}
              onChange={(e) => onChange(index, e)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="">Selecione o Bônus</option>
              {opcoesBonus.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Luta de título */}
      {luta.resultado && luta.resultado !== '' && (
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="titulo"
              checked={luta.titulo}
              onChange={(e) => onChange(index, e)}
              className="mr-2"
            />
            <span className="text-sm font-medium">Disputa de Título</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Marque essa opção se essa luta for uma disputa de cinturão
          </p>
        </div>
      )}
    </div>
  );
};

export default LutaForm; 