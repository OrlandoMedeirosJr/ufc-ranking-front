import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl font-bold mb-2 text-primary">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Página não encontrada</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        A página que você está procurando pode ter sido removida, renomeada ou 
        está temporariamente indisponível.
      </p>
      
      <Link href="/">
        <Button>Voltar para o início</Button>
      </Link>
    </div>
  );
} 