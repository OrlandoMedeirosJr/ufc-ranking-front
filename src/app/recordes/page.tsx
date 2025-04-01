"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function RecordesPage() {
  const [recordes, setRecordes] = useState<any[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:3001/recordes")
      .then((res) => {
        if (Array.isArray(res.data)) setRecordes(res.data);
      })
      .catch(console.error);
  }, []);

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
