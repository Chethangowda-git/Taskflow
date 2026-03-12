# TaskFlow

> A real-time collaborative task board built to demonstrate WebSocket engineering, optimistic UI patterns, and full-stack TypeScript architecture.

![TaskFlow Board](https://img.shields.io/badge/status-live-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![React](https://img.shields.io/badge/React-18-61dafb)

**Live Demo:** [coming soon]

---

## What Is TaskFlow?

TaskFlow is a Trello-inspired Kanban board where multiple users can collaborate in real time. When one user drags a card to a different column, every other connected user sees it move instantly — no page refresh, no polling.

The project is scoped as a portfolio piece, prioritising technical depth over feature breadth. The real-time collaboration engine, backed by a clean full-stack architecture, is the centrepiece.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Client State | Zustand |
| Server State | TanStack React Query |
| Real-Time | Socket.io (client + server) |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB Atlas |
| Cache / Pub-Sub | Upstash Redis |
| Auth | JWT (access token in memory + httpOnly refresh cookie) |
| Containers | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Features

- **Authentication** — Register, login, logout with JWT refresh token rotation and theft detection
- **Boards** — Create boards, invite members by email, manage roles (admin / member)
- **Columns** — Create, rename, delete, and reorder columns via drag and drop
- **Cards** — Create cards inline, edit title / description / due date / assignee / label, mark complete, add comments, delete
- **Real-Time Collaboration** — All changes broadcast instantly to every connected user via Socket.io
- **Optimistic UI** — Actions reflect immediately for the acting user; rolled back on server error
- **Presence Bar** — Shows avatars of users currently viewing the board
- **Typing Indicator** — Shows "X is editing" badge when a user has a card detail open
- **Search & Filter** — Client-side search by title, filter by label colour, debounced 200ms

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  React Client                    │
│  Zustand Store ←→ Socket.io Client               │
│  React Query   ←→ REST API Calls                 │
└────────────┬──────────────────┬─────────────────┘
             │ HTTP (REST)      │ WebSocket
             ▼                  ▼
┌────────────────────────────────────────────────┐
│              Express Server (Node.js)           │
│  REST Routes  │  Socket.io Server               │
│  Controllers  │  Event Handlers                 │
│  Middleware   │  Room Manager                   │
└──────┬────────────────────────┬────────────────┘
       │                        │
       ▼                        ▼
┌─────────────┐        ┌────────────────┐
│  MongoDB    │        │  Upstash Redis │
│  Atlas      │        │  (Pub/Sub)     │
└─────────────┘        └────────────────┘
```

---

## Key Engineering Decisions

### Optimistic UI + Rollback
When a user performs an action (create card, move card, etc.), the Zustand store updates immediately. The server processes the action and broadcasts a socket event to all connected users including the acting user — which either confirms or overwrites the optimistic state. If the server returns an error, `rollback()` restores the pre-action snapshot and a toast is shown. This gives zero perceived latency for the acting user.

### Redis Pub/Sub for Socket.io Scaling
A standard Socket.io server can only broadcast to clients connected to the same process. With the `@socket.io/redis-adapter`, any server instance publishes events to a Redis channel that all other instances subscribe to — so a user on Instance A sees updates from a user on Instance B. Upstash Redis in production; Redis container in local Docker Compose.

### JWT Token Strategy
Access tokens live in memory (lost on tab close — intentionally). Refresh tokens are stored in httpOnly cookies (invisible to JavaScript). Every `/auth/refresh` call issues a new refresh token and invalidates the old one. If the same refresh token is presented twice, it indicates theft — all sessions for that user are immediately invalidated.

### @dnd-kit Collision Strategy
Cards within a column use `closestCenter` collision detection, which is accurate for tight vertical lists. For cross-column drops, `pointerWithin` is used — this requires the pointer to actually be inside the column boundary before triggering a drop. Without this distinction, `closestCenter` can fire phantom drops onto an adjacent column when the pointer is between two columns.

---

## Local Development

### Prerequisites
- Node.js 20+
- Docker Desktop

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow

# 2. Start MongoDB + Redis
docker-compose up -d

# 3. Install dependencies
npm install

# 4. Configure environment variables
cp server/.env.example server/.env
# Edit server/.env and fill in the values below

# 5. Start both client and server
npm run dev
```

**Client:** http://localhost:5173  
**Server:** http://localhost:4000  
**Health check:** http://localhost:4000/api/health

### Environment Variables

`server/.env`:

```
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
MONGO_URI=mongodb://taskflow:taskflow_dev@localhost:27017/taskflow?authSource=admin
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## Project Structure

```
taskflow/
├── client/                     # React frontend
│   └── src/
│       ├── components/
│       │   ├── Board/          # Board, Column, Card, CardDetail, DragOverlay
│       │   ├── Layout/         # Navbar, PresenceBar
│       │   └── ui/             # Modal
│       ├── hooks/
│       │   ├── useSocket.ts    # Socket singleton + connect logic
│       │   ├── useBoard.ts     # Board room join + real-time event handlers
│       │   ├── usePresence.ts  # Presence tracking
│       │   └── useBoardActions.ts # API calls + optimistic updates
│       ├── pages/              # LoginPage, RegisterPage, BoardsPage, BoardPage
│       ├── stores/
│       │   ├── boardStore.ts   # Zustand: columns, cards, optimistic state
│       │   ├── authStore.ts    # Zustand: user, access token
│       │   └── notificationStore.ts
│       └── services/
│           └── api.ts          # Axios instance + token interceptors
│
├── server/                     # Express backend
│   └── src/
│       ├── config/             # MongoDB + Redis connections
│       ├── controllers/        # Auth, Board, Column, Card, User
│       ├── middleware/         # Auth, BoardAccess, Error
│       ├── models/             # User, Board, Column, Card, Notification, RefreshToken
│       ├── routes/             # Auth, Board, Column, Card, User
│       └── socket/
│           ├── socketManager.ts          # Redis adapter + JWT handshake
│           └── handlers/                 # Board, Card, Column, Presence handlers
│
├── docker-compose.yml          # MongoDB + Redis for local dev
├── .github/workflows/ci.yml    # Lint + type check on PR
└── README.md
```

---

## Deployment

### Backend (Render)
1. Create a new **Web Service** on Render
2. Connect your GitHub repo, set root directory to `server`
3. Build command: `npm run build`
4. Start command: `node dist/index.js`
5. Add all environment variables from `server/.env` (use MongoDB Atlas URI and Upstash Redis URL for production)

### Frontend (Vercel)
1. Create a new project on Vercel
2. Connect your GitHub repo, set root directory to `client`
3. Add environment variables:
   - `VITE_API_URL` → your Render backend URL
   - `VITE_SOCKET_URL` → your Render backend URL

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login, returns access token + sets refresh cookie |
| POST | /api/auth/refresh | Rotate refresh token, returns new access token |
| POST | /api/auth/logout | Invalidate refresh token |
| GET | /api/auth/me | Get current user |

### Boards
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/boards | Get all boards for current user |
| POST | /api/boards | Create board |
| GET | /api/boards/:id | Get full board with columns and cards |
| PATCH | /api/boards/:id | Rename board |
| DELETE | /api/boards/:id | Delete board (admin only) |
| POST | /api/boards/:id/members | Invite member by email |

### Cards
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/columns/:id/cards | Create card |
| PATCH | /api/cards/:id | Update card fields |
| DELETE | /api/cards/:id | Delete card |
| PATCH | /api/cards/:id/move | Move card to new column + position |
| POST | /api/cards/:id/comments | Add comment |

---

## WebSocket Events

### Client → Server
| Event | Payload |
|---|---|
| `board:join` | `{ boardId }` |
| `board:leave` | `{ boardId }` |
| `card:move` | `{ cardId, fromColumnId, toColumnId, newIndex }` |
| `typing:start` | `{ cardId }` |
| `typing:stop` | `{ cardId }` |

### Server → Client
| Event | Payload |
|---|---|
| `board:state` | Full board object |
| `card:created` | `{ card }` |
| `card:moved` | `{ cardId, fromColumnId, toColumnId, newIndex }` |
| `card:updated` | `{ cardId, changes }` |
| `card:deleted` | `{ cardId }` |
| `column:created` | `{ column }` |
| `column:updated` | `{ columnId, changes }` |
| `column:deleted` | `{ columnId }` |
| `presence:update` | `{ users: [{ userId, name }] }` |
| `typing:indicator` | `{ cardId, userId, name, isTyping }` |

