export type SectionType = "single" | "group" | "general";
export type GradeType = "A" | "B" | "C" | "none";

export interface Team {
  id: string;
  name: string;
  leader: string;
  leader_email?: string;
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
  individual_points?: number;
  group_points?: number;
}

export interface Program {
  id: string;
  name: string;
  section: SectionType;
  stage: boolean;
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
  notes?: string;
  notes_updated_at?: string;
}

export interface ResultEntry {
  position: number;
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
  leaderEmail?: string;
  themeColor?: string;
}

export interface PortalStudent {
  id: string;
  name: string;
  chestNumber: string;
  teamId: string;
  teamName: string;
  score: number;
  individualScore?: number;
  groupScore?: number;
  avatar?: string;
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
  type: "result_published" | "program_created" | "schedule_updated" | "member_added" | "announcement" | string;
  title: string;
  message: string;
  programId?: string;
  programName?: string;
  resultId?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

