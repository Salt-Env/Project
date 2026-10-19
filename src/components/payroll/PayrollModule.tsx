import React, { useState, useEffect } from 'react';
import { 
  Banknote, 
  Printer, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  Calculator, 
  Download, 
  Eye, 
  Building, 
  X, 
  ShieldAlert, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { PayrollRecord, Employee } from '../../types/hris';
import { useAuth } from '../../context/AuthContext';

interface PayrollModuleProps {
  employees: Employee[];
  payroll: PayrollRecord[];
  isLoading: boolean;
  onGeneratePayroll: (employeeId: string, month?: number, year?: number) => Promise<void>;
  onUpdateStatus: (id: string, status: 'Draft' | 'Diproses' | 'Dibayar') => Promise<void>;
  onRefresh: () => void;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({
  employees,
  payroll,
  isLoading,
  onGeneratePayroll,
  onUpdateStatus,
  onRefresh,
}) => {
  const { currentUser } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Generating state
  const [isCalculatingAll, setIsCalculatingAll] = useState(false);
  const [selectedEmployeeForGen, setSelectedEmployeeForGen] = useState<string>(employees[0]?.id || '');
  const [isGeneratingSingle, setIsGeneratingSingle] = useState(false);

  // Payslip Modal State
  const [activePayslip, setActivePayslip] = useState<PayrollRecord | null>(null);

  // Close payslip modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePayslip(null);
      }
    };
    if (activePayslip) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePayslip]);

  // Filter payroll records strictly by role:
  // If KARYAWAN: ONLY show their own payslip!
  // If FINANCE or HR: show according to search and department filters.
  const filteredPayroll = payroll.filter((p) => {
    if (currentUser.role === 'KARYAWAN') {
      const matchSelf = p.employeeId === (currentUser.employeeId || 'EMP-001');
      const matchMonth = p.periodMonth === selectedMonth && p.periodYear === selectedYear;
      return matchSelf && matchMonth;
    }

    const matchMonth = p.periodMonth === selectedMonth && p.periodYear === selectedYear;
    const matchDept = selectedDept === 'ALL' || p.department === selectedDept;
    const matchQuery =
      p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchMonth && matchDept && matchQuery;
  });

  const totalPayrollExpenditure = filteredPayroll.reduce((acc, p) => acc + p.netSalary, 0);
  const totalLateDeductions = filteredPayroll.reduce((acc, p) => acc + p.deductionLate, 0);
  const totalTaxes = filteredPayroll.reduce((acc, p) => acc + p.deductionPph21, 0);

  const handleGenerateSingle = async () => {
    if (!selectedEmployeeForGen) return;
    setIsGeneratingSingle(true);
    try {
      await onGeneratePayroll(selectedEmployeeForGen, selectedMonth, selectedYear);
    } finally {
      setIsGeneratingSingle(false);
    }
  };

  const handleGenerateAll = async () => {
    setIsCalculatingAll(true);
    try {
      for (const emp of employees) {
        await onGeneratePayroll(emp.id, selectedMonth, selectedYear);
      }
    } finally {
      setIsCalculatingAll(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-purple-600 font-semibold text-xs tracking-wider uppercase">
            <Banknote className="w-4 h-4" />
            Modul 3: Otomatisasi Payroll & Finansial
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Pengolahan Gaji & Slip Gaji Digital
          </h2>
          <p className="text-sm text-slate-500">
            Kalkulasi otomatis gaji pokok, tunjangan kehadiran, pemotongan pajak PPh 21, BPJS, dan denda keterlambatan absensi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === 'FINANCE' ? (
            <button
              onClick={handleGenerateAll}
              disabled={isCalculatingAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isCalculatingAll ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Calculator className="w-4 h-4" />
              )}
              Hitung Payroll Massal (Semua Karyawan)
            </button>
          ) : currentUser.role === 'KARYAWAN' ? (
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Akses Mandiri: Slip Gaji Pribadi</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium">
              Wewenang Eksekusi: Divisi Finance
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Total Gaji Bersih Periode Ini
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Rp {totalPayrollExpenditure.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Untuk {filteredPayroll.length} slip gaji ({selectedMonth}/{selectedYear})
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Potongan Keterlambatan (Absensi)
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            Rp {totalLateDeductions.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dihitung otomatis dari log data kehadiran
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Pajak Penghasilan (PPh 21 Disetor)
          </span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            Rp {totalTaxes.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Estimasi withholding tax perusahaan
          </p>
        </div>
      </div>

      {/* Action Bar: Period Selector & Single Generator */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Left: Filter Month & Department */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500">Periode:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value={9}>September 2026</option>
            <option value={10}>Oktober 2026</option>
            <option value={11}>November 2026</option>
            <option value={12}>Desember 2026</option>
          </select>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">Semua Departemen</option>
            <option value="Teknologi Informasi">Teknologi Informasi</option>
            <option value="Sumber Daya Manusia">Sumber Daya Manusia</option>
            <option value="Keuangan & Akuntansi">Keuangan & Akuntansi</option>
            <option value="Pemasaran & Penjualan">Pemasaran & Penjualan</option>
            <option value="Operasional & Logistik">Operasional & Logistik</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs w-40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Right: Quick Single Employee Generator */}
        <div className="flex items-center gap-2">
          <select
            value={selectedEmployeeForGen}
            onChange={(e) => setSelectedEmployeeForGen(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium max-w-xs truncate"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName} ({e.id})
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateSingle}
            disabled={isGeneratingSingle || !selectedEmployeeForGen}
            className="px-3 py-1.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 disabled:opacity-40"
          >
            {isGeneratingSingle ? (
              <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Kalkulasi Satuan
          </button>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredPayroll.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Belum ada slip gaji yang dibuat untuk filter ini
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Klik tombol &quot;Hitung Payroll Massal&quot; untuk menjalankan kalkulasi otomatis.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Slip ID & Karyawan</th>
                  <th className="py-3.5 px-4">Gaji Pokok</th>
                  <th className="py-3.5 px-4">Tunjangan & Bonus</th>
                  <th className="py-3.5 px-4">Potongan (Absen/Pajak)</th>
                  <th className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">Take Home Pay</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayroll.map((item) => {
                  const totalAllowances = item.allowanceTransport + item.allowanceMeal + item.allowanceBonus;
                  const totalDeductions =
                    item.deductionLate +
                    item.deductionBpjsKesehatan +
                    item.deductionBpjsKetenagakerjaan +
                    item.deductionPph21 +
                    item.otherDeductions;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {item.employeeName}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {item.id} • {item.position}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        Rp {item.baseSalary.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        +Rp {totalAllowances.toLocaleString('id-ID')}
                        <span className="block text-[10px] text-slate-400">
                          (T: {item.allowanceTransport / 1000}k | M: {item.allowanceMeal / 1000}k | B: {item.allowanceBonus / 1000}k)
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-rose-600 dark:text-rose-400 font-medium">
                        -Rp {totalDeductions.toLocaleString('id-ID')}
                        <span className="block text-[10px] text-slate-400">
                          (Late: {item.deductionLate.toLocaleString('id-ID')} | Pajak: {item.deductionPph21.toLocaleString('id-ID')})
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-base">
                        Rp {item.netSalary.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {currentUser.role === 'FINANCE' ? (
                          <select
                            value={item.paymentStatus}
                            onChange={(e) =>
                              onUpdateStatus(
                                item.id,
                                e.target.value as 'Draft' | 'Diproses' | 'Dibayar'
                              )
                            }
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 focus:ring-2 focus:ring-purple-500 cursor-pointer ${
                              item.paymentStatus === 'Dibayar'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : item.paymentStatus === 'Diproses'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <option value="Draft">Draft</option>
                            <option value="Diproses">Diproses</option>
                            <option value="Dibayar">Dibayar</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                              item.paymentStatus === 'Dibayar'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : item.paymentStatus === 'Diproses'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {item.paymentStatus}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActivePayslip(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950 dark:hover:bg-purple-900 dark:text-purple-300 rounded-xl text-xs font-semibold transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Lihat Slip Gaji
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payslip Modal (Official Indonesian Format) */}
      {activePayslip && (
        <div 
          onClick={() => setActivePayslip(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer select-none"
          title="Klik di luar area slip gaji untuk menutup"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in zoom-in-95 cursor-default select-text relative"
          >
            {/* Modal Actions Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  Pratinjau Slip Gaji Karyawan
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-200/80 dark:bg-slate-700/80 px-2 py-0.5 rounded-full hidden sm:inline-block">
                  Klik luar untuk menutup (Esc)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintSlip}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak / Simpan PDF
                </button>
                <button
                  onClick={() => setActivePayslip(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                  title="Tutup (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Body */}
            <div className="p-8 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
              {/* Company Letterhead */}
              <div className="border-b-2 border-slate-800 pb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                    PT NUSANTARA TEKNOLOGI UTAMA
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gedung Menara Cyber Lt. 18, Jl. HR Rasuna Said, Jakarta Selatan 12950
                  </p>
                  <p className="text-xs text-slate-500">
                    Telp: (021) 5290-8800 • NPWP: 01.345.678.9-012.000
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs font-bold rounded">
                    SLIP GAJI RESMI
                  </span>
                  <div className="text-xs font-mono text-slate-500 mt-1">
                    No: {activePayslip.id}
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Periode: {activePayslip.periodMonth}/{activePayslip.periodYear}
                  </div>
                </div>
              </div>

              {/* Employee Meta Details */}
              <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-slate-500">Nama Karyawan:</div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {activePayslip.employeeName}
                  </div>
                  <div className="text-slate-500 mt-1">ID Karyawan: {activePayslip.employeeId}</div>
                </div>
                <div>
                  <div className="text-slate-500">Departemen:</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {activePayslip.department}
                  </div>
                  <div className="text-slate-500 mt-1">Jabatan: {activePayslip.position}</div>
                </div>
              </div>

              {/* Attendance metrics */}
              <div className="py-2.5 bg-slate-50 dark:bg-slate-800/50 px-3 rounded-lg text-xs flex justify-between my-4 text-slate-600 dark:text-slate-300">
                <span>Hari Kehadiran: <strong>{activePayslip.totalDaysPresent} Hari</strong></span>
                <span>Hari Terlambat: <strong>{activePayslip.totalDaysLate} Hari</strong></span>
                <span>Status Pembayaran: <strong className="text-emerald-600">{activePayslip.paymentStatus}</strong></span>
              </div>

              {/* Earnings & Deductions Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-4 text-xs">
                {/* Earnings (Penerimaan) */}
                <div className="space-y-2">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide border-b border-emerald-200 pb-1">
                    I. Penerimaan (Earnings)
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Gaji Pokok:</span>
                    <span className="font-medium">Rp {activePayslip.baseSalary.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Tunjangan Transportasi:</span>
                    <span className="font-medium">Rp {activePayslip.allowanceTransport.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Tunjangan Makan:</span>
                    <span className="font-medium">Rp {activePayslip.allowanceMeal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Bonus Performa:</span>
                    <span className="font-medium">Rp {activePayslip.allowanceBonus.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t font-bold text-slate-900 dark:text-white">
                    <span>Total Pendapatan Kotor:</span>
                    <span>
                      Rp {(activePayslip.baseSalary + activePayslip.allowanceTransport + activePayslip.allowanceMeal + activePayslip.allowanceBonus).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Deductions (Potongan) */}
                <div className="space-y-2">
                  <div className="font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide border-b border-rose-200 pb-1">
                    II. Potongan (Deductions)
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Denda Keterlambatan:</span>
                    <span className="font-medium text-rose-600">Rp {activePayslip.deductionLate.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">BPJS Kesehatan (1%):</span>
                    <span className="font-medium">Rp {activePayslip.deductionBpjsKesehatan.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">BPJS Ketenagakerjaan (2%):</span>
                    <span className="font-medium">Rp {activePayslip.deductionBpjsKetenagakerjaan.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Pajak PPh 21:</span>
                    <span className="font-medium">Rp {activePayslip.deductionPph21.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t font-bold text-rose-600">
                    <span>Total Potongan:</span>
                    <span>
                      Rp {(activePayslip.deductionLate + activePayslip.deductionBpjsKesehatan + activePayslip.deductionBpjsKetenagakerjaan + activePayslip.deductionPph21).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grand Total Net Salary */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between mt-6">
                <div>
                  <span className="text-xs uppercase text-slate-400 tracking-wider font-semibold">
                    GAJI BERSIH DITERIMA (TAKE HOME PAY)
                  </span>
                  <div className="text-[11px] text-emerald-400">
                    Ditransfer ke Rekening Bank Terdaftar pada {activePayslip.paymentDate}
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono">
                  Rp {activePayslip.netSalary.toLocaleString('id-ID')}
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 mt-8 pt-4 text-center text-xs">
                <div>
                  <p className="text-slate-500">Diterima oleh Karyawan,</p>
                  <div className="h-14"></div>
                  <p className="font-bold underline text-slate-800 dark:text-slate-200">
                    {activePayslip.employeeName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Disetujui oleh Direktur Keuangan / HRD,</p>
                  <div className="h-14 flex items-center justify-center">
                    <span className="text-[10px] text-blue-600 font-mono border border-blue-300 px-2 py-0.5 rounded">
                      [DIGITALLY SIGNED & VERIFIED]
                    </span>
                  </div>
                  <p className="font-bold underline text-slate-800 dark:text-slate-200">
                    Dimas Wicaksono, S.E.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
