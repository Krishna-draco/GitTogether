# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

# DevDuel Frontend Notes

Quick start:

1. Install dependencies (if not already installed):

```bash
cd frontend
npm install --legacy-peer-deps
```

2. Start the dev server:

```bash
npm run dev
```

3. Backend must be running at `http://localhost:5000` (or set `VITE_API_URL` and `VITE_SOCKET_URL`).

OAuth:

- Configure a GitHub OAuth app and set `VITE_GITHUB_CLIENT_ID` and `VITE_GITHUB_REDIRECT_URI` in a `.env` file.
- Backend must provide `POST /api/auth/github/callback` to exchange the code for a token and return `{ user, token }`.

Socket notes:

- On connection the client attaches `socket.auth = { token }` and emits `AUTHENTICATE` with the token if present.

Frontend structure:

- `src/components` — React components (Auth, Lobby, Gameplay, Success)
- `src/hooks` — custom hooks (useAuth, useSocket, useMonaco, useCursorTracking)
- `src/services` — API & socket helpers
- `src/stores` — Zustand state stores

If you want me to run the dev server or wire more backend routes, tell me and I'll proceed.
