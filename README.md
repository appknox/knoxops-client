# KnoxOps Client — Frontend

React + TypeScript frontend for the KnoxOps admin portal. Served via nginx, proxies `/api/*` to the knoxops backend.

- **Stack:** React + TypeScript + Vite + Zustand + Tailwind CSS + shadcn/ui
- **Auth:** JWT (stored in memory) + Google OIDC SSO
- **Device Detection:** WebUSB (Android) + Local Agent on port 17392 (iOS)

---

## Getting Started

### Local Development

```bash
npm install
npm run dev   # starts on http://localhost:5173 (proxies /api → localhost:3000)
```

Requires the backend (`knoxops`) running on port 3000.

### Build

```bash
npx vite build   # outputs to dist/
```

> `tsc` type checking is skipped in the build — use your editor or `npx tsc --noEmit` for type checking.

---

## Running with Docker

```bash
# From knoxops repo root (builds both backend + frontend)
docker-compose up
```

Frontend is served by nginx on port 80. `/api/*` requests are proxied to the `knoxops` backend container.

---

## Device Detection

### Android — WebUSB

Runs entirely in the browser. No backend or agent required.

- Requires Chrome or Edge (Firefox/Safari don't support WebUSB)
- USB Debugging must be enabled on the Android device
- If you see "Unable to claim interface", run `adb kill-server` first

### iOS — Local Agent

Requires the **KnoxOps Agent** running on the same machine as the browser.

```bash
# In the knoxops repo
brew install libimobiledevice
cd agent && npm install && npm start
# Agent runs on http://localhost:17392
```

The wizard detects whether the agent is running and shows instructions if offline.

---

## CI/CD

Docker images are published to GHCR on every GitHub release or via manual workflow dispatch.

| Image | Registry |
|-------|----------|
| `knoxops-client` | `ghcr.io/appknox/knoxops-client` |

To build manually from a branch:
1. Go to **Actions** → **Manual Publish docker image to ghcr** → **Run workflow**
2. Enter the branch name (e.g. `feat/knoxops`)

Image tag format: `knoxops-client-<commit-sha>`

---

## Environment Variables

Vite env vars are baked into the bundle at build time. If not set, sensible defaults are used:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Backend API base URL |
