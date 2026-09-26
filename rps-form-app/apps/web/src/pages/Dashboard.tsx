import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { rpsApi } from '../services/api';
import { RpsDocument } from '../types/rps';

export default function Dashboard() {
  const [docs, setDocs] = useState<RpsDocument[]>([]);

  useEffect(() => {
    rpsApi.getRpsList().then((data) => setDocs(data)).catch(() => setDocs([]));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard RPS</h1>
      <Link to="/wizard" className="bg-blue-600 text-white px-4 py-2 rounded mb-4 inline-block">
        + Buat RPS Baru
      </Link>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Daftar Dokumen</h2>
        <ul className="mt-2 space-y-2">
          {docs.map((doc) => (
            <li key={doc.id} className="border p-4 rounded flex justify-between">
              <div>
                <strong>{doc.title}</strong> - {doc.courseName}
              </div>
              <div>
                <Link to={`/wizard?id=${doc.id}`} className="text-blue-500 mr-4">Edit</Link>
                <span className="text-gray-500">{doc.status}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
