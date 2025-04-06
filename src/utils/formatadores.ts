import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data para o formato brasileiro (dd/MM/yyyy)
 */
export function formatarData(data: string | Date | undefined | null): string {
  if (!data) return 'Data não informada';
  
  try {
    const dataObj = typeof data === 'string' ? parseISO(data) : data;
    return format(dataObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
}

/**
 * Formata um número para o formato brasileiro (1.000,00)
 */
export function formatarNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return 'N/A';
  
  return new Intl.NumberFormat('pt-BR').format(valor);
}

/**
 * Formata um valor monetário para o formato brasileiro (R$ 1.000,00)
 */
export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return 'N/A';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(valor);
}

/**
 * Formata um valor monetário em dólares para o formato brasileiro (US$ 1.000,00)
 */
export function formatarDolar(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return 'N/A';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(valor);
} 