import { type ClassValue, clsx } from "clsx"

// Importação mais robusta do tailwind-merge
let twMerge: (classList: string) => string;
try {
  twMerge = require("tailwind-merge").twMerge;
} catch (e) {
  // Fallback se tailwind-merge falhar
  console.warn("tailwind-merge não carregado corretamente, usando clsx apenas");
  twMerge = (classList: string) => classList;
}

/**
 * Combina classes CSS usando clsx e tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  try {
    return twMerge(clsx(inputs));
  } catch (e) {
    console.warn("Erro ao mesclar classes, usando clsx apenas:", e);
    return clsx(inputs);
  }
}

/**
 * Gera um ID único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Função de sleep para uso em demonstrações ou testes
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Protege contra valores nulos ou indefinidos
 */
export function safeValue<T>(value: T | null | undefined, defaultValue: T): T {
  return value === null || value === undefined ? defaultValue : value
}

/**
 * Verifica se estamos no ambiente do lado do cliente
 */
export const isClient = typeof window !== 'undefined'

/**
 * Converte uma string para slug URL-friendly
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

/**
 * Obtém um item de um array de forma aleatória
 */
export function getRandomItem<T>(array: T[]): T | undefined {
  if (!array.length) return undefined
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Verifica se uma string é um JSON válido
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch (e) {
    return false
  }
}
