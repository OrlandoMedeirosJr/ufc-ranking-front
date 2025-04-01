"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function LutadoresPage() {
  const [lutadores, setLutadores] = useState<any[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:3001/lutadores")
      .then((res) => setLutadores(res.data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">👊 Lutadores</h2>
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {lutadores.map((lutador) => (
          <li key={lutador.id} className="p-3 border rounded shadow-sm bg-white">
            <strong>{lutador.nome}</strong>
            <div className="text-sm text-gray-600">{lutador.pais} — {lutador.sexo}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
