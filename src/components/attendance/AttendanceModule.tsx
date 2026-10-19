import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  UserCheck, 
  Filter, 
  FileSpreadsheet, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { AttendanceRecord, Employee, AttendanceStatus } from '../../types/hris';
import { useAuth } from '../../context/AuthContext';

interface AttendanceModuleProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  isLoading: boolean;
  onClockIn: (payload: { employeeId: string; location?: string; notes?: string }) => Promise<void>;
  onClockOut: (payload: { employeeId: string; notes?: string }) => Promise<void>;
  onRefresh: () => void;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  employees,
  attendance,
  isLoading,
  onClockIn,
  onClockOut,
  onRefresh,
}) => {
  const { currentUser } = useAuth();

  // Live Clock State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Selected user for clock-in simulation (Default to logged-in user if KARYAWAN)
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    currentUser.employeeId || employees[0]?.id || 'EMP-001'
  );

  // Sync selectedEmpId when role switches
  useEffect(() => {
    if (currentUser.employeeId) {
      setSelectedEmpId(currentUser.employeeId);
    }
  }, [currentUser]);

  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter for Rekap Kehadiran (If Karyawan, automatically locked to self)
  const [rekapFilterEmp, setRekapFilterEmp] = useState<string>(
    currentUser.role === 'KARYAWAN' ? (currentUser.employeeId || 'EMP-001') : 'ALL'
  );
  const [rekapFilterStatus, setRekapFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    if (currentUser.role === 'KARYAWAN' && currentUser.employeeId) {
      setRekapFilterEmp(currentUser.employeeId);
    } else if (currentUser.role !== 'KARYAWAN') {
      setRekapFilterEmp('ALL');
    }
  }, [currentUser]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's date string
  const todayStr = currentTime.toISOString().split('T')[0];

  // Find attendance record for selected employee today
  const todayRecord = attendance.find(
    (a) => a.employeeId === selectedEmpId && a.date === todayStr
  );

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId);

  // Time calculations for display
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  const formattedLiveTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  // Shift starts at 08:30:00
  const isLateNow = hours > 8 || (hours === 8 && minutes > 30);
  const minutesLateNow = isLateNow ? (hours * 60 + minutes) - (8 * 60 + 30) : 0;

  // Handle Clock In Action
  const handleClockInAction = async () => {
    setActionError(null);
    setIsSubmitting(true);
    try {
      await onClockIn({
        employeeId: selectedEmpId,
        location: 'Kantor Pusat HQ - Jakarta Selatan (Geofence Validated 106.8°E, -6.2°S)',
        notes: notes || undefined,
      });
      setNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal melakukan Clock-In';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Clock Out Action
  const handleClockOutAction = async () => {
    setActionError(null);
    setIsSubmitting(true);
    try {
      await onClockOut({
        employeeId: selectedEmpId,
        notes: notes || undefined,
      });
      setNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal melakukan Clock-Out';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter attendance records
  const filteredAttendance = attendance.filter((item) => {
    const matchEmp = rekapFilterEmp === 'ALL' || item.employeeId === rekapFilterEmp;
    const matchStatus = rekapFilterStatus === 'ALL' || item.status === rekapFilterStatus;
    return matchEmp && matchStatus;
  });

  // Calculate monthly recap metrics
  const totalHadir = filteredAttendance.filter((a) => a.status === 'Hadir').length;
  const totalTerlambat = filteredAttendance.filter((a) => a.status === 'Terlambat').length;
  const totalIzin = filteredAttendance.filter((a) => a.status === 'Izin' || a.status === 'Sakit').length;
  const totalAlpha = filteredAttendance.filter((a) => a.status === 'Alpha').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase">
            <Clock className="w-4 h-4" />
            Modul 2: Manajemen Kehadiran & Presensi
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Presensi Online & Rekap Kehadiran
          </h2>
          <p className="text-sm text-slate-500">
            Pencatatan waktu kerja (Clock-in / Clock-out) otomatis, validasi geolokasi kantor, dan rekapitulasi absensi bulanan.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sinkronisasi Data
        </button>
      </div>

      {/* Grid: Clock-In/Out Live Card + Shift Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Presensi / Clock Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Mesin Presensi Digital Real-Time
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Terminal Clock-In / Clock-Out
              </h3>
            </div>
            
            {/* Live Digital Clock Badge */}
            <div className="bg-slate-900 text-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 shadow-inner flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-400 animate-pulse" />
              <div>
                <div className="font-mono text-xl font-bold tracking-widest text-emerald-400">
                  {formattedLiveTime}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  WIB (GMT+7) • {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* Form Error Banner */}
          {actionError && (
            <div className="mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Simulation Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {currentUser.role === 'KARYAWAN' ? 'Identitas Presensi (Self-Service)' : 'Pilih Karyawan (Supervisi HR)'}
                </label>
                {currentUser.role === 'KARYAWAN' && (
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                    Otentikasi Mandiri
                  </span>
                )}
              </div>
              <select
                disabled={currentUser.role === 'KARYAWAN'}
                value={selectedEmpId}
                onChange={(e) => {
                  setSelectedEmpId(e.target.value);
                  setActionError(null);
                }}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600 dark:disabled:bg-slate-800"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.id}) - {emp.department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Lokasi / Geofence Status
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Kantor Pusat HQ Jakarta (Radius Terverifikasi: 12 meter)</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Catatan / Aktivitas Hari Ini (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Bekerja di kantor, meeting sprint mingguan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Today's Status Box for Selected Employee */}
          <div className="mt-5 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">Status Kehadiran Hari Ini ({todayStr}):</div>
              <div className="flex items-center gap-2 mt-1">
                {todayRecord ? (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      todayRecord.status === 'Hadir'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                        : todayRecord.status === 'Terlambat'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {todayRecord.status}
                    {todayRecord.lateMinutes > 0 && ` (${todayRecord.lateMinutes} menit terlambat)`}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                    Belum Presensi Hari Ini
                  </span>
                )}
                {todayRecord?.clockInTime && (
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                    Clock-In: <strong>{todayRecord.clockInTime}</strong>
                  </span>
                )}
                {todayRecord?.clockOutTime && (
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                    • Clock-Out: <strong>{todayRecord.clockOutTime}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClockInAction}
                disabled={isSubmitting || (todayRecord !== undefined && todayRecord.clockInTime !== null)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                Clock-In Masuk
              </button>

              <button
                type="button"
                onClick={handleClockOutAction}
                disabled={isSubmitting || !todayRecord?.clockInTime || Boolean(todayRecord.clockOutTime)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                Clock-Out Pulang
              </button>
            </div>
          </div>
        </div>

        {/* Shift Policy & Rules */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-3 font-semibold text-xs uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              Kebijakan Jam Kerja HR
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">Aturan Shift & Toleransi</h4>

            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">Jam Masuk Normal:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">08:00 WIB</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">Batas Toleransi:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">08:30 WIB (30 Menit)</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">Jam Pulang Normal:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">17:00 WIB</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                <span>Denda Keterlambatan:</span>
                <span className="font-bold">Rp 2.500 / Menit</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Setiap keterlambatan otomatis masuk ke penghitungan potongan payroll karyawan di akhir bulan.
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Sistem terintegrasi otomatis dengan modul penggajian (Payroll Engine).
          </div>
        </div>
      </div>

      {/* Rekapitulasi Kehadiran Bulanan */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              Rekapitulasi Kehadiran Bulanan (Oktober 2026)
            </h3>
            <p className="text-xs text-slate-500">
              Audit log presensi harian seluruh karyawan dengan status keterlambatan dan catatan verifikasi.
            </p>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={rekapFilterEmp}
              onChange={(e) => setRekapFilterEmp(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Karyawan</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}
                </option>
              ))}
            </select>

            <select
              value={rekapFilterStatus}
              onChange={(e) => setRekapFilterStatus(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="Hadir">Hadir Tepat Waktu</option>
              <option value="Terlambat">Terlambat</option>
              <option value="Izin">Izin / Cuti</option>
              <option value="Alpha">Alpha</option>
            </select>
          </div>
        </div>

        {/* Quick Summary Pill Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase">Hadir Tepat</span>
              <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{totalHadir}</div>
            </div>
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase">Terlambat</span>
              <div className="text-xl font-bold text-amber-900 dark:text-amber-100">{totalTerlambat}</div>
            </div>
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 uppercase">Izin / Sakit</span>
              <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{totalIzin}</div>
            </div>
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>

          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 uppercase">Alpha</span>
              <div className="text-xl font-bold text-rose-900 dark:text-rose-100">{totalAlpha}</div>
            </div>
            <Clock className="w-6 h-6 text-rose-500" />
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Nama Karyawan</th>
                  <th className="py-3 px-4">Clock-In</th>
                  <th className="py-3 px-4">Clock-Out</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Keterlambatan</th>
                  <th className="py-3 px-4">Lokasi & Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {rec.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                        {rec.employeeName}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{rec.employeeId}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {rec.clockInTime || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {rec.clockOutTime || (rec.clockInTime ? <span className="text-amber-500 font-sans font-medium text-[11px]">Sedang Bekerja</span> : '-')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          rec.status === 'Hadir'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : rec.status === 'Terlambat'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : rec.status === 'Izin'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {rec.lateMinutes > 0 ? (
                        <span className="font-semibold text-amber-600">
                          {rec.lateMinutes} menit (-Rp {(rec.lateMinutes * 2500).toLocaleString('id-ID')})
                        </span>
                      ) : (
                        <span className="text-slate-400">0 menit</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                      <div className="truncate font-medium text-slate-700 dark:text-slate-300">{rec.location}</div>
                      {rec.notes && <div className="text-[11px] text-slate-400 truncate">{rec.notes}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
