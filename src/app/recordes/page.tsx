interface Recorde {
  tipo: string;
  lutador: string;
  valor: number;
}

export default async function RecordesPage() {
  const res = await fetch("http://localhost:3333/recordes", { cache: "no-store" });
  const recordes: Recorde[] = await res.json();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">🏅 Recordes</h2>
      <ul className="space-y-2">
        {recordes.map((r, index) => (
          <li key={index} className="p-3 bg-white border shadow-sm rounded">
            <strong>{r.tipo}:</strong> {r.lutador} ({r.valor})
          </li>
        ))}
      </ul>
    </div>
  );
}
