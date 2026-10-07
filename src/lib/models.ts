import mongoose, { Schema, type Model } from "mongoose";
import { randomUUID } from "node:crypto";
import { connectDB } from "./db";
import type {
  AssignedProgram,
  AttendanceRecord,
  Jury,
  LiveScore,
  Notification,
  Program,
  ProgramRegistration,
  RegistrationSchedule,
  ReplacementRequest,
  ResultRecord,
  Student,
  Team,
} from "./types";

export const COLLECTIONS = {
  TEAMS: "teams",
  STUDENTS: "students",
  PROGRAMS: "programs",
  JURIES: "juries",
  ASSIGNED_PROGRAMS: "assigned_programs",
  RESULTS_PENDING: "results_pending",
  RESULTS_APPROVED: "results_approved",
  LIVE_SCORES: "live_scores",
  PROGRAM_REGISTRATIONS: "program_registrations",
  REGISTRATION_SCHEDULES: "registration_schedules",
  REPLACEMENT_REQUESTS: "replacement_requests",
  NOTIFICATIONS: "notifications",
  ATTENDANCE: "attendance",
  SYSTEM_META: "system_meta",
} as const;

export function invalidateCache(collectionName?: string) {
  if (
    !collectionName ||
    ["students", "teams", "programs", "results_approved", "program_registrations", "live_scores"].includes(
      collectionName
    )
  ) {
    const g = globalThis as any;
    if (g.__topScorersCache) {
      delete g.__topScorersCache;
    }
  }
}

export function invalidateAllCaches() {
  invalidateCache();
}

/**
 * Converts any Mongoose / BSON document into a 100% plain JSON-serializable object.
 * Replaces any BSON ObjectId (which contains internal Buffer and toJSON methods that crash Next.js RSC)
 * with a clean primitive string.
 */
export function toPlainObject<T = any>(val: any): T {
  if (val === null || val === undefined) {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(toPlainObject) as unknown as T;
  }
  if (typeof val === "object") {
    // If it's a BSON ObjectId or has toHexString / buffer
    if (typeof (val as any).toHexString === "function" || (val as any)._bsontype === "ObjectId") {
      return String(val) as unknown as T;
    }
    if (Buffer.isBuffer(val)) {
      return val.toString() as unknown as T;
    }
    const raw = (val as any).toObject ? (val as any).toObject({ getters: false, virtuals: false }) : val;
    const clean: any = {};
    for (const [k, v] of Object.entries(raw)) {
      if (k === "_id") {
        clean._id = String(v);
      } else if (v && typeof v === "object") {
        clean[k] = toPlainObject(v);
      } else {
        clean[k] = v;
      }
    }
    if (!clean.id && clean._id) {
      clean.id = clean._id;
    }
    return clean as T;
  }
  return val;
}

// Ensure database connection before any model operation
async function ensureDb() {
  await connectDB();
}

// Helper to define or get a Mongoose model safely in Next.js
function getOrCreateModel(name: string, schema: Schema, collectionName: string): any {
  if (mongoose.models[name]) {
    return mongoose.models[name];
  }
  return mongoose.model(name, schema, collectionName);
}

export interface MongoFindQuery<T> extends PromiseLike<T[]> {
  sort(arg: any): MongoFindQuery<T>;
  limit(n: number): MongoFindQuery<T>;
  skip(n: number): MongoFindQuery<T>;
  select(fields: any): MongoFindQuery<T>;
  lean<R = T[]>(): MongoFindQuery<R extends (infer U)[] ? U : R>;
  exec(): Promise<T[]>;
  then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2>;
}

