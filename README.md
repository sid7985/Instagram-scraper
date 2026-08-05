# Instagram Analytics Dashboard Pro

Full-stack web application that uploads an Excel file of Instagram Reel/Post URLs and produces a new Excel file with **views, likes, comments, followers, username, caption, upload date, duration, location** and more.

- **Frontend:** Next.js 15 · React 19 · TypeScript · Tailwind CSS · Framer Motion
- **Backend:** FastAPI · Instaloader (authenticated with your `sessionid`) · Pandas · OpenPyXL · SQLite + Fernet encryption
- Dark premium theme (`#0D0D0D` background, `#6366F1` accent)

---

## Requirements

- Python **3.10+**
- Node.js **18.18+** (for the frontend)

---

## 1. How to get your Instagram `sessionid`

1. Open https://www.instagram.com in Chrome and log in.
2. Press **F12** → **Application** tab → **Cookies** → `https://www.instagram.com`.
3. Find the `sessionid` row and copy its value.
4. Paste it into the app when prompted (it is encrypted on disk and never displayed again).

> The `sessionid` expires when you log out, change your password, or Instagram invalidates it. When that happens the app pauses the job and asks for a new one — processing resumes from the failed row.

---

## 2. Run the backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

Optional environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SESSION_KEY` | built-in dev key | Encryption key for the stored sessionid — **set a random value in production** |
| `MAX_WORKERS` | `3` | Concurrent fetch workers |
| `REQUEST_SLEEP_MIN` / `MAX` | `2.0` / `4.0` | Seconds between requests (anti rate-limit) |

---

## 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

The frontend proxies `/api/*` to `http://localhost:8000` (set `API_ORIGIN` to change it).

---

## 4. Usage

1. Upload an `.xlsx` / `.xls` file with Instagram URLs in one column (auto-detected).
2. If no session is saved, paste your `sessionid` in the modal.
3. Click **Start Fetch** — watch the progress bar and live logs.
4. When finished, click **Download** to get `Instagram_Analytics_Result_*.xlsx`.

The output workbook keeps your original rows and appends: Username, Full Name, Followers, Following, Verified, Views, Likes, Comments, Caption, Post Date, Media Type, Duration, Location, Hashtags, Thumbnail URL, Profile URL, Post Link, Status, Error, Last Updated. A **Summary** sheet shows totals, success/failure counts and execution time.

Generate a sample input file: `python sample/make_sample.py`

---

## 5. Behavior notes

- **Errors are categorised** (Private Account, Deleted Post, Session Expired, Rate Limited, Not Found, Invalid URL, Network Error) instead of a generic "Error".
- **Retries** with exponential backoff (2s → 5s → 10s → 30s).
- **User agents rotate** per request.
- **Session expiry pauses the job**; a new sessionid resumes from the first failed row.
- Some metrics (views, followers) may be unavailable depending on the account's privacy settings and Meta's current endpoints — the app marks them as unavailable rather than failing the job.

---

## 6. Security

- The `sessionid` is encrypted (Fernet) before being stored in SQLite.
- It is never returned to the browser after saving.
- Set `SESSION_KEY` to a random value before deploying.
- Do not commit your `sessionid` to any file. If it was ever shared in plain text (e.g. pasted into a notebook), log out / change your password to invalidate it.

---

## 7. Folder structure

```
instagram-dashboard/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Settings & env vars
│   ├── requirements.txt
│   ├── api/                 # Upload / session / job endpoints
│   ├── auth/                # Encrypted sessionid storage
│   ├── scraper/             # Instaloader scraper + error taxonomy
│   ├── excel/               # Excel reader + result writer
│   ├── services/            # Background job manager
│   └── utils/               # Logging
├── frontend/
│   ├── app/                 # Next.js App Router
│   ├── components/          # UI components
│   └── lib/                 # API client + types
├── uploads/                 # Uploaded files
├── exports/                 # Generated result files
├── logs/                    # backend.log
└── sample/                  # Sample Excel generator
```
