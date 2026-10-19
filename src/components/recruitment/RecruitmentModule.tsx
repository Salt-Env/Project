import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  FileCheck, 
  Building2, 
  Calendar, 
  UserPlus, 
  Award, 
  FileText, 
  Sparkles,
  X,
  AlertCircle
} from 'lucide-react';
import { JobOpening, Candidate, DepartmentName, JobType, CandidateStage } from '../../types/hris';

interface RecruitmentModuleProps {
  jobs: JobOpening[];
  candidates: Candidate[];
  isLoading: boolean;
  onCreateJob: (payload: Omit<JobOpening, 'id' | 'applicantCount' | 'postedDate'>) => Promise<void>;
  onUpdateJobStatus: (id: string, status: 'Buka' | 'Tutup' | 'Draft') => Promise<void>;
  onCreateCandidate: (payload: Omit<Candidate, 'id' | 'appliedDate'>) => Promise<void>;
  onUpdateCandidateStage: (id: string, stage: CandidateStage, score?: number, notes?: string) => Promise<void>;
  onConvertCandidateToEmployee: (candidateId: string) => Promise<void>;
  onRefresh: () => void;
}

const DEPARTMENTS: DepartmentName[] = [
  'Teknologi Informasi',
  'Sumber Daya Manusia',
  'Keuangan & Akuntansi',
  'Pemasaran & Penjualan',
  'Operasional & Logistik'
];

const STAGES: CandidateStage[] = ['Melamar', 'Screening', 'Wawancara', 'Penawaran', 'Diterima', 'Ditolak'];

