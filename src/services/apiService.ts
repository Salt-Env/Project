import { 
  Employee, 
  AttendanceRecord, 
  PayrollRecord, 
  JobOpening, 
  Candidate, 
  ApiResponse,
  CandidateStage
} from '../types/hris';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_ATTENDANCE, 
  INITIAL_PAYROLL, 
  INITIAL_JOB_OPENINGS, 
  INITIAL_CANDIDATES 
} from '../data/initialData';

const STORAGE_KEYS = {
  EMPLOYEES: 'hris_employees_v1',
  ATTENDANCE: 'hris_attendance_v1',
  PAYROLL: 'hris_payroll_v1',
  JOBS: 'hris_jobs_v1',
  CANDIDATES: 'hris_candidates_v1',
};

// Helper to simulate realistic network delay
const delay = (ms = 350) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  private getStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Storage write error:', e);
    }
  }

  // Reset to initial mock data
  public resetToFactory(): void {
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.PAYROLL);
    localStorage.removeItem(STORAGE_KEYS.JOBS);
    localStorage.removeItem(STORAGE_KEYS.CANDIDATES);
  }

  // ================= EMPLOYEES =================
  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    await delay(300);
    const employees = this.getStorage<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    return {
      success: true,
      message: 'Data seluruh karyawan berhasil dimuat',
      data: employees,
      meta: { total: employees.length }
    };
  }

  async getEmployeeById(id: string): Promise<ApiResponse<Employee>> {
    await delay(200);
    const employees = this.getStorage<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const emp = employees.find(e => e.id === id);
    if (!emp) throw new Error(`Karyawan dengan ID ${id} tidak ditemukan.`);
    return {
      success: true,
      message: 'Detail karyawan ditemukan',
      data: emp
    };
  }

  async createEmployee(payload: Omit<Employee, 'id'>): Promise<ApiResponse<Employee>> {
    await delay(400);
    const employees = this.getStorage<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    
    // Check duplicate NIK
    if (employees.some(e => e.nik === payload.nik)) {
      throw new Error(`NIK ${payload.nik} sudah terdaftar dalam sistem HRIS!`);
    }

    const nextNum = employees.length + 1;
    const newId = `EMP-${String(nextNum).padStart(3, '0')}`;
    const newEmployee: Employee = {
      ...payload,
      id: newId,
    };

    employees.unshift(newEmployee);
    this.setStorage(STORAGE_KEYS.EMPLOYEES, employees);

    return {
      success: true,
      message: `Karyawan baru ${newEmployee.fullName} (${newEmployee.id}) berhasil ditambahkan ke database!`,
      data: newEmployee
    };
  }

  async updateEmployee(id: string, payload: Partial<Employee>): Promise<ApiResponse<Employee>> {
    await delay(350);
    const employees = this.getStorage<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) throw new Error(`Karyawan ID ${id} tidak ditemukan.`);

    employees[index] = { ...employees[index], ...payload };
    this.setStorage(STORAGE_KEYS.EMPLOYEES, employees);

    return {
      success: true,
      message: `Profil karyawan ${employees[index].fullName} berhasil diperbarui!`,
      data: employees[index]
    };
  }

  async deleteEmployee(id: string): Promise<ApiResponse<{ id: string }>> {
    await delay(300);
    let employees = this.getStorage<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const target = employees.find(e => e.id === id);
    if (!target) throw new Error(`Karyawan ID ${id} tidak ditemukan.`);

    employees = employees.filter(e => e.id !== id);
    this.setStorage(STORAGE_KEYS.EMPLOYEES, employees);

    return {
      success: true,
      message: `Data karyawan ${target.fullName} berhasil dihapus dari sistem.`,
      data: { id }
    };
  }

  // ================= ATTENDANCE =================
  async getAttendance(filterDate?: string): Promise<ApiResponse<AttendanceRecord[]>> {
    await delay(250);
    const attendance = this.getStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const filtered = filterDate 
      ? attendance.filter(a => a.date === filterDate)
      : attendance;

    return {
      success: true,
      message: 'Data kehadiran berhasil dimuat',
      data: filtered,
      meta: { total: filtered.length }
    };
  }

  async clockIn(payload: { employeeId: string; location?: string; notes?: string }): Promise<ApiResponse<AttendanceRecord>> {
    await delay(500);
    const employees = this.getStorage<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const emp = employees.find(e => e.id === payload.employeeId);
    if (!emp) throw new Error('Data karyawan tidak valid.');

    const attendanceList = this.getStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const today = new Date().toISOString().split('T')[0];

    // Check if already clocked in today
    const existing = attendanceList.find(a => a.employeeId === payload.employeeId && a.date === today);
    if (existing && existing.clockInTime) {
      throw new Error(`Anda sudah melakukan Clock-In hari ini pada pukul ${existing.clockInTime}!`);
    }

    const now = new Date();
    const currentTimeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss
    
    // Shift starts at 08:30:00
    const [hours, minutes] = currentTimeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const shiftStartMinutes = 8 * 60 + 30; // 08:30 AM
    const isLate = totalMinutes > shiftStartMinutes;
    const lateMinutes = isLate ? totalMinutes - shiftStartMinutes : 0;

    const record: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      date: today,
      clockInTime: currentTimeStr,
      clockOutTime: null,
      status: isLate ? 'Terlambat' : 'Hadir',
      lateMinutes,
      location: payload.location || 'Kantor Pusat - Jakarta (GPS Verified)',
      notes: payload.notes || (isLate ? `Terlambat ${lateMinutes} menit` : 'Tepat waktu')
    };

    if (existing) {
      // update
      const idx = attendanceList.findIndex(a => a.id === existing.id);
      attendanceList[idx] = { ...existing, ...record };
    } else {
      attendanceList.unshift(record);
    }

    this.setStorage(STORAGE_KEYS.ATTENDANCE, attendanceList);

    return {
      success: true,
      message: isLate 
        ? `Clock-In berhasil dicatat pada ${currentTimeStr} (Status: Terlambat ${lateMinutes} menit).`
        : `Clock-In berhasil! Selamat bertugas pada ${currentTimeStr}.`,
      data: record
    };
  }

  async clockOut(payload: { employeeId: string; notes?: string }): Promise<ApiResponse<AttendanceRecord>> {
    await delay(450);
    const attendanceList = this.getStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const today = new Date().toISOString().split('T')[0];

    const record = attendanceList.find(a => a.employeeId === payload.employeeId && a.date === today);
    if (!record || !record.clockInTime) {
      throw new Error('Anda belum melakukan Clock-In hari ini.');
    }
    if (record.clockOutTime) {
      throw new Error(`Anda sudah melakukan Clock-Out sebelumnya pada ${record.clockOutTime}.`);
    }

    const currentTimeStr = new Date().toTimeString().split(' ')[0];
    record.clockOutTime = currentTimeStr;
    if (payload.notes) {
      record.notes = (record.notes ? record.notes + ' | ' : '') + payload.notes;
    }

    this.setStorage(STORAGE_KEYS.ATTENDANCE, attendanceList);

    return {
      success: true,
      message: `Clock-Out berhasil pada ${currentTimeStr}. Selamat beristirahat!`,
      data: record
    };
  }

  // ================= PAYROLL =================
  async getPayroll(): Promise<ApiResponse<PayrollRecord[]>> {
    await delay(300);
    const payroll = this.getStorage<PayrollRecord[]>(STORAGE_KEYS.PAYROLL, INITIAL_PAYROLL);
    return {
      success: true,
      message: 'Daftar payroll berhasil dimuat',
      data: payroll,
      meta: { total: payroll.length }
    };
  }

  async generatePayrollForEmployee(employeeId: string, month = 10, year = 2026): Promise<ApiResponse<PayrollRecord>> {
    await delay(600);
    const employees = this.getStorage<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) throw new Error('Data karyawan tidak ditemukan.');

    const attendance = this.getStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const empAttendance = attendance.filter(a => a.employeeId === employeeId);

    const totalDaysPresent = empAttendance.filter(a => a.status === 'Hadir' || a.status === 'Terlambat').length || 20;
    const lateDays = empAttendance.filter(a => a.status === 'Terlambat');
    const totalLateMinutes = lateDays.reduce((acc, curr) => acc + (curr.lateMinutes || 0), 0);

    // Business rule: Potongan keterlambatan Rp 2.500 per menit keterlambatan
    const deductionLate = totalLateMinutes * 2500;

    // Indonesian BPJS Standard:
    // BPJS Kesehatan = 1% gaji pokok
    // BPJS Ketenagakerjaan (JHT + JP) = 2% + 1% = ~2-3%
    const deductionBpjsKesehatan = Math.round(emp.baseSalary * 0.01);
    const deductionBpjsKetenagakerjaan = Math.round(emp.baseSalary * 0.02);
    
    // PPh 21 estimation
    const grossTaxable = emp.baseSalary + emp.allowanceTransport + emp.allowanceMeal;
    const deductionPph21 = Math.round(grossTaxable * 0.03); // simplified bracket

    const bonus = 500000;
    const totalEarnings = emp.baseSalary + emp.allowanceTransport + emp.allowanceMeal + bonus;
    const totalDeductions = deductionLate + deductionBpjsKesehatan + deductionBpjsKetenagakerjaan + deductionPph21;
    const netSalary = totalEarnings - totalDeductions;

    const newPayroll: PayrollRecord = {
      id: `PAY-${year}-${String(month).padStart(2, '0')}-${emp.id.replace('EMP-', '')}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      department: emp.department,
      position: emp.position,
      periodMonth: month,
      periodYear: year,
      baseSalary: emp.baseSalary,
      allowanceTransport: emp.allowanceTransport,
      allowanceMeal: emp.allowanceMeal,
      allowanceBonus: bonus,
      deductionLate,
      deductionBpjsKesehatan,
      deductionBpjsKetenagakerjaan,
      deductionPph21,
      otherDeductions: 0,
      netSalary,
      paymentDate: `${year}-${String(month).padStart(2, '0')}-25`,
      paymentStatus: 'Diproses',
      totalDaysPresent,
      totalDaysLate: lateDays.length
    };

    const payrollList = this.getStorage<PayrollRecord[]>(STORAGE_KEYS.PAYROLL, INITIAL_PAYROLL);
    const existingIndex = payrollList.findIndex(p => p.employeeId === emp.id && p.periodMonth === month && p.periodYear === year);

    if (existingIndex >= 0) {
      payrollList[existingIndex] = newPayroll;
    } else {
      payrollList.unshift(newPayroll);
    }

    this.setStorage(STORAGE_KEYS.PAYROLL, payrollList);

    return {
      success: true,
      message: `Slip gaji periode ${month}/${year} untuk ${emp.fullName} berhasil dikalkulasi otomatis!`,
      data: newPayroll
    };
  }

  async updatePayrollStatus(id: string, status: 'Draft' | 'Diproses' | 'Dibayar'): Promise<ApiResponse<PayrollRecord>> {
    await delay(300);
    const payrollList = this.getStorage<PayrollRecord[]>(STORAGE_KEYS.PAYROLL, INITIAL_PAYROLL);
    const idx = payrollList.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Data payroll tidak ditemukan.');

    payrollList[idx].paymentStatus = status;
    this.setStorage(STORAGE_KEYS.PAYROLL, payrollList);

    return {
      success: true,
      message: `Status pembayaran payroll ${id} diperbarui menjadi '${status}'.`,
      data: payrollList[idx]
    };
  }

  // ================= RECRUITMENT & JOBS =================
  async getJobs(): Promise<ApiResponse<JobOpening[]>> {
    await delay(250);
    const jobs = this.getStorage<JobOpening[]>(STORAGE_KEYS.JOBS, INITIAL_JOB_OPENINGS);
    return {
      success: true,
      message: 'Daftar lowongan kerja berhasil dimuat',
      data: jobs,
      meta: { total: jobs.length }
    };
  }

  async createJob(payload: Omit<JobOpening, 'id' | 'applicantCount' | 'postedDate'>): Promise<ApiResponse<JobOpening>> {
    await delay(400);
    const jobs = this.getStorage<JobOpening[]>(STORAGE_KEYS.JOBS, INITIAL_JOB_OPENINGS);
    const newId = `JOB-${String(jobs.length + 1).padStart(3, '0')}`;
    
    const newJob: JobOpening = {
      ...payload,
      id: newId,
      postedDate: new Date().toISOString().split('T')[0],
      applicantCount: 0
    };

    jobs.unshift(newJob);
    this.setStorage(STORAGE_KEYS.JOBS, jobs);

    return {
      success: true,
      message: `Lowongan baru "${newJob.title}" berhasil dipublikasikan!`,
      data: newJob
    };
  }

  async updateJobStatus(id: string, status: 'Buka' | 'Tutup' | 'Draft'): Promise<ApiResponse<JobOpening>> {
    await delay(300);
    const jobs = this.getStorage<JobOpening[]>(STORAGE_KEYS.JOBS, INITIAL_JOB_OPENINGS);
    const idx = jobs.findIndex(j => j.id === id);
    if (idx === -1) throw new Error('Lowongan kerja tidak ditemukan.');

    jobs[idx].status = status;
    this.setStorage(STORAGE_KEYS.JOBS, jobs);

    return {
      success: true,
      message: `Status lowongan "${jobs[idx].title}" diubah menjadi ${status}.`,
      data: jobs[idx]
    };
  }

  async getCandidates(jobId?: string): Promise<ApiResponse<Candidate[]>> {
    await delay(300);
    const candidates = this.getStorage<Candidate[]>(STORAGE_KEYS.CANDIDATES, INITIAL_CANDIDATES);
    const filtered = jobId ? candidates.filter(c => c.jobOpeningId === jobId) : candidates;
    return {
      success: true,
      message: 'Data pelamar kerja berhasil dimuat',
      data: filtered,
      meta: { total: filtered.length }
    };
  }

  async createCandidate(payload: Omit<Candidate, 'id' | 'appliedDate'>): Promise<ApiResponse<Candidate>> {
    await delay(400);
    const candidates = this.getStorage<Candidate[]>(STORAGE_KEYS.CANDIDATES, INITIAL_CANDIDATES);
    const newId = `CND-${Math.floor(100 + Math.random() * 900)}`;

    const newCandidate: Candidate = {
      ...payload,
      id: newId,
      appliedDate: new Date().toISOString().split('T')[0]
    };

    candidates.unshift(newCandidate);
    this.setStorage(STORAGE_KEYS.CANDIDATES, candidates);

    // Update job applicant count
    const jobs = this.getStorage<JobOpening[]>(STORAGE_KEYS.JOBS, INITIAL_JOB_OPENINGS);
    const job = jobs.find(j => j.id === payload.jobOpeningId);
    if (job) {
      job.applicantCount += 1;
      this.setStorage(STORAGE_KEYS.JOBS, jobs);
    }

    return {
      success: true,
      message: `Pelamar ${newCandidate.fullName} berhasil diregistrasikan ke pipeline rekrutmen!`,
      data: newCandidate
    };
  }

  async updateCandidateStage(id: string, stage: CandidateStage, score?: number, notes?: string): Promise<ApiResponse<Candidate>> {
    await delay(350);
    const candidates = this.getStorage<Candidate[]>(STORAGE_KEYS.CANDIDATES, INITIAL_CANDIDATES);
    const idx = candidates.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Data kandidat tidak ditemukan.');

    candidates[idx].stage = stage;
    if (score !== undefined) candidates[idx].interviewScore = score;
    if (notes !== undefined) candidates[idx].notes = notes;

    this.setStorage(STORAGE_KEYS.CANDIDATES, candidates);

    return {
      success: true,
      message: `Status kandidat ${candidates[idx].fullName} berhasil diperbarui ke tahap: ${stage}!`,
      data: candidates[idx]
    };
  }

  // Inter-module Workflow: Convert accepted candidate into active Employee!
  async convertCandidateToEmployee(candidateId: string): Promise<ApiResponse<Employee>> {
    await delay(600);
    const candidates = this.getStorage<Candidate[]>(STORAGE_KEYS.CANDIDATES, INITIAL_CANDIDATES);
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) throw new Error('Data kandidat tidak ditemukan.');

    const jobs = this.getStorage<JobOpening[]>(STORAGE_KEYS.JOBS, INITIAL_JOB_OPENINGS);
    const job = jobs.find(j => j.id === candidate.jobOpeningId);

    // Generate clean Indonesian NIK placeholder
    const randomNik = `317${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;

    const newEmployeePayload: Omit<Employee, 'id'> = {
      nik: randomNik,
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      department: job?.department || 'Teknologi Informasi',
      position: job?.title || 'Staff Spesialis',
      joinDate: new Date().toISOString().split('T')[0],
      employmentType: 'Tetap (Permanent)',
      status: 'Aktif',
      baseSalary: job?.salaryRangeMin || 8500000,
      allowanceTransport: 800000,
      allowanceMeal: 1000000,
      bankAccount: {
        bankName: 'BCA',
        accountNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        holderName: candidate.fullName
      },
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`
    };

    const res = await this.createEmployee(newEmployeePayload);
    
    // Mark candidate as Diterima
    candidate.stage = 'Diterima';
    candidate.notes = (candidate.notes ? candidate.notes + ' | ' : '') + `Telah resmi diangkat menjadi karyawan (${res.data.id}).`;
    this.setStorage(STORAGE_KEYS.CANDIDATES, candidates);

    return {
      success: true,
      message: `Selamat! Kandidat ${candidate.fullName} resmi diangkat menjadi Karyawan Tetap (${res.data.id})!`,
      data: res.data
    };
  }
}

export const api = new ApiService();
