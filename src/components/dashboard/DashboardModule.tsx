import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Users,
  Clock,
  Banknote,
  Briefcase,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Layers,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Employee, AttendanceRecord, PayrollRecord, JobOpening, Candidate } from '../../types/hris';
import { useAuth } from '../../context/AuthContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardModuleProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  payroll: PayrollRecord[];
  jobs: JobOpening[];
  candidates: Candidate[];
  onNavigate: (tabId: string) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  employees,
  attendance,
  payroll,
  jobs,
  candidates,
  onNavigate,
}) => {
  const { currentUser } = useAuth();

  // State: Filter Bulan untuk Statistik Chart.js
  const [selectedMonth, setSelectedMonth] = useState<string>('okt');
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);
  const [chartError, setChartError] = useState<string | null>(null);

  // Fungsi refresh statistik dengan simulasi loading state responsif
  const handleRefreshStats = () => {
    setIsChartLoading(true);
    setChartError(null);
    setTimeout(() => {
      setIsChartLoading(false);
    }, 600);
  };

  // Fungsi uji coba simulasi error handling
  const handleTriggerSimulatedError = () => {
    setIsChartLoading(true);
    setTimeout(() => {
      setIsChartLoading(false);
      setChartError('Gagal memuat dataset analitik bulanan dari server API (Timeout 504).');
    }, 500);
  };

  // KPI Calculations
  const activeEmployees = employees.filter((e) => e.status === 'Aktif').length;
  const presentToday = attendance.filter((a) => a.status === 'Hadir' || a.status === 'Terlambat').length;
  const lateToday = attendance.filter((a) => a.status === 'Terlambat').length;
  const attendanceRate = activeEmployees > 0 ? Math.round((presentToday / activeEmployees) * 100) : 0;

  const totalPayrollBudget = payroll.reduce((sum, p) => sum + p.netSalary, 0);
  const openJobs = jobs.filter((j) => j.status === 'Buka').length;
  const activeCandidates = candidates.filter((c) => c.stage !== 'Ditolak').length;

  // Specific employee personal stats for KARYAWAN role
  const myEmployeeRecord = employees.find((e) => e.id === (currentUser.employeeId || 'EMP-001'));
  const myAttendanceRecords = attendance.filter((a) => a.employeeId === (currentUser.employeeId || 'EMP-001'));
  const myPayrollRecord = payroll.find((p) => p.employeeId === (currentUser.employeeId || 'EMP-001'));

  // Department distribution
  const deptCounts: Record<string, number> = {};
  employees.forEach((emp) => {
    deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
  });

  const departmentChartData = {
    labels: Object.keys(deptCounts),
    datasets: [
      {
        data: Object.values(deptCounts),
        backgroundColor: [
          'rgba(59, 130, 246, 0.85)', // Blue
          'rgba(16, 185, 129, 0.85)', // Emerald
          'rgba(245, 158, 11, 0.85)', // Amber
          'rgba(139, 92, 246, 0.85)', // Purple
          'rgba(236, 72, 153, 0.85)', // Pink
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  // Dynamic Monthly Datasets based on selectedMonth
  const monthlyDatasets: Record<string, { labels: string[]; rate: number[]; late: number[]; payrollMod: number }> = {
    okt: {
      labels: ['13 Okt', '14 Okt', '15 Okt', '16 Okt', '17 Okt', '18 Okt', '19 Okt'],
      rate: [92, 95, 96, 91, 98, 94, attendanceRate || 95],
      late: [1, 2, 0, 3, 1, 0, lateToday],
      payrollMod: 1.0,
    },
    sep: {
      labels: ['23 Sep', '24 Sep', '25 Sep', '26 Sep', '27 Sep', '28 Sep', '29 Sep'],
      rate: [89, 94, 95, 93, 96, 92, 95],
      late: [2, 1, 1, 2, 0, 1, 1],
      payrollMod: 0.95,
    },
    ags: {
      labels: ['22 Ags', '23 Ags', '24 Ags', '25 Ags', '26 Ags', '27 Ags', '28 Ags'],
      rate: [94, 96, 97, 95, 98, 97, 98],
      late: [0, 1, 0, 1, 0, 0, 1],
      payrollMod: 0.92,
    },
  };

  const activeDataset = monthlyDatasets[selectedMonth] || monthlyDatasets.okt;

  // Monthly Attendance Trend (Line Chart with Chart.js)
  const attendanceTrendData = {
    labels: activeDataset.labels,
    datasets: [
      {
        label: 'Tingkat Kehadiran (%)',
        data: activeDataset.rate,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointRadius: 4,
        yAxisID: 'y',
      },
      {
        label: 'Keterlambatan (Karyawan)',
        data: activeDataset.late,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: false,
        borderDash: [5, 5],
        tension: 0.3,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#fff',
        pointRadius: 4,
        yAxisID: 'y1',
      },
    ],
  };

  // Payroll by Department Bar Chart (Bar Chart with Chart.js)
  const deptPayroll: Record<string, number> = {};
  payroll.forEach((p) => {
    deptPayroll[p.department] = (deptPayroll[p.department] || 0) + p.netSalary * activeDataset.payrollMod;
  });

  const payrollBarData = {
    labels: Object.keys(deptPayroll).map((name) =>
      name.length > 15 ? name.substring(0, 14) + '...' : name
    ),
    datasets: [
      {
        label: 'Total Gaji Bersih (Juta IDR)',
        data: Object.values(deptPayroll).map((val) => Math.round(val / 1000000)),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { size: 11, family: 'Inter, system-ui, sans-serif' },
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 10,
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 11 },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 70,
        max: 100,
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: { font: { size: 10 } },
        title: { display: true, text: 'Kehadiran (%)', font: { size: 10 } },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 0,
        max: 6,
        grid: { display: false },
        ticks: { font: { size: 10 }, stepSize: 1 },
        title: { display: true, text: 'Jumlah Terlambat', font: { size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { size: 11 }, boxWidth: 12 },
      },
    },
    scales: {
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: { font: { size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { boxWidth: 12, font: { size: 11 } },
      },
    },
    cutout: '68%',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome with Active Role Status */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            NusantaraHR • Hak Akses: {currentUser.role}
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {currentUser.role === 'KARYAWAN'
              ? `Portal Mandiri Karyawan: ${currentUser.displayName}`
              : currentUser.role === 'FINANCE'
              ? 'Financial Controller & Payroll Dashboard'
              : 'Executive HR & People Operations Dashboard'}
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            {currentUser.role === 'KARYAWAN'
              ? 'Lakukan pencatatan kehadiran mandiri, pantau jadwal kerja, dan unduh slip gaji bulanan Anda secara langsung tanpa proses birokrasi manual.'
              : currentUser.role === 'FINANCE'
              ? 'Otomatisasi kalkulasi keuangan bulanan, validasi potongan denda absensi karyawan, dan kontrol distribusi slip gaji terintegrasi.'
              : 'Pusat kendali operasional SDM: Master profil karyawan, monitoring absensi, dan pipeline rekrutmen talenta berbasis arsitektur database relasional.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('attendance')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shadow-md flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            {currentUser.role === 'KARYAWAN' ? 'Clock-In Mandiri' : 'Monitor Presensi'}
          </button>
          <button
            onClick={() => onNavigate('architecture')}
            className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4" />
            Spesifikasi RBAC
          </button>
        </div>
      </div>

      {/* Interactive Controls Bar: Period Selector & Simulated State Actions */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            Periode Statistik Bulanan:
          </span>
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              handleRefreshStats();
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="okt">Oktober 2026 (Aktif)</option>
            <option value="sep">September 2026</option>
            <option value="ags">Agustus 2026</option>
          </select>

          <button
            onClick={handleRefreshStats}
            disabled={isChartLoading}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChartLoading ? 'animate-spin' : ''}`} />
            Refresh Dataset
          </button>
        </div>

        {/* Demo Button to trigger Error Handling State */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerSimulatedError}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
            title="Klik untuk memicu simulasi state error responsif"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Simulasi Error State
          </button>
        </div>
      </div>

      {/* Error State Banner with Retry */}
      {chartError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-200 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <div>
              <span className="font-bold">Terjadi Kesalahan Pengambilan Data: </span>
              <span>{chartError}</span>
            </div>
          </div>
          <button
            onClick={handleRefreshStats}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi (Retry)
          </button>
        </div>
      )}

      {/* KPI Cards: Customized for Role */}
      {currentUser.role === 'KARYAWAN' ? (
        /* Karyawan Personal KPIs */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status Presensi Hari Ini</span>
            <div className="text-2xl font-bold text-emerald-600 mt-2 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <span>Hadir Tepat Waktu</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Clock-In: 08:14 WIB (HQ Jakarta)</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Akumulasi Kehadiran Bulan Ini</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              21 / 22 <span className="text-sm font-normal text-slate-500">Hari Kerja</span>
            </div>
            <p className="text-xs text-emerald-600 mt-1 font-semibold">Tingkat Disiplin: 95.4%</p>
          </div>

          <div 
            onClick={() => onNavigate('payroll')}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer group"
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Take Home Pay (Okt 2026)</span>
            <div className="text-2xl font-bold text-purple-600 mt-2">
              Rp {myPayrollRecord ? myPayrollRecord.netSalary.toLocaleString('id-ID') : '17.800.000'}
            </div>
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1 font-medium">
              Lihat Rincian Slip Gaji <ArrowUpRight className="w-3.5 h-3.5" />
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Denda Keterlambatan</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              Rp 0 <span className="text-xs font-normal text-emerald-600 font-semibold">(Nol Menit)</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Tidak ada potongan absensi</p>
          </div>
        </div>
      ) : (
        /* HR & Finance Enterprise KPIs */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => onNavigate('employees')}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Headcount</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeEmployees} <span className="text-sm font-normal text-slate-500">Karyawan</span></div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>100% Aktif Bekerja</span>
              </div>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('attendance')}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Presensi Hari Ini</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{presentToday} / {activeEmployees}</div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-emerald-600 font-semibold">{attendanceRate}% Hadir</span>
                {lateToday > 0 && (
                  <span className="text-amber-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {lateToday} Terlambat
                  </span>
                )}
              </div>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('payroll')}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Beban Finansial Gaji</span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Banknote className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                Rp {(totalPayrollBudget / 1000000).toFixed(1)} <span className="text-sm font-normal text-slate-500">Juta</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <span>{payroll.length} Slip Gaji Periode {selectedMonth.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('recruitment')}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lowongan & Rekrutmen</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {openJobs} <span className="text-sm font-normal text-slate-500">Posisi Buka</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-600 mt-1 font-medium">
                <span>{activeCandidates} Kandidat Dalam Proses</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid Powered by Chart.js with Loading Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Line Chart (Chart.js) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          {isChartLoading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs z-10 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Memperbarui dataset Chart.js...
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Tren Kehadiran Mingguan & Keterlambatan (Chart.js Line)
              </h3>
              <p className="text-xs text-slate-500">
                Visualisasi persentase kehadiran vs jumlah staf terlambat per tanggal
              </p>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold rounded-lg font-mono">
              Periode: {selectedMonth.toUpperCase()} 2026
            </span>
          </div>
          <div className="h-64 w-full">
            <Line data={attendanceTrendData} options={lineChartOptions} />
          </div>
        </div>

        {/* Department Distribution Doughnut Chart (Chart.js) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
          {isChartLoading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs z-10 flex items-center justify-center">
              <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Distribusi Divisi (Chart.js Doughnut)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Proporsi alokasi SDM per departemen
            </p>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <Doughnut data={departmentChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Second Row: Payroll Distribution Bar Chart & RBAC System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Expense Bar Chart (Chart.js) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          {isChartLoading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Alokasi Beban Gaji per Departemen (Chart.js Bar)
              </h3>
              <p className="text-xs text-slate-500">
                Perbandingan total anggaran gaji bersih dalam satuan Juta Rupiah
              </p>
            </div>
            <button
              onClick={() => onNavigate('payroll')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Lihat Detail Payroll
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-60 w-full">
            <Bar data={payrollBarData} options={barChartOptions} />
          </div>
        </div>

        {/* Real-time RBAC Summary Box */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                RBAC
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Matriks Hak Akses Aktif
                </h4>
                <p className="text-xs text-slate-500">Role: <strong>{currentUser.role}</strong></p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">1. Master Data Karyawan</span>
                <span className={`font-mono text-[11px] font-bold ${currentUser.role === 'HR' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {currentUser.role === 'HR' ? 'Akses Penuh (RW)' : 'Terkunci'}
                </span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">2. Presensi Harian</span>
                <span className="font-mono text-[11px] font-bold text-emerald-600">
                  {currentUser.role === 'KARYAWAN' ? 'Mandiri (Self)' : 'Supervisi (All)'}
                </span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">3. Eksekusi Payroll</span>
                <span className={`font-mono text-[11px] font-bold ${currentUser.role === 'FINANCE' ? 'text-purple-600' : currentUser.role === 'KARYAWAN' ? 'text-blue-500' : 'text-slate-400'}`}>
                  {currentUser.role === 'FINANCE' ? 'Otoritas Finance' : currentUser.role === 'KARYAWAN' ? 'Slip Mandiri' : 'Terkunci'}
                </span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">4. Perekrutan (ATS)</span>
                <span className={`font-mono text-[11px] font-bold ${currentUser.role === 'HR' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {currentUser.role === 'HR' ? 'Akses Penuh (RW)' : 'Terkunci'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('architecture')}
            className="w-full mt-4 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4" />
            Dokumentasi Lengkap Sistem
          </button>
        </div>
      </div>
    </div>
  );
};
