import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, MapPin, AlertCircle, Clock } from 'lucide-react';

export default function MeetingAttendanceCheckin() {
  const [searchParams] = useSearchParams();
  const meetingTitle = searchParams.get('meeting') || 'Rapat Tanpa Judul';
  const meetingDate = searchParams.get('date') || new Date().toISOString();
  
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [showTable, setShowTable] = useState(false);

  // Mock participants data
  const participants = [
    { id: 1, name: 'Dr. Budi Santoso', status: 'Hadir', time: '09:00', discipline: 'Tepat Waktu', isBarcode: true },
    { id: 2, name: 'Prof. Siti Aminah', status: 'Hadir', time: '09:15', discipline: '-15menit', isBarcode: false },
    { id: 3, name: 'Andi Wijaya, M.Kom.', status: 'Alpa', time: '-', discipline: '-', isBarcode: false },
    { id: 4, name: 'Anda (Saya)', status: hasCheckedIn ? 'Hadir' : 'Belum', time: hasCheckedIn ? new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-', discipline: hasCheckedIn ? 'Tepat Waktu' : '-', isBarcode: true }
  ];

  const handleCheckIn = () => {
    if (!locationEnabled) {
      if (window.confirm('Aplikasi membutuhkan akses lokasi untuk presensi kehadiran. Izinkan akses lokasi?')) {
        setLocationEnabled(true);
      }
      return;
    }
    setHasCheckedIn(true);
    setShowTable(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Peserta Rapat</h2>
          <p className="text-blue-100 font-medium text-lg">{meetingTitle}</p>
          <div className="flex items-center justify-center gap-2 text-blue-200 mt-2 text-sm">
            <Clock className="w-4 h-4" />
            {new Date(meetingDate).toLocaleDateString('id-ID')} - {new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2">Informasi Kehadiran:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5">
              <li>Peserta yang hadir melalui barcode: {participants.filter(p => p.isBarcode && p.status === 'Hadir').length} orang</li>
              <li>Peserta yang hadir ditandai admin: {participants.filter(p => !p.isBarcode && p.status === 'Hadir').length} orang</li>
            </ul>
          </div>

          {!showTable ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              {!locationEnabled && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  Anda harus mengaktifkan lokasi sebelum absen.
                </div>
              )}
              <button
                onClick={handleCheckIn}
                className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition transform hover:scale-105"
              >
                {locationEnabled ? <CheckCircle className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                {locationEnabled ? 'Konfirmasi Kehadiran Sekarang' : 'Nyalakan Lokasi & Konfirmasi'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-lg border border-emerald-200 font-medium">
                <CheckCircle className="w-5 h-5" />
                Presensi berhasil dicatat! Terima kasih.
              </div>
              
              <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 border-b">No</th>
                      <th className="px-4 py-3 border-b">Nama</th>
                      <th className="px-4 py-3 border-b">Status Kehadiran</th>
                      <th className="px-4 py-3 border-b">Jam Hadir</th>
                      <th className="px-4 py-3 border-b">Kedisiplinan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p, idx) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {p.name.charAt(0)}
                          </div>
                          {p.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.time}</td>
                        <td className="px-4 py-3">
                          {p.discipline.startsWith('-') ? (
                            <span className="text-red-600 font-semibold text-xs bg-red-50 px-2 py-1 rounded">Terlambat {p.discipline}</span>
                          ) : (
                            <span className="text-gray-600 text-xs">{p.discipline}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
