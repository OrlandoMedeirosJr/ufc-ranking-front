import { notFound } from "next/navigation";

interface Lutador {
  nome: string;
}

interface RankingItem {
  lutadorId: number;
  posicao: number;
  pontos: number;
  lutador: Lutador | null;
}

export default async function RankingPage({ params }: { params: { categoria: string } }) {
  const categoria = decodeURIComponent(params.categoria);
  const res = await fetch(`http://localhost:3000/ranking/${categoria}`, { cache: "no-store" });

  if (!res.ok) return notFound();

  const data: RankingItem[] = await res.json();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Ranking: {categoria}</h2>
      <ul className="space-y-2">
        {data.map((item) => (
          <li key={item.lutadorId} className="p-3 rounded border shadow-sm bg-white">
            <strong>#{item.posicao}</strong> {item.lutador?.nome} — {item.pontos} pts
          </li>
        ))}
      </ul>
    </div>
  );
}
