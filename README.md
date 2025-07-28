
## Frontend (React + Vite)

1. Install dependencies:

```bash
npm install --prefix client
```

2. Start development server (auto-proxies API to Express backend):

```bash
npm run --prefix client dev
```

The app will be available at http://localhost:5173 and will communicate with the backend running on http://localhost:3000 via `/api` proxy.