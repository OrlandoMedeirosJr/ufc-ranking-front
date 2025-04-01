interface Lutador {
  id: number;
  nome: string;
  pais: string;
  sexo: string;
}

export default async function LutadoresPage() {
  const res = await fetch("http://localhost:3000/lutadores", { cache: "no-store" });
  const lutadores: Lutador[] = await res.json();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">👊 Lutadores</h2>
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {lutadores.map((lutador) => (
          <li key={lutador.id} className="p-3 border rounded shadow-sm bg-white">
            <strong>{lutador.nome}</strong>
            <div className="text-sm text-gray-600">
              {lutador.pais} — {lutador.sexo}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