export interface MongoFindOneQuery<T> extends PromiseLike<T | null> {
  sort(arg: any): MongoFindOneQuery<T>;
  select(fields: any): MongoFindOneQuery<T>;
  lean<R = T>(): MongoFindOneQuery<R>;
  exec(): Promise<T | null>;
  then<TResult1 = T | null, TResult2 = never>(
    onfulfilled?: ((value: T | null) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2>;
}

// Wrapper around Mongoose Model to ensure ID handling, plain objects, and connection
class MongoModelWrapper<T extends Record<string, any>> {
  private model: any;
  readonly collectionName: string;

  constructor(model: any, collectionName: string) {
    this.model = model;
    this.collectionName = collectionName;
  }

  get mongooseModel(): any {
    return this.model;
  }

  async countDocuments(filter?: any): Promise<number> {
    await ensureDb();
    return this.model.countDocuments(filter || {});
  }

  find(filter?: any, projection?: any): MongoFindQuery<T> {
    ensureDb().catch(() => {});
    const query = this.model.find(filter || {}, projection).lean();
    const originalThen = query.then.bind(query);
    query.then = function (onfulfilled?: any, onrejected?: any) {
      return originalThen((docs: any) => {
        const cleaned = toPlainObject(docs);
        return onfulfilled ? onfulfilled(cleaned) : cleaned;
      }, onrejected);
    };
    return query as unknown as MongoFindQuery<T>;
  }

  findOne(filter?: any, projection?: any): MongoFindOneQuery<T> {
    ensureDb().catch(() => {});
    const query = this.model.findOne(filter || {}, projection).lean();
    const originalThen = query.then.bind(query);
    query.then = function (onfulfilled?: any, onrejected?: any) {
      return originalThen((doc: any) => {
        const cleaned = toPlainObject(doc);
        return onfulfilled ? onfulfilled(cleaned) : cleaned;
      }, onrejected);
    };
    return query as unknown as MongoFindOneQuery<T>;
  }

  async findById(id: string): Promise<T | null> {
    await ensureDb();
    let doc: any;
    if (mongoose.Types.ObjectId.isValid(id)) {
      doc = await this.model.findOne({ $or: [{ id: String(id) }, { _id: id }] }).lean();
    } else {
      doc = await this.model.findOne({ id: String(id) }).lean();
    }
    return toPlainObject(doc);
  }

  async create(data: Partial<T>): Promise<T> {
    await ensureDb();
    const docId = (data as any).id || (data as any).key || (data as any).team_id || randomUUID();
    const toCreate = { ...data, id: (data as any).id || docId };
    const created = await this.model.create(toCreate);
    invalidateCache(this.collectionName);
    return toPlainObject(created);
  }

  async insertMany(items: Partial<T>[]): Promise<T[]> {
    await ensureDb();
    if (!items || items.length === 0) return [];
    const withIds = items.map((item) => ({
      ...item,
      id: (item as any).id || (item as any).key || (item as any).team_id || randomUUID(),
    }));
    const inserted = await this.model.insertMany(withIds);
    invalidateCache(this.collectionName);
    return toPlainObject(inserted);
  }

  async updateOne(filter: any, update: any, options?: any): Promise<{ modifiedCount: number }> {
    await ensureDb();
    const res = await this.model.updateOne(filter, update, options);
    invalidateCache(this.collectionName);
    return { modifiedCount: res.modifiedCount || (res.upsertedCount ? 1 : 0) };
  }

  async findOneAndUpdate(filter: any, update: any, options?: any): Promise<T | null> {
    await ensureDb();
    const res = await this.model.findOneAndUpdate(filter, update, { new: true, ...options }).lean();
    invalidateCache(this.collectionName);
    return toPlainObject(res);
  }

  async updateMany(filter: any, update: any): Promise<{ modifiedCount: number }> {
    await ensureDb();
    const res = await this.model.updateMany(filter, update);
    invalidateCache(this.collectionName);
    return { modifiedCount: res.modifiedCount };
  }

  async deleteOne(filter: any): Promise<{ deletedCount: number }> {
    await ensureDb();
    const res = await this.model.deleteOne(filter);
    invalidateCache(this.collectionName);
    return { deletedCount: res.deletedCount || 0 };
  }

  async deleteMany(filter: any): Promise<{ deletedCount: number }> {
    await ensureDb();
    const res = await this.model.deleteMany(filter);
    invalidateCache(this.collectionName);
    return { deletedCount: res.deletedCount || 0 };
  }
}

// 1. Teams
const teamSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    leader: { type: String, default: "" },
    leader_email: { type: String, default: "" },
    leader_photo: { type: String, default: "" },
    color: { type: String, default: "#8B4513" },
    description: { type: String, default: "" },
    contact: { type: String, default: "" },
    total_points: { type: Number, default: 0 },
    portal_password: { type: String, default: "" },
  },
  { strict: false, versionKey: false }
);