export const RecruitmentModule: React.FC<RecruitmentModuleProps> = ({
  jobs,
  candidates,
  isLoading,
  onCreateJob,
  onUpdateJobStatus,
  onCreateCandidate,
  onUpdateCandidateStage,
  onConvertCandidateToEmployee,
}) => {
  const [activeTab, setActiveTab] = useState<'JOBS' | 'CANDIDATES'>('JOBS');
  
  // Job modal
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [jobFormError, setJobFormError] = useState<string | null>(null);

  // Candidate modal
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isSubmittingCandidate, setIsSubmittingCandidate] = useState(false);
  const [candidateFormError, setCandidateFormError] = useState<string | null>(null);

  // Filter
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('ALL');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  const [searchCandidate, setSearchCandidate] = useState<string>('');

  // New Job Form State
  const [jobFormData, setJobFormData] = useState({
    title: '',
    department: 'Teknologi Informasi' as DepartmentName,
    type: 'Penuh Waktu (Full-time)' as JobType,
    location: 'Jakarta Selatan / Hybrid',
    experienceLevel: 'Mid-Level' as const,
    salaryRangeMin: 10000000,
    salaryRangeMax: 15000000,
    quota: 1,
    status: 'Buka' as const,
    deadlineDate: '2026-11-30',
    description: '',
    requirements: 'Pengalaman min 2 tahun di bidang terkait\nMemiliki keahlian komunikasi yang baik\nTerbiasa bekerja dalam tim',
  });

  // New Candidate Form State
  const [candidateFormData, setCandidateFormData] = useState({
    jobOpeningId: jobs[0]?.id || '',
    fullName: '',
    email: '',
    phone: '',
    education: 'S1 Sistem Informasi - Universitas Terkemuka',
    experienceYears: 2,
    stage: 'Melamar' as CandidateStage,
    resumeFileName: 'Curriculum_Vitae.pdf',
    interviewScore: 80,
    notes: '',
  });

  // Handle Job Submit
  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobFormData.title.trim()) {
      setJobFormError('Judul lowongan wajib diisi');
      return;
    }
    setIsSubmittingJob(true);
    setJobFormError(null);
    try {
      const requirementsArr = jobFormData.requirements
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      await onCreateJob({
        ...jobFormData,
        requirements: requirementsArr,
      });
      setIsAddJobOpen(false);
    } catch (err: unknown) {
      setJobFormError(err instanceof Error ? err.message : 'Gagal membuat lowongan');
    } finally {
      setIsSubmittingJob(false);
    }
  };

  // Handle Candidate Submit
  const handleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateFormData.fullName.trim() || !candidateFormData.email.trim()) {
      setCandidateFormError('Nama lengkap dan email kandidat wajib diisi');
      return;
    }
    setIsSubmittingCandidate(true);
    setCandidateFormError(null);
    try {
      const matchedJob = jobs.find((j) => j.id === candidateFormData.jobOpeningId);
      await onCreateCandidate({
        ...candidateFormData,
        jobTitle: matchedJob ? matchedJob.title : 'Lowongan Umum',
      });
      setIsAddCandidateOpen(false);
    } catch (err: unknown) {
      setCandidateFormError(err instanceof Error ? err.message : 'Gagal menambah pelamar');
    } finally {
      setIsSubmittingCandidate(false);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchJob = selectedJobFilter === 'ALL' || c.jobOpeningId === selectedJobFilter;
    const matchStage = selectedStageFilter === 'ALL' || c.stage === selectedStageFilter;
    const matchSearch =
      c.fullName.toLowerCase().includes(searchCandidate.toLowerCase()) ||
      c.email.toLowerCase().includes(searchCandidate.toLowerCase()) ||
      c.jobTitle.toLowerCase().includes(searchCandidate.toLowerCase());

    return matchJob && matchStage && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs tracking-wider uppercase">
            <Briefcase className="w-4 h-4" />
            Modul 4: Perekrutan Tenaga Kerja & ATS
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Manajemen Lowongan & Seleksi Kandidat
          </h2>
          <p className="text-sm text-slate-500">
            Publikasi posisi pekerjaan, screening pelamar kerja, evaluasi wawancara, hingga pengangkatan resmi karyawan baru.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'JOBS' ? (
            <button
              onClick={() => setIsAddJobOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              Posting Lowongan Baru
            </button>
          ) : (
            <button
              onClick={() => setIsAddCandidateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Kandidat Pelamar
            </button>
          )}
        </div>
      </div>

      {/* Module Switcher Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('JOBS')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'JOBS'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Daftar Lowongan Pekerjaan ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('CANDIDATES')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'CANDIDATES'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Pipeline Pelamar / Pelamar Kerja ({candidates.length})
        </button>
      </div>

      {/* TAB 1: LOWONGAN KERJA (JOB VACANCIES) */}
      {activeTab === 'JOBS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {job.id}
                    </span>
                    {/* Status Dropdown */}
                    <select
                      value={job.status}
                      onChange={(e) =>
                        onUpdateJobStatus(job.id, e.target.value as 'Buka' | 'Tutup' | 'Draft')
                      }
                      className={`text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer border-0 ${
                        job.status === 'Buka'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : job.status === 'Tutup'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <option value="Buka">Buka (Hiring)</option>
                      <option value="Tutup">Tutup</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2.5 leading-snug">
                    {job.title}
                  </h3>

                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.department}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Estimasi Gaji:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Rp {(job.salaryRangeMin / 1000000).toFixed(0)} - {(job.salaryRangeMax / 1000000).toFixed(0)} Jt
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Lokasi & Tipe:</span>
                      <span>{job.location}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Batas Lamaran:</span>
                      <span className="text-rose-600 font-medium">{job.deadlineDate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
                    <Users className="w-3.5 h-3.5" />
                    <span>{job.applicantCount} Pelamar Masuk</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedJobFilter(job.id);
                      setActiveTab('CANDIDATES');
                    }}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    Lihat Pelamar
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PELAMAR KERJA (CANDIDATES PIPELINE) */}
      {activeTab === 'CANDIDATES' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kandidat berdasarkan nama atau email..."
                value={searchCandidate}
                onChange={(e) => setSearchCandidate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedJobFilter}
                onChange={(e) => setSelectedJobFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Semua Posisi Lowongan</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>

              <select
                value={selectedStageFilter}
                onChange={(e) => setSelectedStageFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Semua Tahap Seleksi</option>
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Candidates Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {filteredCandidates.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Tidak ada kandidat pada tahap ini
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Tambahkan kandidat pelamar baru atau sesuaikan filter posisi lowongan.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Nama Pelamar</th>
                      <th className="py-3.5 px-4">Posisi Dilamar</th>
                      <th className="py-3.5 px-4">Pendidikan & Pengalaman</th>
                      <th className="py-3.5 px-4 text-center">Skor Review</th>
                      <th className="py-3.5 px-4">Tahapan Seleksi</th>
                      <th className="py-3.5 px-4 text-right">Aksi HR & Onboarding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCandidates.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {c.fullName}
                          </div>
                          <div className="text-xs text-slate-400">{c.email} • {c.phone}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{c.jobTitle}</div>
                          <span className="text-[11px] text-slate-400">Melamar: {c.appliedDate}</span>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          <div className="text-slate-700 dark:text-slate-300 font-medium">{c.education}</div>
                          <span className="text-slate-400">{c.experienceYears} tahun pengalaman</span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {c.interviewScore ? (
                            <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs rounded-full">
                              {c.interviewScore} / 100
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={c.stage}
                            onChange={(e) =>
                              onUpdateCandidateStage(c.id, e.target.value as CandidateStage)
                            }
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer border-0 ${
                              c.stage === 'Diterima'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : c.stage === 'Penawaran'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : c.stage === 'Wawancara'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : c.stage === 'Ditolak'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {/* Cross-module Workflow button: Hire & Convert to Employee */}
                          {c.stage === 'Diterima' || c.stage === 'Penawaran' ? (
                            <button
                              onClick={() => onConvertCandidateToEmployee(c.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
                              title="Terbitkan SK dan masukkan ke Master Data Karyawan"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Angkat Jadi Karyawan
                            </button>
                          ) : (
                            <button
                              onClick={() => onUpdateCandidateStage(c.id, 'Wawancara', 85, 'Dijadwalkan User Interview')}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              Jadwalkan Interview
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: POST JOB */}
      {isAddJobOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Publikasikan Lowongan Kerja Baru
              </h3>
              <button
                onClick={() => setIsAddJobOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {jobFormError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{jobFormError}</span>
              </div>
            )}

            <form onSubmit={handleJobSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Posisi Pekerjaan (Job Title) *
                </label>
                <input
                  type="text"
                  required
                  value={jobFormData.title}
                  onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                  placeholder="Contoh: Senior DevOps Engineer"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Departemen
                  </label>
                  <select
                    value={jobFormData.department}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, department: e.target.value as DepartmentName })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tipe Pekerjaan
                  </label>
                  <select
                    value={jobFormData.type}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, type: e.target.value as JobType })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="Penuh Waktu (Full-time)">Penuh Waktu (Full-time)</option>
                    <option value="Paruh Waktu (Part-time)">Paruh Waktu (Part-time)</option>
                    <option value="Kontrak">Kontrak</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Gaji Minimum (IDR)
                  </label>
                  <input
                    type="number"
                    step={1000000}
                    value={jobFormData.salaryRangeMin}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, salaryRangeMin: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Gaji Maksimum (IDR)
                  </label>
                  <input
                    type="number"
                    step={1000000}
                    value={jobFormData.salaryRangeMax}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, salaryRangeMax: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Deskripsi Pekerjaan
                </label>
                <textarea
                  rows={2}
                  value={jobFormData.description}
                  onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                  placeholder="Ringkasan tanggung jawab dan peran..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Kualifikasi / Persyaratan (1 baris per poin)
                </label>
                <textarea
                  rows={3}
                  value={jobFormData.requirements}
                  onChange={(e) => setJobFormData({ ...jobFormData, requirements: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddJobOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJob}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  {isSubmittingJob && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  Terbitkan Lowongan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CANDIDATE */}
      {isAddCandidateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Registrasi Pelamar Baru
              </h3>
              <button
                onClick={() => setIsAddCandidateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {candidateFormError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{candidateFormError}</span>
              </div>
            )}

            <form onSubmit={handleCandidateSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Pilih Posisi yang Dilamar *
                </label>
                <select
                  value={candidateFormData.jobOpeningId}
                  onChange={(e) =>
                    setCandidateFormData({ ...candidateFormData, jobOpeningId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Lengkap Pelamar *
                </label>
                <input
                  type="text"
                  required
                  value={candidateFormData.fullName}
                  onChange={(e) =>
                    setCandidateFormData({ ...candidateFormData, fullName: e.target.value })
                  }
                  placeholder="Contoh: Rian Pratama, S.T."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Aktif *
                  </label>
                  <input
                    type="email"
                    required
                    value={candidateFormData.email}
                    onChange={(e) =>
                      setCandidateFormData({ ...candidateFormData, email: e.target.value })
                    }
                    placeholder="rian@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    No Telepon / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={candidateFormData.phone}
                    onChange={(e) =>
                      setCandidateFormData({ ...candidateFormData, phone: e.target.value })
                    }
                    placeholder="0812-9988-7766"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Pendidikan Terakhir
                  </label>
                  <input
                    type="text"
                    value={candidateFormData.education}
                    onChange={(e) =>
                      setCandidateFormData({ ...candidateFormData, education: e.target.value })
                    }
                    placeholder="S1 Teknik Informatika"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Pengalaman Kerja (Tahun)
                  </label>
                  <input
                    type="number"
                    value={candidateFormData.experienceYears}
                    onChange={(e) =>
                      setCandidateFormData({
                        ...candidateFormData,
                        experienceYears: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCandidateOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCandidate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  {isSubmittingCandidate && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  Simpan Pelamar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
