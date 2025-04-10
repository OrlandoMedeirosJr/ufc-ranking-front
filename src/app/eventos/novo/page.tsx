'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Modal from 'react-modal';
import LutaForm, { Luta } from '@/components/LutaForm';

export default function NovoEventoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lutadoresCadastrados, setLutadoresCadastrados] = useState<string[]>([]);
  const [lutadorEmVerificacao, setLutadorEmVerificacao] = useState<{nome: string, index: number, campo: 'lutador1' | 'lutador2'} | null>(null);
  const verificacaoTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const [camposEmVerificacao, setCamposEmVerificacao] = useState<Record<string, boolean>>({});

  // Configurar o Modal após a montagem do componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Modal.setAppElement('body');
    }
  }, []);

  // Carregar lutadores já cadastrados ao iniciar
  useEffect(() => {
    const carregarLutadores = async () => {
      let tentativas = 0;
      const maxTentativas = 3;
      
      while (tentativas < maxTentativas) {
        try {
          console.log(`Tentativa ${tentativas + 1} de carregar lutadores...`);
          
          // URL direta para a API
          const url = 'http://localhost:3334/lutadores';
          console.log(`Buscando lutadores diretamente: ${url}`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            cache: 'no-store',
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (response.ok) {
            const data = await response.json();
            // Extrair apenas os nomes dos lutadores para verificação rápida
            const nomes = data.map((lutador: any) => lutador.nome.toLowerCase().trim());
            console.log(`Lutadores carregados com sucesso: ${nomes.length}`);
            setLutadoresCadastrados(nomes);
            return; // Encerra o loop se bem-sucedido
          } else {
            console.error(`Erro na resposta da API: ${response.status} - ${response.statusText}`);
          }
        } catch (error) {
          console.error('Erro ao carregar lutadores:', error);
        }
        
        // Aumenta o tempo de espera entre as tentativas
        const tempoEspera = (tentativas + 1) * 1000;
        console.log(`Aguardando ${tempoEspera}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, tempoEspera));
        
        tentativas++;
      }
      
      // Se chegou aqui, todas as tentativas falharam
      console.error(`Falha ao carregar lutadores após ${maxTentativas} tentativas`);
    };
    
    carregarLutadores();
    
    // Cleanup function para limpar todos os timers quando o componente desmontar
    return () => {
      // Limpar todos os timers pendentes
      Object.values(verificacaoTimers.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);

  const [formData, setFormData] = useState({
    nome: '',
    data: '',
    local: '',
    pais: '',
    finalizado: false,
    publicoTotal: '',
    arrecadacao: '',
    payPerView: ''
  });

  const [lutas, setLutas] = useState<Luta[]>([{ 
    lutador1: '', 
    lutador2: '', 
    resultado: '', // V1, V2, Empate, NC
    tipo: '', // Nocaute, Finalização, Decisão Unânime, Decisão Dividida, Desclassificação
    round: '1', // 1 a 5
    titulo: false, // Disputa de título? (Sim/Não)
    bonus: '', // Performance da Noite, Luta da Noite, Nenhum
    categoria: '' // Categoria da luta
  }]);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [novoLutador, setNovoLutador] = useState({ nome: '', pais: '', sexo: 'Masculino' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleLutaChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Atualizar o estado da luta
    setLutas(prevLutas => {
      const newLutas = [...prevLutas];
      newLutas[index] = { ...newLutas[index], [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value };
      return newLutas;
    });
    
    // Verificar se o campo alterado é de um lutador e se ele foi preenchido com pelo menos 3 caracteres
    if ((name === 'lutador1' || name === 'lutador2')) {
      // Cancelar qualquer verificação pendente para este input específico
      const timerKey = `${index}-${name}`;
      if (verificacaoTimers.current[timerKey]) {
        clearTimeout(verificacaoTimers.current[timerKey]);
        setCamposEmVerificacao(prev => ({ ...prev, [timerKey]: false }));
      }
      
      // Iniciar nova verificação apenas se o valor tiver pelo menos 3 caracteres
      if (value.trim().length >= 3) {
        // Mostrar indicador de verificação
        setCamposEmVerificacao(prev => ({ ...prev, [timerKey]: true }));
        
        verificacaoTimers.current[timerKey] = setTimeout(() => {
          verificarLutador(value.trim(), index, name as 'lutador1' | 'lutador2');
          // Limpar a referência após executar
          delete verificacaoTimers.current[timerKey];
          setCamposEmVerificacao(prev => ({ ...prev, [timerKey]: false }));
        }, 1500); // Aumentado para 1.5 segundos para dar mais tempo ao usuário
      }
    }
  };

  const verificarLutador = async (nome: string, index: number, campo: 'lutador1' | 'lutador2') => {
    // Verificar primeiro localmente
    const nomeNormalizado = nome.toLowerCase().trim();
    
    // Registrar log para debug
    console.log(`Verificando lutador: "${nomeNormalizado}"`);
    console.log(`Lista de lutadores em cache: ${lutadoresCadastrados.length}`);
    
    const lutadorJaCadastrado = lutadoresCadastrados.some(
      lutadorNome => lutadorNome.toLowerCase().trim() === nomeNormalizado
    );
    
    // Se não encontrado localmente, fazer uma verificação direta na API
    if (!lutadorJaCadastrado && nome.trim().length >= 3) {
      let tentativas = 0;
      const maxTentativas = 2;
      
      while (tentativas < maxTentativas) {
        try {
          tentativas++;
          // URL direta para a API de lutadores com filtro por nome
          const url = `http://localhost:3334/lutadores?nome=${encodeURIComponent(nome)}`;
          console.log(`Verificando lutador na API (tentativa ${tentativas}): ${url}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            cache: 'no-store',
            mode: 'cors',
            credentials: 'omit'
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Resposta da API para "${nome}":`, data);
            
            // Se encontrou o lutador na API, adicionar ao cache e não mostrar o modal
            if (data && data.length > 0 && data[0] && data[0].nome) {
              const novoNomeLutador = data[0].nome.toLowerCase().trim();
              console.log(`Lutador encontrado na API: ${novoNomeLutador}`);
              
              // Adicionar à lista de lutadores conhecidos para não precisar verificar de novo
              if (!lutadoresCadastrados.includes(novoNomeLutador)) {
                setLutadoresCadastrados(prev => [...prev, novoNomeLutador]);
              }
              
              return; // O lutador existe, não precisa mostrar o modal
            }
            
            // Se não encontrou na pesquisa geral, tentar uma URL direta
            if (data.length === 0 && tentativas < maxTentativas) {
              continue; // Tentar novamente com a próxima tentativa
            }
          } else {
            console.error(`Erro na resposta da API: ${response.status} - ${response.statusText}`);
            
            // Se foi 404 ou outro erro de servidor, tentar com URL alternativa na próxima tentativa
            if (tentativas < maxTentativas) {
              continue;
            }
          }
          
          // Se chegou aqui na última tentativa, o lutador não foi encontrado
          break;
          
        } catch (error) {
          console.error(`Erro ao verificar lutador na API (tentativa ${tentativas}):`, error);
          
          // Se não estamos na última tentativa, tentar novamente
          if (tentativas < maxTentativas) {
            // Curto delay antes da próxima tentativa
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          
          // Na última tentativa, paramos o loop
          break;
        }
      }
      
      // Se chegou aqui após todas as tentativas, o lutador não foi encontrado
      // Mostrar o modal para cadastrar
      setNovoLutador({
        nome: nome,
        pais: '',
        sexo: 'Masculino'
      });
      setLutadorEmVerificacao({ nome, index, campo });
      setModalIsOpen(true);
    }
  };

  const adicionarLuta = () => {
    // Adicionar a nova luta no INÍCIO da lista para que apareça no topo
    setLutas([{ 
      lutador1: '', 
      lutador2: '', 
      resultado: '', 
      tipo: '', 
      round: '1', 
      titulo: false, 
      bonus: '', 
      categoria: '' 
    }, ...lutas]);
    
    // Rolar a tela para o topo da seção de lutas
    setTimeout(() => {
      const lutasSection = document.querySelector('.lutas-section');
      if (lutasSection) {
        lutasSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const removerLuta = (index: number) => {
    setLutas(lutas.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validação inicial do formulário
      if (!formData.nome || !formData.data) {
        throw new Error('Nome e data do evento são obrigatórios');
      }

      // Filtra apenas as lutas que estão preenchidas
      const lutasPreenchidas = lutas.filter(
        luta => luta.lutador1 && luta.lutador2 && luta.categoria
      );

      // Verifica se pelo menos uma luta está preenchida
      if (lutasPreenchidas.length === 0) {
        throw new Error('É necessário adicionar pelo menos uma luta para criar o evento.');
      }

      // Verifica duplicação de lutadores
      for (const luta of lutasPreenchidas) {
        // Verifica se os nomes dos lutadores são iguais
        if (luta.lutador1.trim().toLowerCase() === luta.lutador2.trim().toLowerCase()) {
          throw new Error(`Não é possível cadastrar uma luta com o mesmo lutador dos dois lados: ${luta.lutador1}`);
        }

        // Verifica se os nomes estão muito curtos (possível erro)
        if (luta.lutador1.trim().length < 3) {
          throw new Error(`Nome do primeiro lutador muito curto: "${luta.lutador1}". Por favor, insira o nome completo.`);
        }
        
        if (luta.lutador2.trim().length < 3) {
          throw new Error(`Nome do segundo lutador muito curto: "${luta.lutador2}". Por favor, insira o nome completo.`);
        }
      }

      try {
        // Formatar os dados para envio
        const eventoData = {
          nome: formData.nome,
          data: formData.data,
          local: formData.local,
          pais: formData.pais,
          publicoTotal: formData.publicoTotal ? parseInt(formData.publicoTotal) : null,
          arrecadacao: formData.arrecadacao ? parseInt(formData.arrecadacao) : null,
          payPerView: formData.payPerView ? parseInt(formData.payPerView) : null
        };
        
        console.log('Enviando dados do evento:', eventoData);
        
        try {
          // URL direta para API
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334';
          const url = `${API_URL}/eventos`;
          console.log(`Enviando dados diretamente para: ${url}`);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(eventoData),
            cache: 'no-store',
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (!response.ok) {
            console.error(`Erro na resposta da API: ${response.status} - ${response.statusText}`);
            
            let errorMessage = `Erro ${response.status}: ${response.statusText}`;
            
            try {
              // Tentar obter detalhes do erro do corpo da resposta
              const errorData = await response.json();
              console.log('Detalhes do erro:', errorData);
              
              if (errorData.message) {
                errorMessage = Array.isArray(errorData.message) 
                  ? errorData.message.join(', ') 
                  : errorData.message;
              } else if (errorData.error) {
                errorMessage = errorData.error;
              }
              
              // Verificar campos específicos com problemas
              if (errorData.statusCode === 400 && errorData.validation) {
                const validationErrors = errorData.validation.map((err: any) => 
                  `${err.field || 'campo'}: ${err.message}`
                ).join('; ');
                
                errorMessage = `Problemas de validação: ${validationErrors}`;
              }
            } catch (parseError) {
              // Se não conseguir parsear o JSON, usar o texto da resposta
              try {
                const errorText = await response.text();
                console.log('Texto de erro:', errorText);
                errorMessage = errorText || errorMessage;
              } catch (textError) {
                console.error('Não foi possível obter texto do erro:', textError);
              }
            }
            
            throw new Error(`Erro ao criar evento: ${errorMessage}`);
          }
          
          const eventoSalvo = await response.json();
          console.log('Evento criado com sucesso:', eventoSalvo);
          
          // Após criar o evento, adicionar as lutas ao evento
          const eventoId = eventoSalvo.evento.id;
          
          // Primeiro, vamos buscar os lutadores no sistema para obter os IDs corretos
          console.log('Buscando IDs dos lutadores antes de criar as lutas...');
          
          // Função para buscar um lutador pelo nome
          const buscarLutadorPorNome = async (nome: string) => {
            try {
              // Usar uma pesquisa mais direta com nome exato
              const url = `http://localhost:3334/lutadores?nome=${encodeURIComponent(nome.trim())}`;
              console.log(`Consultando lutador: ${url}`);
              
              const response = await fetch(url, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json'
                },
                cache: 'no-store'
              });
              
              if (!response.ok) {
                console.error(`Erro ao buscar lutador ${nome}: ${response.status}`);
                return null;
              }
              
              const lutadores = await response.json();
              console.log(`Lutadores encontrados para '${nome}':`, lutadores);
              
              if (lutadores && Array.isArray(lutadores) && lutadores.length > 0) {
                // Tentar encontrar uma correspondência exata primeiro
                const correspondenciaExata = lutadores.find(
                  lutador => lutador.nome.toLowerCase().trim() === nome.toLowerCase().trim()
                );
                
                if (correspondenciaExata) {
                  console.log(`Correspondência exata encontrada para ${nome}:`, correspondenciaExata);
                  return correspondenciaExata;
                }
                
                // Se não encontrar exata, retornar o primeiro resultado
                console.log(`Nenhuma correspondência exata para ${nome}, usando o primeiro resultado:`, lutadores[0]);
                return lutadores[0];
              }
              
              console.error(`Nenhum lutador encontrado para ${nome}`);
              return null;
            } catch (error) {
              console.error(`Erro ao buscar lutador ${nome}:`, error);
              return null;
            }
          };
          
          // Preparar os dados das lutas com os IDs corretos
          const lutasProcessadas = [];
          
          for (const luta of lutasPreenchidas) {
            try {
              // Garantir que os nomes dos lutadores estejam normalizados
              const nomeLutador1 = luta.lutador1.trim();
              const nomeLutador2 = luta.lutador2.trim();
              
              // Verificar se os lutadores são diferentes
              if (nomeLutador1.toLowerCase() === nomeLutador2.toLowerCase()) {
                console.error(`Erro: Mesmos lutadores na mesma luta: ${nomeLutador1} vs ${nomeLutador2}`);
                throw new Error(`Não é possível cadastrar uma luta com o mesmo lutador dos dois lados: ${nomeLutador1}`);
              }
              
              const lutadorA = await buscarLutadorPorNome(nomeLutador1);
              const lutadorB = await buscarLutadorPorNome(nomeLutador2);
              
              if (!lutadorA) {
                console.error(`Lutador não encontrado: ${nomeLutador1}`);
                throw new Error(`Lutador não encontrado: ${nomeLutador1}`);
              }
              
              if (!lutadorB) {
                console.error(`Lutador não encontrado: ${nomeLutador2}`);
                throw new Error(`Lutador não encontrado: ${nomeLutador2}`);
              }
              
              // Verificar se os IDs são diferentes
              if (lutadorA.id === lutadorB.id) {
                console.error(`Erro: Mesmos IDs de lutadores: ${lutadorA.id} (${lutadorA.nome} vs ${lutadorB.nome})`);
                throw new Error(`Os lutadores ${lutadorA.nome} e ${lutadorB.nome} têm o mesmo ID no sistema (${lutadorA.id}). Não é possível criar esta luta.`);
              }
              
              // Logar os IDs para debugging
              console.log(`Lutador A: ${lutadorA.nome} (ID: ${lutadorA.id})`);
              console.log(`Lutador B: ${lutadorB.nome} (ID: ${lutadorB.id})`);
              
              // Se ambos os lutadores foram encontrados, adicionar à lista
              lutasProcessadas.push({
                lutadorA: lutadorA.id, // Enviar o ID em vez do nome
                lutadorB: lutadorB.id, // Enviar o ID em vez do nome
                categoria: String(luta.categoria).trim(),
                titulo: Boolean(luta.titulo),
                disputaTitulo: Boolean(luta.titulo)
              });
              
              console.log(`Luta processada: ${lutadorA.nome} (ID: ${lutadorA.id}) vs ${lutadorB.nome} (ID: ${lutadorB.id})`);
            } catch (error) {
              console.error('Erro ao processar luta:', error);
              throw error;
            }
          }
          
          if (lutasProcessadas.length === 0) {
            throw new Error('Não foi possível processar nenhuma luta. Verifique se os lutadores existem no sistema.');
          }
          
          console.log(`Adicionando ${lutasProcessadas.length} lutas ao evento ${eventoId}`, lutasProcessadas);
          
          // URL direta para API de lutas
          const lutasUrl = `${API_URL}/eventos/${eventoId}/lutas`;
          console.log(`Enviando lutas diretamente para: ${lutasUrl}`);
          console.log('Corpo da requisição:', JSON.stringify(lutasProcessadas, null, 2));
          
          try {
            const lutasResponse = await fetch(lutasUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(lutasProcessadas),
              cache: 'no-store',
              mode: 'cors',
              credentials: 'omit'
            });
            
            if (!lutasResponse.ok) {
              console.error(`Erro ao adicionar lutas: ${lutasResponse.status} - ${lutasResponse.statusText}`);
              
              let errorMessage = `Erro ${lutasResponse.status}: ${lutasResponse.statusText}`;
              
              try {
                // Tentar obter detalhes do erro do corpo da resposta
                const errorData = await lutasResponse.json();
                console.log('Detalhes do erro ao adicionar lutas:', errorData);
                
                if (errorData.message) {
                  errorMessage = Array.isArray(errorData.message) 
                    ? errorData.message.join(', ') 
                    : errorData.message;
                } else if (errorData.error) {
                  errorMessage = errorData.error;
                }
                
                // Verificar campos específicos com problemas
                if (errorData.statusCode === 400 && errorData.validation) {
                  const validationErrors = errorData.validation.map((err: any) => 
                    `${err.field || 'campo'}: ${err.message}`
                  ).join('; ');
                  
                  errorMessage = `Problemas de validação: ${validationErrors}`;
                }
              } catch (parseError) {
                // Se não conseguir parsear o JSON, usar o texto da resposta
                try {
                  const errorText = await lutasResponse.text();
                  console.log('Texto de erro ao adicionar lutas:', errorText);
                  errorMessage = errorText || errorMessage;
                } catch (textError) {
                  console.error('Não foi possível obter texto do erro ao adicionar lutas:', textError);
                }
              }
              
              throw new Error(`Erro ao adicionar lutas: ${errorMessage}`);
            }
            
            // Verificar a resposta para garantir que as lutas foram adicionadas corretamente
            const lutasAdicionadas = await lutasResponse.json();
            console.log('Lutas adicionadas com sucesso:', lutasAdicionadas);
            
            // Verificar se alguma luta não foi adicionada corretamente
            if (lutasAdicionadas && Array.isArray(lutasAdicionadas.lutas) && lutasAdicionadas.lutas.length !== lutasProcessadas.length) {
              console.warn(`Atenção: Foram processadas ${lutasProcessadas.length} lutas, mas apenas ${lutasAdicionadas.lutas.length} foram adicionadas.`);
            }
            
            console.log('Evento criado e lutas adicionadas com sucesso.');
            router.push('/eventos');
          } catch (error) {
            console.error('Erro ao adicionar lutas:', error);
            throw error;
          }
        } catch (error) {
          console.error('Erro ao criar evento:', error);
          throw error;
        }
      } catch (error) {
        console.error('Erro ao processar a requisição:', error);
        setError(`Falha ao criar evento: ${error.message}`);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao processar a requisição:', error);
      setError(`Falha ao criar evento: ${error.message}`);
    }
  };

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => {
    setModalIsOpen(false);
    setNovoLutador({ nome: '', pais: '', sexo: 'Masculino' });
    setLutadorEmVerificacao(null);
  };

  const handleNovoLutadorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNovoLutador(prev => ({ ...prev, [name]: value }));
  };

  const cadastrarNovoLutador = async () => {
    if (!lutadorEmVerificacao) return;
    
    try {
      setLoading(true);
      console.log('Cadastrando novo lutador:', novoLutador);
      
      // Validar campos obrigatórios
      if (!novoLutador.nome || !novoLutador.pais) {
        setError('Nome e país do lutador são obrigatórios.');
        return;
      }
      
      // URL direta para API de lutadores
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334';
      const url = `${API_URL}/lutadores`;
      console.log(`Enviando novo lutador diretamente para: ${url}`);
      
      // Abortable fetch para evitar que a requisição fique pendente indefinidamente
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(novoLutador),
          cache: 'no-store',
          mode: 'cors',
          credentials: 'omit',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Verificar status da resposta e mostrar mensagens de erro mais detalhadas
        if (!response.ok) {
          let errorMessage = `Status: ${response.status}`;
          
          try {
            // Tentar obter detalhes do erro do corpo da resposta
            const errorData = await response.json();
            console.error('Detalhes do erro:', errorData);
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (parseError) {
            // Se não conseguir parsear o JSON, usar o texto da resposta
            const errorText = await response.text();
            console.error('Texto de erro:', errorText);
            errorMessage = errorText || `Erro ${response.status}: ${response.statusText}`;
          }
          
          throw new Error(`Erro ao cadastrar lutador: ${errorMessage}`);
        }
        
        let lutadorSalvo;
        try {
          const responseText = await response.text();
          console.log('Texto da resposta:', responseText);
          
          // Verificar se o texto da resposta não está vazio
          if (!responseText || responseText.trim() === '') {
            console.error('Resposta vazia do servidor');
            throw new Error('Resposta vazia do servidor');
          }
          
          // Tentar fazer o parse do JSON
          lutadorSalvo = JSON.parse(responseText);
          console.log('Lutador cadastrado com sucesso:', lutadorSalvo);
        } catch (jsonError) {
          console.error('Erro ao parsear resposta JSON:', jsonError);
          throw new Error(`Falha ao processar resposta do servidor: ${jsonError.message}`);
        }
        
        // Adicionar à lista de lutadores conhecidos - com verificação de segurança
        if (lutadorSalvo && typeof lutadorSalvo === 'object') {
          // Se o servidor não retornou um nome, mas temos o nome no formulário,
          // usamos o nome do formulário como fallback
          const nomeLutador = lutadorSalvo.nome || novoLutador.nome;
          
          if (nomeLutador) {
            setLutadoresCadastrados(prev => [...prev, nomeLutador.toLowerCase().trim()]);
            
            // Atualizar o formulário com o nome do lutador recém-cadastrado
            setLutas(prevLutas => {
              const newLutas = [...prevLutas];
              if (lutadorEmVerificacao) {
                newLutas[lutadorEmVerificacao.index] = {
                  ...newLutas[lutadorEmVerificacao.index],
                  [lutadorEmVerificacao.campo]: nomeLutador
                };
              }
              return newLutas;
            });
            
            // Fechar o modal e limpar estado
            setModalIsOpen(false);
            setNovoLutador({ nome: '', pais: '', sexo: 'Masculino' });
            setLutadorEmVerificacao(null);
          } else {
            console.error('Erro: Nome do lutador não encontrado na resposta nem no formulário');
            throw new Error('Nome do lutador não disponível');
          }
        } else {
          console.error('Erro: Resposta do servidor inválida:', lutadorSalvo);
          // Tentar salvar com os dados do formulário como fallback
          const nomeLutador = novoLutador.nome;
          if (nomeLutador) {
            console.log('Usando dados do formulário como fallback');
            setLutadoresCadastrados(prev => [...prev, nomeLutador.toLowerCase().trim()]);
            
            setLutas(prevLutas => {
              const newLutas = [...prevLutas];
              if (lutadorEmVerificacao) {
                newLutas[lutadorEmVerificacao.index] = {
                  ...newLutas[lutadorEmVerificacao.index],
                  [lutadorEmVerificacao.campo]: nomeLutador
                };
              }
              return newLutas;
            });
            
            // Fechar o modal e limpar estado
            setModalIsOpen(false);
            setNovoLutador({ nome: '', pais: '', sexo: 'Masculino' });
            setLutadorEmVerificacao(null);
          } else {
            throw new Error('Resposta do servidor inválida e dados do formulário insuficientes');
          }
        }
      } catch (fetchError) {
        console.error('Erro durante a requisição:', fetchError);
        
        // Tratar erros específicos de rede
        if (fetchError.name === 'AbortError') {
          throw new Error('A requisição demorou muito tempo para completar. Tente novamente.');
        } else if (fetchError.message.includes('Failed to fetch')) {
          throw new Error('Erro de conexão. Verifique se o servidor está ativo e tente novamente.');
        } else {
          throw fetchError; // Repassar o erro para ser tratado no bloco catch externo
        }
      }
      
    } catch (error) {
      console.error('Erro ao cadastrar lutador:', error);
      setError(`Falha ao cadastrar lutador: ${error.message}`);
      
      // Exibir alerta para garantir que o usuário veja o erro
      alert(`Erro ao cadastrar lutador: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Lista de países para o select
  const paises = [
    'Brasil', 'EUA', 'Canadá', 'México', 
    'Argentina', 'Reino Unido', 'França', 'Alemanha', 
    'Espanha', 'Itália', 'Portugal', 'Rússia', 
    'China', 'Japão', 'Austrália', 'Emirados Árabes Unidos'
  ].sort();

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
    'Peso Leve Feminino',
    'Peso Casado'
  ];

  // Lista de resultados possíveis
  const resultados = [
    'V1', // Vitória Lutador 1
    'V2', // Vitória Lutador 2
    'Empate',
    'NC' // No Contest (Sem Resultado)
  ];

  // Tipos de vitória
  const tiposVitoria = [
    'Nocaute',
    'Finalização',
    'Decisão Unânime',
    'Decisão Dividida',
    'Desclassificação'
  ];

  // Opções de bônus
  const opcoesBonus = [
    'Performance da Noite',
    'Luta da Noite', 
    'Nenhum'
  ];

  const testarEventoSimples = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Dados mínimos de um evento
      const eventoMinimo = {
        nome: 'Evento de Teste ' + new Date().toISOString().split('T')[0],
        finalizado: false
      };
      
      console.log('Testando evento mínimo:', eventoMinimo);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334';
      const response = await fetch(`${API_URL}/eventos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventoMinimo)
      });
      
      console.log('Resposta do backend - status:', response.status, response.statusText);
      
      if (!response.ok) {
        const text = await response.text();
        console.log('Resposta de erro:', text);
        setError(`Teste falhou: ${response.status} ${response.statusText} - ${text}`);
      } else {
        const data = await response.text();
        console.log('Teste bem-sucedido:', data);
        alert('Evento de teste criado com sucesso! Verifique o console para mais detalhes.');
        router.push('/eventos');
        router.refresh();
      }
    } catch (err) {
      console.error('Erro no teste:', err);
      setError(`Erro no teste: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link href="/eventos" className="text-blue-600 hover:text-blue-800 mr-2">
          ← Voltar para eventos
        </Link>
        <h2 className="text-2xl font-bold">Cadastrar Novo Evento</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded border border-red-300">
          <h3 className="font-bold mb-2">Erro ao salvar evento</h3>
          <div className="mb-2 whitespace-pre-line">{error}</div>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setError(null)}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Fechar
            </button>
            <button 
              type="button"
              onClick={() => {
                window.scrollTo(0, 0);
                setError(null);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Editar e tentar novamente
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-4">
          <label className="block mb-2 font-medium" htmlFor="nome">
            Nome do Evento <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Ex: UFC 310: Silva vs. Thompson"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium" htmlFor="data">
            Data
          </label>
          <input
            type="date"
            id="data"
            name="data"
            value={formData.data}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium" htmlFor="local">
            Local
          </label>
          <input
            type="text"
            id="local"
            name="local"
            value={formData.local}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Ex: T-Mobile Arena, Las Vegas"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium" htmlFor="pais">
            País
          </label>
          <select
            id="pais"
            name="pais"
            value={formData.pais}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Selecione um país</option>
            {paises.map((pais) => (
              <option key={pais} value={pais}>
                {pais}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-medium" htmlFor="publicoTotal">
              Público Total
            </label>
            <input
              type="number"
              id="publicoTotal"
              name="publicoTotal"
              value={formData.publicoTotal}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Ex: 20000"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Dados estatísticos (não disponíveis no backend)</p>
          </div>
          
          <div>
            <label className="block mb-2 font-medium" htmlFor="arrecadacao">
              Arrecadação (USD)
            </label>
            <input
              type="number"
              id="arrecadacao"
              name="arrecadacao"
              value={formData.arrecadacao}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Ex: 9000000"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">Dados estatísticos (não disponíveis no backend)</p>
          </div>
          
          <div>
            <label className="block mb-2 font-medium" htmlFor="payPerView">
              Pay-per-view (vendas)
            </label>
            <input
              type="number"
              id="payPerView"
              name="payPerView"
              value={formData.payPerView}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Ex: 800000"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Dados estatísticos (não disponíveis no backend)</p>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Lutas do Evento</h3>
            <button
              type="button"
              onClick={adicionarLuta}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Adicionar Luta
            </button>
          </div>
          
          <div className="lutas-section">
            {lutas.map((luta, index) => (
              <LutaForm 
                key={index}
                luta={luta}
                index={index}
                onChange={handleLutaChange}
                onRemove={removerLuta}
                camposEmVerificacao={camposEmVerificacao}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-blue-600 text-white rounded ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            } transition-colors`}
          >
            {loading ? 'Salvando...' : 'Salvar Evento'}
          </button>
          
          <Link
            href="/eventos"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </Link>
          
          <button
            type="button"
            onClick={testarEventoSimples}
            disabled={loading}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            Testar API
          </button>
        </div>
      </form>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Cadastrar Novo Lutador"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px',
            maxWidth: '500px',
            width: '100%'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)'
          }
        }}
      >
        <h2 className="text-xl font-bold mb-4">
          {lutadorEmVerificacao 
            ? `Cadastrar Lutador: ${lutadorEmVerificacao.nome}` 
            : 'Cadastrar Novo Lutador'
          }
        </h2>
        <div className="space-y-3">
          <input
            type="text"
            name="nome"
            value={novoLutador.nome}
            onChange={handleNovoLutadorChange}
            placeholder="Nome do Lutador"
            className="w-full p-2 border rounded"
            disabled={!!lutadorEmVerificacao}
          />
          <input
            type="text"
            name="pais"
            value={novoLutador.pais}
            onChange={handleNovoLutadorChange}
            placeholder="País"
            className="w-full p-2 border rounded"
            required
          />
          <select
            name="sexo"
            value={novoLutador.sexo}
            onChange={handleNovoLutadorChange}
            className="w-full p-2 border rounded"
          >
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={cadastrarNovoLutador}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Cadastrar
            </button>
            <button 
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 