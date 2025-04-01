"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

export default function RankingCategoriaPage() {
  const { categoria } = useParams();
  const [ranking, setRanking] = useState<any[]>([]);

  useEffect(() => {
    if (!categoria) return;
    axios
      .get(`http://localhost:3001/ranking/${decodeURIComponent(categoria as string)}`)
      .then((res) => {
        if (Array.isArray(res.data)) setRanking(res.data);
      })
      .catch(console.error);
  }, [categoria]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Ranking: {decodeURIComponent(categoria as string)}</h2>
      <ul className="space-y-2">
        {ranking.map((item) => (
          <li
            key={item.lutadorId}
            className={`p-3 rounded border shadow-sm bg-white`}
          >
            <strong>#{item.posicao}</strong> {item.lutador?.nome} — {item.pontos} pts
          </li>
        ))}
      </ul>
    </div>
  );
}
