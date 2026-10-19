import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Employee, 
  AttendanceRecord, 
  PayrollRecord, 
  JobOpening, 
  Candidate, 
  ToastMessage,
  CandidateStage 
} from './types/hris';
import { api } from './services/apiService';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/Toast';
import { DashboardModule } from './components/dashboard/DashboardModule';
import { EmployeeModule } from './components/employee/EmployeeModule';
import { AttendanceModule } from './components/attendance/AttendanceModule';
import { PayrollModule } from './components/payroll/PayrollModule';
import { RecruitmentModule } from './components/recruitment/RecruitmentModule';
import { ArchitectureModule } from './components/architecture/ArchitectureModule';
import { AlertCircle, RefreshCw, Menu, X, ShieldAlert, Lock } from 'lucide-react';

function MainApp() {
  const { currentUser } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data Stores
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Loading & Global Error
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Toast Notification Queue
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // RBAC Guard: If role changes and active tab is no longer permitted, redirect to dashboard!
  useEffect(() => {
    if (currentUser.role === 'KARYAWAN') {
      if (activeTab === 'employees' || activeTab === 'recruitment') {
        setActiveTab('dashboard');
        addToast('warning', 'Akses Dibatasi (RBAC)', 'Role Karyawan hanya memiliki akses self-service.');
      }
    } else if (currentUser.role === 'FINANCE') {
      if (activeTab === 'employees' || activeTab === 'recruitment') {
        setActiveTab('dashboard');
        addToast('warning', 'Segregasi Wewenang', 'Divisi Finance berfokus pada pengolahan gaji & audit keterlambatan.');
      }
    } else if (currentUser.role === 'HR') {
      // HR can view all administrative menus
    }
  }, [currentUser.role, activeTab, addToast]);

  // Initial Data Fetching from API Service
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const [empRes, attRes, payRes, jobRes, cndRes] = await Promise.all([
        api.getEmployees(),
        api.getAttendance(),
        api.getPayroll(),
        api.getJobs(),
        api.getCandidates(),
      ]);

      setEmployees(empRes.data);
      setAttendance(attRes.data);
      setPayroll(payRes.data);
      setJobs(jobRes.data);
      setCandidates(cndRes.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data dari server REST API';
      setGlobalError(msg);
      addToast('error', 'Koneksi API Gagal', msg);
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handler: Add Employee
  const handleAddEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    if (currentUser.role !== 'HR') {
      addToast('error', 'Akses Ditolak', 'Hanya role HR yang berwenang menambah data karyawan.');
      return;
    }
    try {
      const res = await api.createEmployee(employeeData);
      setEmployees((prev) => [res.data, ...prev]);
      addToast('success', 'Karyawan Baru Terdaftar', res.message);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mendaftarkan karyawan';
      addToast('error', 'Penyimpanan Gagal', msg);
      throw err;
    }
  };

  // Handler: Update Employee
  const handleUpdateEmployee = async (id: string, employeeData: Partial<Employee>) => {
    if (currentUser.role !== 'HR') {
      addToast('error', 'Akses Ditolak', 'Hanya role HR yang berwenang memperbarui master data.');
      return;
    }
    try {
      const res = await api.updateEmployee(id, employeeData);
      setEmployees((prev) => prev.map((e) => (e.id === id ? res.data : e)));
      addToast('success', 'Profil Diperbarui', res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal update data karyawan';
      addToast('error', 'Update Gagal', msg);
      throw err;
    }
  };

  // Handler: Delete Employee
  const handleDeleteEmployee = async (id: string) => {
    if (currentUser.role !== 'HR') {
      addToast('error', 'Akses Ditolak', 'Hanya role HR yang memiliki hak menghapus karyawan.');
      return;
    }
    try {
      const res = await api.deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      addToast('info', 'Data Terhapus', res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus karyawan';
      addToast('error', 'Penghapusan Gagal', msg);
      throw err;
    }
  };

  // Handler: Clock-In
  const handleClockIn = async (payload: { employeeId: string; location?: string; notes?: string }) => {
    try {
      const res = await api.clockIn(payload);
      setAttendance((prev) => {
        const filtered = prev.filter((a) => !(a.employeeId === res.data.employeeId && a.date === res.data.date));
        return [res.data, ...filtered];
      });
      addToast('success', 'Clock-In Berhasil', res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Clock-in gagal';
      addToast('error', 'Gagal Presensi Masuk', msg);
      throw err;
    }
  };

  // Handler: Clock-Out
  const handleClockOut = async (payload: { employeeId: string; notes?: string }) => {
    try {
      const res = await api.clockOut(payload);
      setAttendance((prev) => prev.map((a) => (a.id === res.data.id ? res.data : a)));
      addToast('success', 'Clock-Out Berhasil', res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Clock-out gagal';
      addToast('error', 'Gagal Presensi Pulang', msg);
      throw err;
    }
  };

  // Handler: Generate Payroll
  const handleGeneratePayroll = async (employeeId: string, month = 10, year = 2026) => {
    if (currentUser.role !== 'FINANCE') {
      addToast('error', 'Akses Ditolak', 'Kalkulasi payroll hanya dapat dijalankan oleh divisi Finance.');
      return;
    }
    try {
      const res = await api.generatePayrollForEmployee(employeeId, month, year);
      setPayroll((prev) => {
        const filtered = prev.filter((p) => !(p.employeeId === employeeId && p.periodMonth === month && p.periodYear === year));
        return [res.data, ...filtered];
      });
      addToast('success', 'Slip Gaji Dihasilkan', res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kalkulasi payroll gagal';
      addToast('error', 'Kalkulasi Gagal', msg);
      throw err;
    }
  };

  // Handler: Update Payroll Status
  const handleUpdatePayrollStatus = async (id: string, status: 'Draft' | 'Diproses' | 'Dibayar') => {
    if (currentUser.role !== 'FINANCE') {
      addToast('error', 'Akses Ditolak', 'Hanya divisi Finance yang berwenang mengubah status pembayaran.');
      return;
    }
    try {
      const res = await api.updatePayrollStatus(id, status);
      setPayroll((prev) => prev.map((p) => (p.id === id ? res.data : p)));
      addToast('info', 'Status Payroll', res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah status';
      addToast('error', 'Update Status Gagal', msg);
      throw err;
    }
  };

  // Handler: Create Job
  const handleCreateJob = async (payload: Omit<JobOpening, 'id' | 'applicantCount' | 'postedDate'>) => {
    if (currentUser.role !== 'HR') {
      addToast('error', 'Akses Ditolak', 'Hanya role HR yang berwenang menerbitkan lowongan pekerjaan.');
      return;
    }
    try {
      const res = await api.createJob(payload);
      setJobs((prev) => [res.data, ...prev]);
      addToast('success', 'Lowongan Dibuka', res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat lowongan';
      addToast('error', 'Gagal Posting Lowongan', msg);
      throw err;
    }
  };

  // Handler: Update Job Status
  const handleUpdateJobStatus = async (id: string, status: 'Buka' | 'Tutup' | 'Draft') => {
    if (currentUser.role !== 'HR') {
      addToast('error', 'Akses Ditolak', 'Hanya role HR yang berwenang mengatur status lowongan.');
      return;
    }
    try {
      const res = await api.updateJobStatus(id, status);
      setJobs((prev) => prev.map((j) => (j.id === id ? res.data : j)));
      addToast('info', 'Status Lowongan', res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal ubah status lowongan';
      addToast('error', 'Gagal Update Status', msg);
      throw err;
    }
  };

  // Handler: Create Candidate
  const handleCreateCandidate = async (payload: Omit<Candidate, 'id' | 'appliedDate'>) => {
    try {
      const res = await api.createCandidate(payload);
      setCandidates((prev) => [res.data, ...prev]);
      setJobs((prev) =>
        prev.map((j) => (j.id === payload.jobOpeningId ? { ...j, applicantCount: j.applicantCount + 1 } : j))
      );
      addToast('success', 'Kandidat Ditambahkan', res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mendaftarkan kandidat';
      addToast('error', 'Pendaftaran Gagal', msg);
      throw err;
    }
  };

  // Handler: Update Candidate Stage
  const handleUpdateCandidateStage = async (id: string, stage: CandidateStage, score?: number, notes?: string) => {
    if (currentUser.role !== 'HR') {
      addToast('error', 'Akses Ditolak', 'Hanya HR yang berwenang mengelola tahapan seleksi ATS.');
      return;
    }
    try {
      const res = await api.updateCandidateStage(id, stage, score, notes);
      setCandidates((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      addToast('info', 'Tahapan Seleksi', res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah tahap kandidat';
      addToast('error', 'Gagal Update Stage', msg);
      throw err;
    }
  };

  // Cross-Module: Convert Candidate into Employee
  const handleConvertCandidateToEmployee = async (candidateId: string) => {
    if (currentUser.role !== 'HR') {
      addToast('error', 'Akses Ditolak', 'Hanya HR yang berwenang mengangkat kandidat menjadi karyawan.');
      return;
    }
    try {
      const res = await api.convertCandidateToEmployee(candidateId);
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, stage: 'Diterima' as CandidateStage } : c))
      );
      setEmployees((prev) => [res.data, ...prev]);

      addToast('success', 'Onboarding Berhasil!', res.message);
      confetti({ particleCount: 70, spread: 90, origin: { y: 0.6 } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengangkat karyawan';
      addToast('error', 'Konversi Gagal', msg);
      throw err;
    }
  };

  // Reset to Factory Data
  const handleResetData = () => {
    if (window.confirm('Kembalikan semua data ke setelan awal pabrik (default demo)?')) {
      api.resetToFactory();
      loadAllData();
      addToast('info', 'Database Di-reset', 'Semua data simulasi berhasil dikembalikan ke default.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navbar with Role Switcher */}
      <Navbar
        onQuickClockIn={() => {
          setActiveTab('attendance');
          setIsMobileMenuOpen(false);
        }}
        pendingApplicantsCount={candidates.filter((c) => c.stage === 'Melamar').length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar with Role-Based Menu Rendering */}
        <div className="hidden md:block">
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tabId) => setActiveTab(tabId)}
            onResetData={handleResetData}
            candidateCount={candidates.filter((c) => c.stage !== 'Ditolak').length}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden bg-slate-900/60 backdrop-blur-xs flex">
            <div className="w-64 bg-slate-900 h-full p-4 flex flex-col justify-between">
              <Sidebar
                activeTab={activeTab}
                onSelectTab={(tabId) => {
                  setActiveTab(tabId);
                  setIsMobileMenuOpen(false);
                }}
                onResetData={handleResetData}
                candidateCount={candidates.filter((c) => c.stage !== 'Ditolak').length}
              />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex-1 p-4 text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Mobile Navigation Trigger Button */}
          <div className="md:hidden mb-4 flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <Menu className="w-5 h-5 text-blue-600" />
              <span>Menu Hak Akses ({currentUser.role})</span>
            </button>
            <span className="text-xs font-bold text-blue-600 uppercase">
              {activeTab}
            </span>
          </div>

          {/* Global Network / Storage Error */}
          {globalError && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{globalError}</span>
              </div>
              <button
                onClick={loadAllData}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba Lagi
              </button>
            </div>
          )}

          {/* View Routing & Role Guarding */}
          {activeTab === 'dashboard' && (
            <DashboardModule
              employees={employees}
              attendance={attendance}
              payroll={payroll}
              jobs={jobs}
              candidates={candidates}
              onNavigate={(tabId) => setActiveTab(tabId)}
            />
          )}

          {activeTab === 'employees' && (
            currentUser.role === 'HR' ? (
              <EmployeeModule
                employees={employees}
                isLoading={isLoading}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onRefresh={loadAllData}
              />
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Akses Dibatasi (RBAC Guard)</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Modul Master Data Karyawan hanya dapat diakses oleh peran <strong>HR (Human Resources)</strong>. Anda saat ini login sebagai <strong>{currentUser.role}</strong>.
                </p>
              </div>
            )
          )}

          {activeTab === 'attendance' && (
            <AttendanceModule
              employees={employees}
              attendance={attendance}
              isLoading={isLoading}
              onClockIn={handleClockIn}
              onClockOut={handleClockOut}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'payroll' && (
            <PayrollModule
              employees={employees}
              payroll={payroll}
              isLoading={isLoading}
              onGeneratePayroll={handleGeneratePayroll}
              onUpdateStatus={handleUpdatePayrollStatus}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'recruitment' && (
            currentUser.role === 'HR' ? (
              <RecruitmentModule
                jobs={jobs}
                candidates={candidates}
                isLoading={isLoading}
                onCreateJob={handleCreateJob}
                onUpdateJobStatus={handleUpdateJobStatus}
                onCreateCandidate={handleCreateCandidate}
                onUpdateCandidateStage={handleUpdateCandidateStage}
                onConvertCandidateToEmployee={handleConvertCandidateToEmployee}
                onRefresh={loadAllData}
              />
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Akses Dibatasi (RBAC Guard)</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Modul Perekrutan Tenaga Kerja (ATS) hanya dapat diakses oleh peran <strong>HR (Human Resources)</strong>.
                </p>
              </div>
            )
          )}

          {activeTab === 'architecture' && <ArchitectureModule />}
        </main>
      </div>

      {/* Floating Global Toast Notification Stack */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