// 2. Students
const studentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    team_id: { type: String, required: true, index: true },
    chest_no: { type: String, required: true, unique: true, index: true },
    avatar: { type: String, default: "" },
    total_points: { type: Number, default: 0 },
    individual_points: { type: Number, default: 0 },
    group_points: { type: Number, default: 0 },
  },
  { strict: false, versionKey: false }
);

// 3. Programs
const programSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    section: { type: String, enum: ["single", "group", "general"], default: "single" },
    stage: { type: Boolean, default: false },
    candidateLimit: { type: Number, default: 10 },
    scheduledDate: { type: String },
    scheduledTime: { type: String },
    scheduleStatus: { type: String, enum: ["upcoming", "live", "ended"], default: "upcoming" },
  },
  { strict: false, versionKey: false }
);

// 4. Juries
const jurySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
  },
  { strict: false, versionKey: false }
);

// 5. Assigned Programs
const assignedProgramSchema = new Schema(
  {
    program_id: { type: String, required: true, index: true },
    jury_id: { type: String, required: true, index: true },
    status: { type: String, enum: ["pending", "submitted", "completed"], default: "pending" },
    notes: { type: String, default: "" },
    notes_updated_at: { type: String, default: "" },
  },
  { strict: false, versionKey: false }
);
assignedProgramSchema.index({ program_id: 1, jury_id: 1 }, { unique: true });

// 6. Results (Pending & Approved)
const resultRecordSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    program_id: { type: String, required: true, index: true },
    jury_id: { type: String, required: true },
    submitted_by: { type: String, default: "" },
    submitted_at: { type: String, default: () => new Date().toISOString() },
    entries: { type: [Schema.Types.Mixed], default: [] },
    status: { type: String, enum: ["pending", "approved"], default: "pending" },
    notes: { type: String, default: "" },
    penalties: { type: [Schema.Types.Mixed], default: [] },
  },
  { strict: false, versionKey: false }
);

// 7. Live Scores
const liveScoreSchema = new Schema(
  {
    id: { type: String, index: true },
    team_id: { type: String, required: true, unique: true, index: true },
    total_points: { type: Number, default: 0 },
  },
  { strict: false, versionKey: false }
);

// 8. Program Registrations
const programRegistrationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    programId: { type: String, required: true, index: true },
    programName: { type: String, default: "" },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, default: "" },
    studentChest: { type: String, default: "" },
    teamId: { type: String, required: true, index: true },
    teamName: { type: String, default: "" },
    timestamp: { type: String, default: () => new Date().toISOString() },
  },
  { strict: false, versionKey: false }
);

// 9. Registration Schedule
const registrationScheduleSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default", index: true },
    startDateTime: { type: String, default: "" },
    endDateTime: { type: String, default: "" },
  },
  { strict: false, versionKey: false }
);

// 10. Replacement Requests
const replacementRequestSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    programId: { type: String, required: true, index: true },
    programName: { type: String, default: "" },
    oldStudentId: { type: String, default: "" },
    oldStudentName: { type: String, default: "" },
    oldStudentChest: { type: String, default: "" },
    newStudentId: { type: String, default: "" },
    newStudentName: { type: String, default: "" },
    newStudentChest: { type: String, default: "" },
    teamId: { type: String, default: "" },
    teamName: { type: String, default: "" },
    reason: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    submittedAt: { type: String, default: () => new Date().toISOString() },
    reviewedAt: { type: String },
    reviewedBy: { type: String },
  },
  { strict: false, versionKey: false }
);

// 11. Notifications
const notificationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, default: "announcement" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    programId: { type: String },
    programName: { type: String },
    resultId: { type: String },
    link: { type: String },
    read: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { strict: false, versionKey: false }
);

