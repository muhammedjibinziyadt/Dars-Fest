export type SectionType = "single" | "group" | "general";
export type CategoryType = "A" | "B" | "C" | "none";
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
  phone_number?: string; // Added for Festory verification
}

// ... existing types ...




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
  type: "result_published";
  title: string;
  message: string;
  programId: string;
  programName: string;
  resultId: string;
  read: boolean;
  createdAt: string;
}

export interface AdminSettings {
  username: string;
  password: string; // In a real app, this should be hashed. For this request, storing as is per user context implies simple storage or handled elsewhere, but I will store plain text as per current simple auth implementation in config.ts, or maybe I should hash it? The user asked to "change it to my mongo db", implying moving the current hardcoded behavior to DB. The current behavior is plain text comparison. I will stick to plain text for now to match existing logic, but I should probably mention hashing later.
  updatedAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  active: boolean;
  createdAt: string;
}

export interface Vote {
  pollId: string;
  optionId: string;
  voterHash: string; // Hash of IP + UserAgent or similar
  timestamp: string;
}

export interface PredictionEvent {
  id: string;
  programId: string; // Link to a Program
  programName: string;
  question: string; // e.g., "Who will win?"
  options: {
    id: string; // Could be teamId or studentId
    label: string; // Team Name or Student Name
    image?: string;
  }[];
  deadline: string;
  status: "open" | "closed" | "evaluated";
  correctOptionId?: string;
  points: number;
  createdAt: string;
}

export interface Prediction {
  id: string;
  eventId: string;
  userId: string; // User identifier (e.g., hash or session ID)
  userName: string; // Optional: if we want a leaderboard with names
  selectedOptionId: string;
  timestamp: string;
}

export interface UserScore {
  userId: string;
  userName: string;
  score: number;
  rank?: number;
}

export interface FestoryComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  createdAt: string;
  parentId?: string;
}

export interface FestoryPost {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  userTeamId: string;
  type: "text" | "image" | "audio" | "poll";
  content: string;
  mediaUrl?: string;
  likes: string[]; // Array of User IDs
  pollOptions?: {
    id: string;
    text: string;
    votes: string[]; // Array of User IDs who voted for this option
  }[];
  commentsCount: number;
  createdAt: string;
}

export interface FestoryUser {
  id: string;
  studentId?: string;
  googleId?: string;
  email?: string;
  name: string;
  teamId: string;
  phoneNumber: string;
  isBanned: boolean;
  image?: string;
  profileImageUpdateCount?: number;
}
