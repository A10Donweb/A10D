# A10D — Ephemeral Attendance Platform

> "Mobile and Browser Infra Dependent. No accounts. Minimal friction. Attendance that exists for a moment, then disappears."

A lightweight, ephemeral attendance platform designed for universities to eliminate proxy attendance with zero friction and zero persistence.

---

## Philosophy

- **No accounts** — Teachers and students interact anonymously
- **No permanent storage** — All data lives in-memory and is purged on session end
- **Mobile-first** — Designed exclusively for smartphone usage
- **Browser-native** — Uses GPS, camera, and share APIs built into modern browsers
- **Ephemeral by design** — The session is a portal, not a record

---

## Architecture

```
a10d/
├── api/
│   ├── _store.js          # In-memory session store (shared state)
│   ├── start-session.js   # POST /api/start-session
│   ├── join-session.js    # POST /api/join-session
│   ├── get-attendance.js  # GET  /api/get-attendance?code=XXXXXX
│   ├── end-session.js     # POST /api/end-session
│   ├── remove-student.js  # POST /api/remove-student
│   └── add-student.js     # POST /api/add-student
│
├── public/
│   ├── index.html         # Single-page application
│   ├── style.css          # Mobile-first red/white/black design system
│   └── script.js          # All client logic (Teacher + Student flows)
│
├── vercel.json            # Vercel routing config
├── package.json
└── README.md
```

---

## Deploy to Vercel

### Prerequisites
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
- Node.js 18+

### Steps

```bash
# 1. Clone / unzip the project
cd a10d

# 2. Login to Vercel
vercel login

# 3. Deploy (follow prompts — all defaults are fine)
vercel

# 4. For production deployment
vercel --prod
```

Your app will be live at `https://a10d-<hash>.vercel.app` (or your custom domain).

### Local development

```bash
vercel dev
# Opens at http://localhost:3000
```

---

## How It Works

### Teacher Flow
1. Open the app → tap **Teacher Session**
2. Tap **Start Attendance Session** — a unique 6-char code appears
3. Share the code with students verbally or via chat
4. Watch attendance populate live (auto-polls every 2.5s)
5. Export CSV or share via WhatsApp/native share
6. Tap **End** → all data is immediately purged

### Student Flow
1. Open the app → tap **Student Session**
2. Enter the 6-character code from your teacher
3. Fill in Name and Roll Number
4. Allow GPS and Camera (optional but tracked)
5. A 2-minute countdown begins — submit before it expires
6. Tap **Mark Present** → success screen shown

---

## API Reference

### `POST /api/start-session`
Creates a new session.
- **Response:** `{ code: "A10D9X", createdAt: 1234567890 }`

### `POST /api/join-session`
Submits student attendance.
- **Body:** `{ code, name, rollNumber, mobile?, gps?, cameraStatus }`
- **Response:** `{ success: true, entry: {...} }`

### `GET /api/get-attendance?code=XXXXXX`
Returns current attendance list.
- **Response:** `{ code, students: [...], count }`

### `POST /api/end-session`
Purges all session data.
- **Body:** `{ code }`
- **Response:** `{ success: true, purged: true }`

### `POST /api/remove-student`
Removes a specific student entry.
- **Body:** `{ code, studentId }`

### `POST /api/add-student`
Manually adds a student.
- **Body:** `{ code, name, rollNumber, mobile? }`

---

## Session Code Format

- 6 characters
- Characters: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- Excludes ambiguous: `0`, `O`, `I`, `1`
- Auto-expires after 30 minutes as a safety fallback

---

## Privacy & Security

| Property | Status |
|---|---|
| Accounts / Login | ✗ None |
| Persistent database | ✗ None |
| Camera recording | ✗ Never |
| GPS logging after session end | ✗ Purged |
| Student identity after session end | ✗ Purged |
| Duplicate roll detection | ✓ Enforced per session |
| Session auto-expiry | ✓ 30-minute hard limit |

---

## Browser Support

| Feature | Chrome | Safari | Firefox |
|---|---|---|---|
| GPS | ✓ | ✓ | ✓ |
| Camera | ✓ | ✓ (iOS 14.3+) | ✓ |
| `navigator.share` | ✓ | ✓ | Partial |
| CSV download | ✓ | ✓ | ✓ |

---

## Design System

- **Colors:** `#E5001A` (red), `#0A0A0B` (black), `#FFFFFF` (white)
- **Display font:** Syne (700, 800)
- **Body font:** DM Sans (300, 400, 500, 600)
- **Mono font:** DM Mono (400, 500)
- **Border radius:** 16px cards, 10px inputs
- **Shadows:** Soft layered, mobile-optimized

---

## Limitations (In-Memory Store)

Since this uses in-memory storage (Vercel serverless):
- Sessions do **not** persist across serverless cold starts
- Works perfectly for normal use (sessions are short-lived by design)
- For high-reliability deployments: replace `_store.js` with Redis/Upstash

### Upgrading to Redis (optional)

```bash
npm install @upstash/redis
```

Replace `_store.js` with Upstash Redis client and set TTL = 30 minutes on each session key. All API functions stay unchanged.

---

## License

MIT — Free for academic and institutional use.