// 12. Attendance
const attendanceSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    programId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    studentChest: { type: String, default: "" },
    studentName: { type: String, default: "" },
    teamId: { type: String, default: "" },
    teamName: { type: String, default: "" },
    status: { type: String, enum: ["present", "absent"], default: "present" },
    markedAt: { type: String, default: () => new Date().toISOString() },
    markedBy: { type: String },
  },
  { strict: false, versionKey: false }
);

// 13. System Meta (for real-time pulse and event broadcast)
const systemMetaSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    channel: { type: String },
    event: { type: String },
    timestamp: { type: Number, default: () => Date.now() },
    data: { type: Schema.Types.Mixed },
  },
  { strict: false, versionKey: false }
);

// Export instances wrapped with MongoModelWrapper
export const TeamModel = new MongoModelWrapper<Team>(
  getOrCreateModel("Team", teamSchema, COLLECTIONS.TEAMS),
  COLLECTIONS.TEAMS
);

export const StudentModel = new MongoModelWrapper<Student>(
  getOrCreateModel("Student", studentSchema, COLLECTIONS.STUDENTS),
  COLLECTIONS.STUDENTS
);

export const ProgramModel = new MongoModelWrapper<Program>(
  getOrCreateModel("Program", programSchema, COLLECTIONS.PROGRAMS),
  COLLECTIONS.PROGRAMS
);

export const JuryModel = new MongoModelWrapper<Jury>(
  getOrCreateModel("Jury", jurySchema, COLLECTIONS.JURIES),
  COLLECTIONS.JURIES
);

export const AssignedProgramModel = new MongoModelWrapper<AssignedProgram>(
  getOrCreateModel("AssignedProgram", assignedProgramSchema, COLLECTIONS.ASSIGNED_PROGRAMS),
  COLLECTIONS.ASSIGNED_PROGRAMS
);

export const PendingResultModel = new MongoModelWrapper<ResultRecord>(
  getOrCreateModel("PendingResult", resultRecordSchema, COLLECTIONS.RESULTS_PENDING),
  COLLECTIONS.RESULTS_PENDING
);

export const ApprovedResultModel = new MongoModelWrapper<ResultRecord>(
  getOrCreateModel("ApprovedResult", resultRecordSchema, COLLECTIONS.RESULTS_APPROVED),
  COLLECTIONS.RESULTS_APPROVED
);

export const LiveScoreModel = new MongoModelWrapper<LiveScore>(
  getOrCreateModel("LiveScore", liveScoreSchema, COLLECTIONS.LIVE_SCORES),
  COLLECTIONS.LIVE_SCORES
);

export const ProgramRegistrationModel = new MongoModelWrapper<ProgramRegistration>(
  getOrCreateModel("ProgramRegistration", programRegistrationSchema, COLLECTIONS.PROGRAM_REGISTRATIONS),
  COLLECTIONS.PROGRAM_REGISTRATIONS
);

export const RegistrationScheduleModel = new MongoModelWrapper<RegistrationSchedule & { key: string }>(
  getOrCreateModel(
    "RegistrationSchedule",
    registrationScheduleSchema,
    COLLECTIONS.REGISTRATION_SCHEDULES
  ),
  COLLECTIONS.REGISTRATION_SCHEDULES
);

export const ReplacementRequestModel = new MongoModelWrapper<ReplacementRequest>(
  getOrCreateModel("ReplacementRequest", replacementRequestSchema, COLLECTIONS.REPLACEMENT_REQUESTS),
  COLLECTIONS.REPLACEMENT_REQUESTS
);

export const NotificationModel = new MongoModelWrapper<Notification>(
  getOrCreateModel("Notification", notificationSchema, COLLECTIONS.NOTIFICATIONS),
  COLLECTIONS.NOTIFICATIONS
);

export const AttendanceModel = new MongoModelWrapper<AttendanceRecord>(
  getOrCreateModel("AttendanceRecord", attendanceSchema, COLLECTIONS.ATTENDANCE),
  COLLECTIONS.ATTENDANCE
);

export const SystemMetaModel = new MongoModelWrapper<any>(
  getOrCreateModel("SystemMeta", systemMetaSchema, COLLECTIONS.SYSTEM_META),
  COLLECTIONS.SYSTEM_META
);
