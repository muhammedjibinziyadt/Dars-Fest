# Participant Lookup Feature - Complete Implementation

## Overview

A comprehensive public feature that allows users to search for and view complete profiles of any festival participant. The system includes:

- **Text Search**: Search by chest number or name
- **QR Code Scanning**: Mobile-friendly QR code scanner
- **Complete Profiles**: Detailed participant information with charts and statistics
- **QR Code Generation**: Automatic QR code generation for each participant

## QR Code System

### How QR Codes Work

1. **QR Code Content**: Each QR code contains a URL in the format:
   ```
   https://yourdomain.com/participant/{chest_number}
   ```

2. **Generation**: QR codes are generated on-demand via the API endpoint:
   ```
   GET /api/participants/{chestNumber}/qr
   ```
   This returns a base64-encoded PNG image (data URL) that can be displayed or downloaded.

3. **Usage Scenarios**:
   - **Print Badges**: Generate QR codes for printing on participant badges/ID cards
   - **Digital Sharing**: Display QR codes on participant profile pages
   - **Quick Access**: Scan QR code to instantly view participant profile

4. **QR Code Generation Library**: Uses `qrcode` npm package
   - Generates PNG images (300x300px)
   - Error correction level: Medium (M)
   - Can be downloaded as PNG files

### Creating QR Codes for Participants

**Option 1: Via Participant Profile Page**
- Navigate to any participant profile: `/participant/{chestNumber}`
- QR code is automatically displayed at the bottom of the profile
- Click "Download QR Code" to save the PNG file

**Option 2: Via API**
```javascript
// Generate QR code for a participant
const response = await fetch(`/api/participants/${chestNumber}/qr`);
const { qrCode } = await response.json();
// qrCode is a data URL (base64 PNG image)
```

**Option 3: Programmatically (Server-side)**
```typescript
import { generateParticipantQR } from "@/lib/qr-utils";

const qrCodeDataUrl = await generateParticipantQR(chestNumber, baseUrl);
// Use qrCodeDataUrl in your application
```

### Printing QR Codes

1. **Individual Badges**: 
   - Visit `/participant/{chestNumber}` for each participant
   - Download their QR code
   - Print on badges/ID cards

2. **Bulk Generation** (Future Enhancement):
   - Could add an admin page to generate all QR codes at once
   - Export as ZIP file for printing

## Features

### 1. Search Interface (`/participant`)

- **Text Search**: Real-time search as you type (minimum 2 characters)
- **QR Scanner**: Click "Scan QR" button to open mobile-friendly scanner
- **Search Results**: Shows matching participants with name and chest number
- **Quick Access**: Click any result to view full profile

### 2. QR Code Scanner

- **Mobile-Friendly**: Uses device camera to scan QR codes
- **Auto-Detection**: Automatically detects and extracts chest number from scanned QR
- **Error Handling**: Graceful error messages for camera permissions or missing cameras
- **Library**: Uses `html5-qrcode` for cross-browser compatibility

### 3. Participant Profile (`/participant/{chestNumber}`)

#### Profile Sections:

1. **Header Card**
   - Participant name and photo
   - Chest number badge
   - Team name with color indicator
   - Total points earned

2. **Statistics Overview**
   - Total programs participated
   - Completed programs count
   - Total wins (1st, 2nd, 3rd places)
   - Total penalties

3. **Interactive Charts** (Recharts)
   - **Points by Section**: Bar chart showing points earned in single/group/general sections
   - **Wins Distribution**: Pie chart of 1st, 2nd, 3rd place wins
   - **Grades Distribution**: Pie chart of Grade A, B, C achievements
   - **Program Status**: Pie chart of completed/pending/registered programs
   - **Performance Over Time**: Line chart showing points progression

4. **All Programs List**
   - Complete list of all program registrations
   - Status badges (Completed, Pending, Registered)
   - Results for each program:
     - Position (1st, 2nd, 3rd)
     - Grade (A, B, C)
     - Points earned
   - Penalties (if any) with reasons

5. **QR Code Display**
   - Participant's QR code
   - Download button for printing

## API Endpoints

### Search Participants
```
GET /api/participants/search?q={query}
```
Returns array of matching students (name or chest number).

### Get Participant Profile
```
GET /participant/{chestNumber}
```
Server-side rendered page with complete profile.

### Generate QR Code
```
GET /api/participants/{chestNumber}/qr
```
Returns JSON with `qrCode` (data URL) and `chestNumber`.

## Data Aggregation

The `participant-service.ts` module aggregates data from multiple sources:

- **Student Data**: Basic info, chest number, team ID
- **Team Data**: Team name, color, leader info
- **Program Registrations**: All programs the student registered for
- **Approved Results**: Final results with positions, grades, scores
- **Pending Results**: Results awaiting approval (for status display)
- **Penalties**: Any penalties applied to the student

All data is combined into a single `ParticipantProfile` object for efficient rendering.

## Technical Implementation

### Dependencies Added
- `qrcode`: QR code generation
- `@types/qrcode`: TypeScript types
- `html5-qrcode`: QR code scanning

### Key Files
- `src/lib/participant-service.ts`: Data aggregation service
- `src/lib/qr-utils.ts`: QR code generation utilities
- `src/components/participant-search.tsx`: Search UI component
- `src/components/qr-scanner.tsx`: QR scanner component
- `src/components/participant-profile.tsx`: Profile display with charts
- `src/components/qr-code-display.tsx`: QR code display component
- `src/app/participant/page.tsx`: Search page
- `src/app/participant/[chestNumber]/page.tsx`: Profile page
- `src/app/api/participants/search/route.ts`: Search API
- `src/app/api/participants/[chestNumber]/qr/route.ts`: QR generation API

## Usage Examples

### For Festival Organizers
1. Generate QR codes for all participants
2. Print QR codes on participant badges
3. Participants can share QR codes for easy profile access

### For Public Users
1. Visit `/participant` to search for participants
2. Type name or chest number, or scan QR code
3. View complete profile with all statistics

### For Mobile Users
1. Open `/participant` on mobile device
2. Tap "Scan QR" button
3. Point camera at participant's QR code badge
4. Instantly view their profile

## Future Enhancements

- Bulk QR code generation for admin
- QR code printing templates
- Share profile links via social media
- Export participant data as PDF
- Comparison view (multiple participants side-by-side)

