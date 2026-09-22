## Nusa Arts Fest Management

Full-stack Next.js 14 application for managing college arts festival teams, students, programs, assignments, and scoring. The public site shows live standings, while secure admin & jury portals provide CRUD workflows and result pipelines.

### Tech Stack

- Next.js 14 App Router + Server Actions
- TypeScript + Tailwind + shadcn-ui
- MongoDB (local) via Mongoose, seed data provided automatically

### Local Setup

1. **Install dependencies**

```bash
npm install
```

2. **Run MongoDB locally**

- Start a local MongoDB instance (default connection: `mongodb://127.0.0.1:27017/fest_app`)
- You can inspect/modify collections with MongoDB Compass

3. **Configure environment (optional)**

Create `.env.local` if you need a custom connection:

```
MONGODB_URI=mongodb://127.0.0.1:27017/fest_app
MONGODB_DB=fest_app
```

4. **Start the dev server**

```bash
npm run dev
```

Visit `http://localhost:3000`.

### Default Credentials

- **Admin:** `admin / admin123`
- **Sample juries:** see Mongo collection `juries` (e.g., `jury-anika / anika@jury`)
- **Sample team portals:** e.g. `Team Aurora / aurora@123` (see `teams` collection for others)

### Team Portal Data Model

The new team-portal workflow uses the existing Mongo database (no JSON files). Key collections:

- `teams` (TeamModel) now stores `portal_password` for login plus the existing leader/color metadata.
- `students` (StudentModel) backs team-managed rosters (chest numbers enforced globally).
- `program_registrations` (ProgramRegistrationModel) tracks `{ programId, studentId, studentChest, teamId, teamName, timestamp }`.
- `registration_schedules` holds the single `{ startDateTime, endDateTime }` window that gates registration.
- `programs` (ProgramModel) now includes `candidateLimit` so both admin and team flows share limits.

Server actions in `src/lib/team-data.ts` wrap these collections for create/update/delete + validation.

### New Routes

| Route | Description |
| --- | --- |
| `/team/login` | Team credential screen (name + password from `teams.json`). |
| `/team/dashboard` | Team stats (member count, registrations) + quick links. |
| `/team/register-students` | CRUD for team-scoped students (duplicate chest numbers prevented globally). |
| `/team/program-register` | Candidate registration UI with schedule gating + candidate-limit enforcement. |
| `/admin/team-portal-control` | Admin console for team CRUD, password reset, schedule editing, and per-team summaries. |

Result entry forms in both admin & jury portals now pull candidates strictly from the approved registration list, so juries can only score team-approved participants.

### Acceptance Checklist

- [ ] A team can register, login, and see only their dashboard.
- [ ] Team leaders can add/edit/delete only their students; duplicate chest numbers are blocked.
- [ ] Team leaders can register students to programs only inside the schedule window.
- [ ] Candidate limit is enforced per program for each team.
- [ ] Admin can create/edit teams and set the registration schedule.
- [ ] Result entry shows only program-registered students.
- [ ] Program cards in admin show `Registered: X / candidateLimit`.
