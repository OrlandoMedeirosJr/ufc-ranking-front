'use client';

import React, { useState, useEffect } from 'react';

// Tipos de dados para a luta
export interface Luta {
  id?: number;
  lutador1: string;
  lutador2: string;
  resultado: string; // V1, V2, Empate, NC
  tipo: string; // Nocaute, Finalização, Decisão Unânime, Decisão Dividida, Desclassificação
  round: string; // 1 a 5
  titulo: boolean; // Disputa de título? (Sim/Não)
  bonus: string[]; // Array de bônus: ["Performance da Noite", "Luta da Noite"]
  categoria: string; // Categoria da luta
}

interface InfoRanking {
  lutador: {
    id: number;
    nome: string;
    categoriaAtual: string;
  };
  ranking: {
    pesoPorPeso: number | null;
    categoria: {
      nome: string;
      posicao: number;
    } | null;
  };
  sequencia: {
    tipo: string;
    quantidade: number;
    descricao: string;
  };
}

// Props do componente
interface LutaFormProps {
  luta?: Luta;
  initialData?: {
    lutadorA: any;
    lutadorB: any;
    categoria: string;
    disputaTitulo: boolean;
    resultado?: {
      vencedor: string;
      metodo: string;
      round: number;
      tempo: string;
      bonusLuta: boolean;
      bonusPerformance: boolean;
    };
  };
  index?: number;
  onChange?: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onRemove?: (index: number) => void;
  onSubmit?: (data: any) => void;
  isEditing?: boolean;
  camposEmVerificacao?: Record<string, boolean>;
  lutadoresReadOnly?: boolean; // Nova propriedade para impedir edição dos nomes dos lutadores
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
const LutaForm: React.FC<LutaFormProps> = ({ 
  luta, 
  initialData,
  index = 0, 
  onChange, 
  onRemove, 
  onSubmit,
  isEditing = false,
  camposEmVerificacao = {},
  lutadoresReadOnly = false 
}) => {
  const [infoLutador1, setInfoLutador1] = useState<InfoRanking | null>(null);
  const [infoLutador2, setInfoLutador2] = useState<InfoRanking | null>(null);
  const [carregandoInfo1, setCarregandoInfo1] = useState(false);
  const [carregandoInfo2, setCarregandoInfo2] = useState(false);
  
  // Estado interno para quando usamos initialData
  const [formData, setFormData] = useState<any>(() => {
    if (initialData) {
      // Converter initialData para o formato interno
      return {
        lutador1: initialData.lutadorA?.nome || '',
        lutador2: initialData.lutadorB?.nome || '',
        categoria: initialData.categoria || '',
        titulo: initialData.disputaTitulo || false,
        resultado: initialData.resultado ? (
          initialData.resultado.vencedor === 'lutadorA' ? 'V1' :
          initialData.resultado.vencedor === 'lutadorB' ? 'V2' :
          initialData.resultado.vencedor === 'empate' ? 'Empate' :
          initialData.resultado.vencedor === 'nocontest' ? 'NC' : ''
        ) : '',
        tipo: initialData.resultado?.metodo || '',
        round: initialData.resultado?.round ? String(initialData.resultado.round) : '',
        bonus: [
          ...(initialData.resultado?.bonusLuta ? ['Luta da Noite'] : []),
          ...(initialData.resultado?.bonusPerformance ? ['Performance da Noite'] : [])
        ]
      };
    }
    // Se não tiver initialData, usar luta ou objeto vazio
    return luta || {
      lutador1: '',
      lutador2: '', 
      categoria: '',
      resultado: '',
      tipo: '',
      round: '',
      titulo: false,
      bonus: []
    };
  });

  // Handler para mudanças no formulário interno
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Se for checkbox, usar checked
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  // Handler para submissão do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onSubmit) {
      // Converter formData para o formato esperado pela API
      const dataToSubmit = {
        lutadorA: initialData?.lutadorA || { nome: formData.lutador1 },
        lutadorB: initialData?.lutadorB || { nome: formData.lutador2 },
        categoria: formData.categoria,
        disputaTitulo: formData.titulo,
      };
      
      // Adicionar resultado se houver
      if (formData.resultado) {
        dataToSubmit.resultado = {
          vencedor: formData.resultado === 'V1' ? 'lutadorA' :
                   formData.resultado === 'V2' ? 'lutadorB' :
                   formData.resultado === 'Empate' ? 'empate' : 'nocontest',
          metodo: formData.tipo,
          round: formData.round ? parseInt(formData.round) : undefined,
          // Sempre enviar explicitamente os valores dos bônus, mesmo que sejam false
          bonusLuta: Array.isArray(formData.bonus) && formData.bonus.includes('Luta da Noite'),
          bonusPerformance: Array.isArray(formData.bonus) && formData.bonus.includes('Performance da Noite')
        };
      }
      
      console.log('Enviando dados do formulário:', dataToSubmit);
      onSubmit(dataToSubmit);
    }
  };
  
  // Usar dados do luta OU formData (que foi inicializado com luta ou initialData)
  const dadosLuta = luta || formData;
  
  // Converter o valor do bonus para array se for string (compatibilidade com dados existentes)
  useEffect(() => {
    if (luta && luta.bonus && !Array.isArray(luta.bonus)) {
      const bonusArray = luta.bonus === 'Nenhum' ? [] : [luta.bonus];
      if (onChange) {
        onChange(index, {
          target: {
            name: 'bonus',
            value: bonusArray
          }
        } as any);
      }
    } else if (luta && !luta.bonus && onChange) {
      onChange(index, {
        target: {
          name: 'bonus',
          value: []
        }
      } as any);
    }
  }, [luta, onChange, index]);

  useEffect(() => {
    // Limpar os timeouts ao desmontar o componente
    const timeouts: NodeJS.Timeout[] = [];
    
    // Buscar informações de ranking quando o lutador é preenchido e categoria selecionada
    if (dadosLuta.lutador1 && dadosLuta.lutador1.trim().length >= 3 && !camposEmVerificacao[`${index}-lutador1`]) {
      // Debounce para evitar muitas requisições enquanto o usuário digita
      const timeout = setTimeout(() => {
        buscarInfoLutador(dadosLuta.lutador1, 1);
      }, 500);
      timeouts.push(timeout);
    } else if (!dadosLuta.lutador1 || dadosLuta.lutador1.trim().length < 3) {
      setInfoLutador1(null);
    }
    
    if (dadosLuta.lutador2 && dadosLuta.lutador2.trim().length >= 3 && !camposEmVerificacao[`${index}-lutador2`]) {
      // Debounce para evitar muitas requisições enquanto o usuário digita
      const timeout = setTimeout(() => {
        buscarInfoLutador(dadosLuta.lutador2, 2);
      }, 500);
      timeouts.push(timeout);
    } else if (!dadosLuta.lutador2 || dadosLuta.lutador2.trim().length < 3) {
      setInfoLutador2(null);
    }
    
    // Cleanup function
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [dadosLuta.lutador1, dadosLuta.lutador2, dadosLuta.categoria, camposEmVerificacao, index]);
  
  const buscarInfoLutador = async (nome: string, lutadorNumero: 1 | 2) => {
    try {
      if (lutadorNumero === 1) {
        setCarregandoInfo1(true);
      } else {
        setCarregandoInfo2(true);
      }
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      
      // Criar um controller para abortar a requisição se demorar muito
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(`${API_URL}/lutadores/${encodeURIComponent(nome)}/info-ranking`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 404) {
            // Lutador não encontrado - limpar os dados
            if (lutadorNumero === 1) {
              setInfoLutador1(null);
            } else {
              setInfoLutador2(null);
            }
            return;
          }
          throw new Error('Falha ao carregar informações de ranking');
        }
        
        const data = await response.json();
        
        if (lutadorNumero === 1) {
          setInfoLutador1(data);
        } else {
          setInfoLutador2(data);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.warn(`Requisição de info-ranking para ${nome} cancelada por timeout`);
        } else {
          throw err;
        }
      }
    } catch (error) {
      console.error(`Erro ao buscar informações do lutador ${lutadorNumero}:`, error);
    } finally {
      if (lutadorNumero === 1) {
        setCarregandoInfo1(false);
      } else {
        setCarregandoInfo2(false);
      }
    }
  };
  
  // Função para renderizar a informação de ranking
  const renderizarInfoRanking = (info: InfoRanking | null, categoria: string) => {
    if (!info) return null;
    
    let infoCategoria = null;
    if (info.ranking.categoria && categoria && categoria !== 'Peso Casado') {
      // Verificar se a categoria do ranking é a mesma da luta
      if (info.ranking.categoria.nome === categoria) {
        infoCategoria = `#${info.ranking.categoria.posicao} ${categoria}`;
      }
    }
    
    return (
      <div className="mt-1 flex flex-wrap gap-1 items-center">
        {info.ranking.pesoPorPeso && (
          <div className="bg-yellow-100 px-2 py-1 rounded-md text-yellow-800 font-medium flex items-center">
            <span className="mr-1 text-sm">#</span>
            <span>{info.ranking.pesoPorPeso}</span>
            <span className="ml-1 text-xs">P4P</span>
          </div>
        )}
        
        {infoCategoria && (
          <div className="bg-blue-100 px-2 py-1 rounded-md text-blue-800 font-medium flex items-center">
            <span className="mr-1 text-sm">#</span>
            <span>{info.ranking.categoria.posicao}</span>
            <span className="ml-1 text-xs">{categoria.split(' ')[1]}</span>
          </div>
        )}
        
        {info.sequencia.descricao && (
          <div className={`px-2 py-1 rounded-md flex items-center font-medium ${
            info.sequencia.tipo === 'vitória' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {info.sequencia.tipo === 'vitória' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
            <span>{info.sequencia.descricao}</span>
          </div>
        )}
      </div>
    );
  };

  // Função para lidar com a mudança do checkbox de bônus
  const handleBonusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bonusValue = e.target.value;
    const isChecked = e.target.checked;
    
    if (isEditing) {
      // Modo edição - atualizar o estado interno
      let novosBonus: string[] = Array.isArray(formData.bonus) ? [...formData.bonus] : [];
      
      if (isChecked && !novosBonus.includes(bonusValue)) {
        novosBonus.push(bonusValue);
      } else if (!isChecked && novosBonus.includes(bonusValue)) {
        novosBonus = novosBonus.filter(b => b !== bonusValue);
      }
      
      setFormData(prev => ({
        ...prev,
        bonus: novosBonus
      }));
    } else if (onChange) {
      // Modo normal - usar o onChange passado como prop
      let novosBonus: string[] = Array.isArray(dadosLuta.bonus) ? [...dadosLuta.bonus] : [];
      
      if (isChecked && !novosBonus.includes(bonusValue)) {
        novosBonus.push(bonusValue);
      } else if (!isChecked && novosBonus.includes(bonusValue)) {
        novosBonus = novosBonus.filter(b => b !== bonusValue);
      }
      
      onChange(index, {
        target: {
          name: 'bonus',
          value: novosBonus
        }
      } as any);
    }
  };

  return (
    <div className="p-4 my-4 border rounded-md bg-gray-50 relative">
      {/* Botão de remover luta */}
      {onRemove && !isEditing && (
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
      )}

      {/* ID da luta se existir (somente exibição) */}
      {dadosLuta.id && (
        <div className="text-xs text-gray-500 mb-3">
          ID: {dadosLuta.id}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Lutador 1 */}
            <div>
              <label className="block mb-1 text-sm font-medium" htmlFor="lutador1">
                Lutador 1
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="lutador1"
                  name="lutador1"
                  value={formData.lutador1}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded text-sm ${lutadoresReadOnly ? 'bg-gray-100' : ''}`}
                  placeholder="Nome do lutador 1"
                  readOnly={lutadoresReadOnly}
                  disabled={lutadoresReadOnly}
                />
                {carregandoInfo1 && (
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-500 flex items-center">
                    <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Carregando info...
                  </span>
                )}
              </div>
              {renderizarInfoRanking(infoLutador1, formData.categoria)}
            </div>

            {/* Lutador 2 */}
            <div>
              <label className="block mb-1 text-sm font-medium" htmlFor="lutador2">
                Lutador 2
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="lutador2"
                  name="lutador2"
                  value={formData.lutador2}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded text-sm ${lutadoresReadOnly ? 'bg-gray-100' : ''}`}
                  placeholder="Nome do lutador 2"
                  readOnly={lutadoresReadOnly}
                  disabled={lutadoresReadOnly}
                />
                {carregandoInfo2 && (
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-500 flex items-center">
                    <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Carregando info...
                  </span>
                )}
              </div>
              {renderizarInfoRanking(infoLutador2, formData.categoria)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Categoria de peso */}
            <div>
              <label className="block mb-1 text-sm font-medium" htmlFor="categoria">
                Categoria de Peso
              </label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
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
              <label className="block mb-1 text-sm font-medium" htmlFor="resultado">
                Resultado
              </label>
              <select
                id="resultado"
                name="resultado"
                value={formData.resultado}
                onChange={handleChange}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="">Selecione o Resultado</option>
                {resultados.map((resultado) => (
                  <option key={resultado} value={resultado}>
                    {resultado === 'V1' ? `Vitória de ${formData.lutador1 || 'Lutador 1'}` :
                      resultado === 'V2' ? `Vitória de ${formData.lutador2 || 'Lutador 2'}` :
                      resultado}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Só mostra os detalhes do resultado se houver um resultado selecionado */}
          {formData.resultado && formData.resultado !== '' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Tipo de vitória */}
                <div>
                  <label className="block mb-1 text-sm font-medium" htmlFor="tipo">
                    Método
                  </label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
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
                  <label className="block mb-1 text-sm font-medium" htmlFor="round">
                    Round
                  </label>
                  <select
                    id="round"
                    name="round"
                    value={formData.round}
                    onChange={handleChange}
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
                  <label className="block mb-1 text-sm font-medium">
                    Bônus
                  </label>
                  <div className="space-y-2 mt-1">
                    {opcoesBonus.filter(bonus => bonus !== 'Nenhum').map((opcao) => (
                      <label key={opcao} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          name={`bonus-${opcao}`}
                          value={opcao}
                          checked={Array.isArray(formData.bonus) && formData.bonus.includes(opcao)}
                          onChange={handleBonusChange}
                          className="mr-2"
                        />
                        {opcao}
                      </label>
                    ))}
                    {(!Array.isArray(formData.bonus) || formData.bonus.length === 0) && (
                      <div className="text-xs text-gray-500 mt-1">
                        Nenhum bônus selecionado
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Luta de título */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="titulo"
                    checked={formData.titulo}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Disputa de Título</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Marque essa opção se essa luta for uma disputa de cinturão
                </p>
              </div>
            </>
          )}

          <div className="mt-6">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {isEditing ? 'Salvar Alterações' : 'Adicionar Luta'}
            </button>
          </div>
        </form>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Lutador 1 */}
        <div>
          <label className="block mb-1 text-sm font-medium" htmlFor={`lutador1-${index}`}>
            Lutador 1
          </label>
            <div className="relative">
          <input
            type="text"
            id={`lutador1-${index}`}
            name="lutador1"
                value={dadosLuta.lutador1}
                onChange={(e) => onChange && onChange(index, e)}
                className={`w-full p-2 border rounded text-sm ${lutadoresReadOnly ? 'bg-gray-100' : ''}`}
            placeholder="Nome do lutador 1"
                readOnly={lutadoresReadOnly}
                disabled={lutadoresReadOnly}
              />
              {camposEmVerificacao && camposEmVerificacao[`${index}-lutador1`] && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-500 flex items-center">
                  <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </span>
              )}
              {carregandoInfo1 && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-500 flex items-center">
                  <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Carregando info...
                </span>
              )}
            </div>
            {renderizarInfoRanking(infoLutador1, dadosLuta.categoria)}
        </div>

        {/* Lutador 2 */}
        <div>
          <label className="block mb-1 text-sm font-medium" htmlFor={`lutador2-${index}`}>
            Lutador 2
          </label>
            <div className="relative">
          <input
            type="text"
            id={`lutador2-${index}`}
            name="lutador2"
                value={dadosLuta.lutador2}
                onChange={(e) => onChange && onChange(index, e)}
                className={`w-full p-2 border rounded text-sm ${lutadoresReadOnly ? 'bg-gray-100' : ''}`}
            placeholder="Nome do lutador 2"
                readOnly={lutadoresReadOnly}
                disabled={lutadoresReadOnly}
              />
              {camposEmVerificacao && camposEmVerificacao[`${index}-lutador2`] && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-500 flex items-center">
                  <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </span>
              )}
              {carregandoInfo2 && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-500 flex items-center">
                  <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Carregando info...
                </span>
              )}
            </div>
            {renderizarInfoRanking(infoLutador2, dadosLuta.categoria)}
          </div>
        </div>
      )}

      {/* Restante do formulário não editável aqui... */}
      {!isEditing && (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Categoria de peso */}
        <div>
          <label className="block mb-1 text-sm font-medium" htmlFor={`categoria-${index}`}>
            Categoria de Peso
          </label>
          <select
            id={`categoria-${index}`}
            name="categoria"
                value={dadosLuta.categoria}
                onChange={(e) => onChange && onChange(index, e)}
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
                value={dadosLuta.resultado}
                onChange={(e) => onChange && onChange(index, e)}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="">Selecione o Resultado</option>
            {resultados.map((resultado) => (
              <option key={resultado} value={resultado}>
                    {resultado === 'V1' ? `Vitória de ${dadosLuta.lutador1 || 'Lutador 1'}` :
                      resultado === 'V2' ? `Vitória de ${dadosLuta.lutador2 || 'Lutador 2'}` :
                  resultado}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Só mostra os detalhes do resultado se houver um resultado selecionado */}
          {dadosLuta.resultado && dadosLuta.resultado !== '' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Tipo de vitória */}
          <div>
            <label className="block mb-1 text-sm font-medium" htmlFor={`tipo-${index}`}>
              Método
            </label>
            <select
              id={`tipo-${index}`}
              name="tipo"
                  value={dadosLuta.tipo}
                  onChange={(e) => onChange && onChange(index, e)}
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
                  value={dadosLuta.round}
                  onChange={(e) => onChange && onChange(index, e)}
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
                <label className="block mb-1 text-sm font-medium">
              Bônus
            </label>
                <div className="space-y-2 mt-1">
                  {opcoesBonus.filter(bonus => bonus !== 'Nenhum').map((opcao) => (
                    <label key={opcao} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        name={`bonus-${opcao}`}
                        value={opcao}
                        checked={Array.isArray(dadosLuta.bonus) && dadosLuta.bonus.includes(opcao)}
                        onChange={handleBonusChange}
                        className="mr-2"
                      />
                  {opcao}
                    </label>
                  ))}
                  {(!Array.isArray(dadosLuta.bonus) || dadosLuta.bonus.length === 0) && (
                    <div className="text-xs text-gray-500 mt-1">
                      Nenhum bônus selecionado
                    </div>
                  )}
                </div>
          </div>
        </div>
      )}

      {/* Luta de título */}
          {dadosLuta.resultado && dadosLuta.resultado !== '' && (
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="titulo"
                  checked={dadosLuta.titulo}
                  onChange={(e) => onChange && onChange(index, e)}
              className="mr-2"
            />
            <span className="text-sm font-medium">Disputa de Título</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Marque essa opção se essa luta for uma disputa de cinturão
          </p>
        </div>
          )}
        </>
      )}
    </div>
  );
};

export default LutaForm; 