import { getAdminDb } from "./firebase-admin";
import type {
  AssignedProgram,
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
} as const;

export interface QueryPromise<T> extends Promise<T> {
  lean<R = T>(): QueryPromise<R>;
  sort(sortSpec: Record<string, 1 | -1 | "asc" | "desc">): QueryPromise<T>;
  limit(count: number): QueryPromise<T>;
  exec(): Promise<T>;
}

export interface QuerySinglePromise<T> extends Promise<T> {
  lean<R = T>(): QuerySinglePromise<R>;
  exec(): Promise<T>;
}

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
}

const globalForCache = globalThis as unknown as {
  __firestoreCache?: Record<string, CacheEntry<any>>;
};

if (!globalForCache.__firestoreCache) {
  globalForCache.__firestoreCache = {};
}

const cache = globalForCache.__firestoreCache;
const CACHE_TTL_MS = 60_000; // 60 seconds in-memory cache

const inFlightRequests = new Map<string, Promise<any[]>>();

export function invalidateCache(collectionName?: string) {
  if (collectionName) {
    delete cache[collectionName];
    inFlightRequests.delete(collectionName);
  } else {
    for (const key of Object.keys(cache)) {
      delete cache[key];
    }
    inFlightRequests.clear();
  }

  // Clear global top-scorers cache if relevant collections changed
  if (
    !collectionName ||
    ["students", "teams", "programs", "results_approved", "program_registrations", "live_scores"].includes(collectionName)
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

export class FirestoreModel<T extends Record<string, any>> {
  readonly collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  get col() {
    return getAdminDb().collection(this.collectionName);
  }

  async countDocuments(filter?: Partial<T> | Record<string, any>): Promise<number> {
    if (!filter || Object.keys(filter).length === 0) {
      const cached = cache[this.collectionName];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data.length;
      }
      const snap = await this.col.count().get();
      return snap.data().count;
    }
    const docs = await this.find(filter);
    return docs.length;
  }

  find<R = T[]>(filter?: Partial<T> | Record<string, any>, _projection?: any): QueryPromise<R> {
    let sortField: string | null = null;
    let sortDir: "asc" | "desc" = "asc";
    let limitCount: number | null = null;

    const execute = async (): Promise<T[]> => {
      const now = Date.now();
      const cached = cache[this.collectionName];
      let allDocs: T[];

      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        allDocs = cached.data;
      } else {
        let pending = inFlightRequests.get(this.collectionName);
        if (!pending) {
          pending = (async () => {
            const snapshot = await this.col.get();
            const fresh: T[] = [];
            snapshot.forEach((doc) => {
              fresh.push(doc.data() as T);
            });
            cache[this.collectionName] = {
              data: fresh,
              timestamp: Date.now(),
            };
            return fresh;
          })().finally(() => {
            inFlightRequests.delete(this.collectionName);
          });
          inFlightRequests.set(this.collectionName, pending);
        }
        allDocs = (await pending) as T[];
      }

      let results = allDocs;



      if (filter && Object.keys(filter).length > 0) {
        results = results.filter((item) => this.matchesFilter(item, filter));
      }

      if (sortField) {
        results.sort((a: any, b: any) => {
          const valA = a[sortField!];
          const valB = b[sortField!];
          if (valA === valB) return 0;
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;
          const cmp = valA < valB ? -1 : 1;
          return sortDir === "desc" ? -cmp : cmp;
        });
      }

      if (limitCount !== null) {
        results = results.slice(0, limitCount);
      }

      return results;
    };

    const queryObj: any = {
      then: (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) => {
        return execute().then(onfulfilled, onrejected);
      },
      catch: (onrejected?: (reason: any) => any) => {
        return execute().catch(onrejected);
      },
      lean: <CustomR = R>() => queryObj,
      sort: (sortSpec: Record<string, 1 | -1 | "asc" | "desc">) => {
        const key = Object.keys(sortSpec)[0];
        if (key) {
          sortField = key;
          const val = sortSpec[key];
          sortDir = val === -1 || val === "desc" ? "desc" : "asc";
        }
        return queryObj;
      },
      limit: (count: number) => {
        limitCount = count;
        return queryObj;
      },
      exec: () => execute(),
    };

    return queryObj as QueryPromise<R>;
  }

  findOne<R = T | null>(filter?: Partial<T> | Record<string, any>, _projection?: any): QuerySinglePromise<R> {
    const execute = async (): Promise<T | null> => {
      const results = await this.find(filter);
      return results[0] ?? null;
    };

    const queryObj: any = {
      then: (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) => {
        return execute().then(onfulfilled, onrejected);
      },
      catch: (onrejected?: (reason: any) => any) => {
        return execute().catch(onrejected);
      },
      lean: <CustomR = R>() => queryObj,
      exec: () => execute(),
    };

    return queryObj as QuerySinglePromise<R>;
  }

  async findById(id: string): Promise<T | null> {
    const cached = cache[this.collectionName];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      const found = cached.data.find(
        (item: any) => String(item.id) === String(id) || String(item._id) === String(id)
      );
      if (found) return found as T;
    }
    const doc = await this.col.doc(String(id)).get();
    if (doc.exists) {
      return doc.data() as T;
    }
    return this.findOne({ id } as any);
  }

  async create(data: T): Promise<T> {
    invalidateCache(this.collectionName);
    const docId = data.id || data.team_id || data.key || this.col.doc().id;
    const docData = { ...data, id: data.id || docId };
    await this.col.doc(String(docId)).set(docData);
    return docData as T;
  }

  async insertMany(items: T[]): Promise<T[]> {
    if (!items || items.length === 0) return [];
    invalidateCache(this.collectionName);
    const db = getAdminDb();
    const batches: Promise<any>[] = [];
    let currentBatch = db.batch();
    let count = 0;

    for (const item of items) {
      const docId = item.id || item.team_id || item.key || this.col.doc().id;
      const docRef = this.col.doc(String(docId));
      currentBatch.set(docRef, { ...item, id: item.id || docId });
      count++;
      if (count === 400) {
        batches.push(currentBatch.commit());
        currentBatch = db.batch();
        count = 0;
      }
    }
    if (count > 0) {
      batches.push(currentBatch.commit());
    }
    await Promise.all(batches);
    return items;
  }

  async updateOne(
    filter: Partial<T> | Record<string, any>,
    update: any,
    options?: { upsert?: boolean }
  ): Promise<{ modifiedCount: number }> {
    invalidateCache(this.collectionName);
    const existing = await this.findOne(filter);
    const updateData = update || {};
    const setFields = updateData.$set || (updateData.$inc || updateData.$setOnInsert ? {} : updateData);

    if (existing) {
      const docId = existing.id || existing.team_id || existing.key;
      if (docId) {
        const merged: any = { ...setFields };

        // Handle MongoDB $inc operator in Firestore
        if (updateData.$inc) {
          for (const [incKey, incVal] of Object.entries(updateData.$inc)) {
            const current = (existing as any)?.[incKey] ?? 0;
            merged[incKey] = Number(current) + Number(incVal);
          }
        }

        await this.col.doc(String(docId)).set(merged, { merge: true });
        return { modifiedCount: 1 };
      }
    } else if (options?.upsert) {
      const newDoc: any = { ...filter, ...setFields };
      if (updateData.$setOnInsert) {
        Object.assign(newDoc, updateData.$setOnInsert);
      }
      if (updateData.$inc) {
        for (const [incKey, incVal] of Object.entries(updateData.$inc)) {
          newDoc[incKey] = Number(incVal);
        }
      }
      await this.create(newDoc as T);
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  }

  async findOneAndUpdate(
    filter: Partial<T> | Record<string, any>,
    update: any,
    options?: { upsert?: boolean; new?: boolean }
  ): Promise<T | null> {
    invalidateCache(this.collectionName);
    await this.updateOne(filter, update, options);
    return this.findOne(filter);
  }

  async updateMany(
    filter: Partial<T> | Record<string, any>,
    update: any
  ): Promise<{ modifiedCount: number }> {
    invalidateCache(this.collectionName);
    const items = await this.find(filter);
    if (items.length === 0) return { modifiedCount: 0 };
    const db = getAdminDb();
    const batch = db.batch();
    const updateData = update || {};
    const setFields = updateData.$set || updateData;

    for (const item of items) {
      const docId = item.id || item.team_id || item.key;
      if (docId) {
        batch.set(this.col.doc(String(docId)), setFields, { merge: true });
      }
    }
    await batch.commit();
    return { modifiedCount: items.length };
  }

  async deleteOne(filter: Partial<T> | Record<string, any>): Promise<{ deletedCount: number }> {
    invalidateCache(this.collectionName);
    const existing = await this.findOne(filter);
    if (existing) {
      const docId = existing.id || existing.team_id || existing.key;
      if (docId) {
        await this.col.doc(String(docId)).delete();
        return { deletedCount: 1 };
      }
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter: Partial<T> | Record<string, any>): Promise<{ deletedCount: number }> {
    invalidateCache(this.collectionName);
    const items = await this.find(filter);
    if (items.length === 0) return { deletedCount: 0 };
    const db = getAdminDb();
    const batch = db.batch();
    for (const item of items) {
      const docId = item.id || item.team_id || item.key;
      if (docId) {
        batch.delete(this.col.doc(String(docId)));
      }
    }
    await batch.commit();
    return { deletedCount: items.length };
  }

  private matchesFilter(item: any, filter: Record<string, any>): boolean {
    for (const [key, val] of Object.entries(filter)) {
      if (key === "$or" && Array.isArray(val)) {
        const matchesAny = val.some((sub) => this.matchesFilter(item, sub));
        if (!matchesAny) return false;
        continue;
      }
      if (key === "$and" && Array.isArray(val)) {
        const matchesAll = val.every((sub) => this.matchesFilter(item, sub));
        if (!matchesAll) return false;
        continue;
      }
      const itemVal = item[key];
      if (val && typeof val === "object" && !Array.isArray(val) && val !== null) {
        if ("$regex" in val) {
          const pattern = new RegExp(val.$regex, val.$options || "");
          if (!pattern.test(String(itemVal ?? ""))) return false;
          continue;
        }
        if ("$in" in val) {
          if (!Array.isArray(val.$in) || !val.$in.includes(itemVal)) return false;
          continue;
        }
        if ("$nin" in val) {
          if (Array.isArray(val.$nin) && val.$nin.includes(itemVal)) return false;
          continue;
        }
        if ("$ne" in val) {
          if (itemVal === val.$ne) return false;
          continue;
        }
        if ("$exists" in val) {
          const exists = itemVal !== undefined && itemVal !== null;
          if (Boolean(val.$exists) !== exists) return false;
          continue;
        }
        if ("$gt" in val) {
          if (!(itemVal > val.$gt)) return false;
          continue;
        }
        if ("$gte" in val) {
          if (!(itemVal >= val.$gte)) return false;
          continue;
        }
        if ("$lt" in val) {
          if (!(itemVal < val.$lt)) return false;
          continue;
        }
        if ("$lte" in val) {
          if (!(itemVal <= val.$lte)) return false;
          continue;
        }
      }
      if (itemVal !== val) return false;
    }
    return true;
  }
}

export const TeamModel = new FirestoreModel<Team>(COLLECTIONS.TEAMS);
export const StudentModel = new FirestoreModel<Student>(COLLECTIONS.STUDENTS);
export const ProgramModel = new FirestoreModel<Program>(COLLECTIONS.PROGRAMS);
export const JuryModel = new FirestoreModel<Jury>(COLLECTIONS.JURIES);
export const AssignedProgramModel = new FirestoreModel<AssignedProgram>(COLLECTIONS.ASSIGNED_PROGRAMS);
export const PendingResultModel = new FirestoreModel<ResultRecord>(COLLECTIONS.RESULTS_PENDING);
export const ApprovedResultModel = new FirestoreModel<ResultRecord>(COLLECTIONS.RESULTS_APPROVED);
export const LiveScoreModel = new FirestoreModel<LiveScore>(COLLECTIONS.LIVE_SCORES);
export const ProgramRegistrationModel = new FirestoreModel<ProgramRegistration>(COLLECTIONS.PROGRAM_REGISTRATIONS);
export const RegistrationScheduleModel = new FirestoreModel<RegistrationSchedule & { key: string }>(
  COLLECTIONS.REGISTRATION_SCHEDULES
);
export const ReplacementRequestModel = new FirestoreModel<ReplacementRequest>(COLLECTIONS.REPLACEMENT_REQUESTS);
export const NotificationModel = new FirestoreModel<Notification>(COLLECTIONS.NOTIFICATIONS);
