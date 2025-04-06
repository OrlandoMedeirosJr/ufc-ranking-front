interface Recorde {
  tipo: string;
  lutador: string;
  valor: number;
  categoria?: string;
}

export default async function RecordesPage() {
  const res = await fetch("http://localhost:3333/recordes", { cache: "no-store" });
  const recordes: Recorde[] = await res.json();

  // Separar recordes gerais e por categoria
  const recordesGerais = recordes.filter(r => !r.categoria);
  const categorias = [...new Set(recordes.filter(r => r.categoria).map(r => r.categoria))];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">🏅 Recordes Gerais</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recordesGerais.map((r, index) => (
            <li key={index} className="p-4 bg-white border shadow-sm rounded hover:shadow-md transition-shadow">
              <div className="font-bold text-lg text-blue-700">{r.tipo}</div>
              <div className="mt-1">
                <span className="font-semibold">{r.lutador}</span>
                <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-sm">{r.valor}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {categorias.map(categoria => (
        <div key={categoria} className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800">🏆 Recordes: {categoria}</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recordes
              .filter(r => r.categoria === categoria)
              .map((r, index) => (
                <li key={index} className="p-4 bg-white border shadow-sm rounded hover:shadow-md transition-shadow">
                  <div className="font-bold text-lg text-green-700">{r.tipo}</div>
                  <div className="mt-1">
                    <span className="font-semibold">{r.lutador}</span>
                    <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-sm">{r.valor}</span>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
