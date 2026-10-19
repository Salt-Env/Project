export type DepartmentName = 
  | 'Teknologi Informasi'
  | 'Sumber Daya Manusia'
  | 'Keuangan & Akuntansi'
  | 'Pemasaran & Penjualan'
  | 'Operasional & Logistik';

export type UserRole = 'KARYAWAN' | 'HR' | 'FINANCE';

export interface UserAccount {
  id: string; // e.g. "USR-001"
  username: string;
  email: string;
  role: UserRole;
  employeeId?: string; // Links to Employee.id
  displayName: string;
  avatarUrl?: string;
  department?: DepartmentName;
}

export type EmploymentType = 'Tetap (Permanent)' | 'Kontrak (Contract)' | 'Magang (Intern)';
export type EmployeeStatus = 'Aktif' | 'Cuti' | 'Resigned';

export interface Employee {
  id: string; // e.g. "EMP-2024-001"
  nik: string; // 16 digit Indonesian NIK
  fullName: string;
  email: string;
  phone: string;
  department: DepartmentName;
  position: string;
  joinDate: string; // YYYY-MM-DD
  employmentType: EmploymentType;
  status: EmployeeStatus;
  baseSalary: number; // in IDR
  allowanceTransport: number;
  allowanceMeal: number;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    holderName: string;
  };
  avatarUrl?: string;
}

export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpha';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  clockInTime: string | null; // HH:mm:ss
  clockOutTime: string | null; // HH:mm:ss
  status: AttendanceStatus;
  lateMinutes: number;
  location?: string;
  notes?: string;
}

export interface PayrollRecord {
  id: string; // e.g. "PAY-2024-10-001"
  employeeId: string;
  employeeName: string;
  department: DepartmentName;
  position: string;
  periodMonth: number; // 1-12
  periodYear: number;
  baseSalary: number;
  allowanceTransport: number;
  allowanceMeal: number;
  allowanceBonus: number;
  deductionLate: number; // calculated from attendance late minutes
  deductionBpjsKesehatan: number; // 1%
  deductionBpjsKetenagakerjaan: number; // 2%
  deductionPph21: number; // Tax estimation
  otherDeductions: number;
  netSalary: number; // Take home pay
  paymentDate: string;
  paymentStatus: 'Draft' | 'Diproses' | 'Dibayar';
  totalDaysPresent: number;
  totalDaysLate: number;
}

export type JobStatus = 'Buka' | 'Tutup' | 'Draft';
export type JobType = 'Penuh Waktu (Full-time)' | 'Paruh Waktu (Part-time)' | 'Kontrak';

export interface JobOpening {
  id: string;
  title: string;
  department: DepartmentName;
  type: JobType;
  location: string;
  experienceLevel: 'Entry-Level' | 'Mid-Level' | 'Senior' | 'Lead';
  salaryRangeMin: number;
  salaryRangeMax: number;
  quota: number;
  status: JobStatus;
  postedDate: string;
  deadlineDate: string;
  description: string;
  requirements: string[];
  applicantCount: number;
}

export type CandidateStage = 'Melamar' | 'Screening' | 'Wawancara' | 'Penawaran' | 'Diterima' | 'Ditolak';

export interface Candidate {
  id: string;
  jobOpeningId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  education: string;
  experienceYears: number;
  appliedDate: string;
  stage: CandidateStage;
  resumeFileName: string;
  interviewScore?: number; // 1-100
  notes?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}
