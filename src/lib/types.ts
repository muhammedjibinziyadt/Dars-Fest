export type SectionType = "single" | "group" | "general";
export type CategoryType = "A" | "B" | "C" | "none";
export type GradeType = "A" | "B" | "C" | "none";

export interface Team {
  id: string;
  name: string;
  leader: string;
  leader_photo: string;
  color: string;
  description: string;
  contact: string;
  total_points: number;
  portal_password?: string;
}

export interface Student {
  id: string;
  name: string;
  team_id: string;
  chest_no: string;
  avatar?: string;
  total_points: number;
}

export interface Program {
  id: string;
  name: string;
  section: SectionType;
  stage: boolean;
  category: CategoryType;
  candidateLimit?: number;
}

export interface Jury {
  id: string;
  name: string;
  password: string;
  avatar?: string;
}

export interface AssignedProgram {
  program_id: string;
  jury_id: string;
  status: "pending" | "submitted" | "completed";
}

export interface ResultEntry {
  position: 1 | 2 | 3;
  student_id?: string;
  team_id?: string;
  grade?: GradeType;
  score: number;
}

export interface PenaltyEntry {
  student_id?: string;
  team_id?: string;
  points: number;
  reason?: string;
}

export interface ResultRecord {
  id: string;
  program_id: string;
  jury_id: string;
  submitted_by: string;
  submitted_at: string;
  entries: ResultEntry[];
  status: "pending" | "approved";
  notes?: string;
  penalties?: PenaltyEntry[];
}

export interface LiveScore {
  team_id: string;
  total_points: number;
}

export interface PortalTeam {
  id: string;
  teamName: string;
  password: string;
  leaderName: string;
  themeColor?: string;
}

export interface PortalStudent {
  id: string;
  name: string;
  chestNumber: string;
  teamId: string;
  teamName: string;
  score: number;
}

export interface RegistrationSchedule {
  startDateTime: string;
  endDateTime: string;
}

export interface ProgramRegistration {
  id: string;
  programId: string;
  programName: string;
  studentId: string;
  studentName: string;
  studentChest: string;
  teamId: string;
  teamName: string;
  timestamp: string;
}

export interface ReplacementRequest {
  id: string;
  programId: string;
  programName: string;
  oldStudentId: string;
  oldStudentName: string;
  oldStudentChest: string;
  newStudentId: string;
  newStudentName: string;
  newStudentChest: string;
  teamId: string;
  teamName: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Notification {
  id: string;
  type: "result_published";
  title: string;
  message: string;
  programId: string;
  programName: string;
  resultId: string;
  read: boolean;
  createdAt: string;
}

