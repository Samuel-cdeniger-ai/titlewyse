# TitleWyse Frontend — Deploy Reference

## Source of Truth
**Local source:** `~/.openclaw/workspace/projects/titlewyse/app/frontend/`
**GitHub:** https://github.com/Samuel-cdeniger-ai/titlewyse (private)
**Live site:** https://titlewyse.netlify.app
**Netlify site ID:** e101480a-192b-490b-886f-130b65b97fbb

## Deploy to Production
```bash
cd ~/.openclaw/workspace/projects/titlewyse/app/frontend
./deploy.sh
```
That's it. Builds Next.js → deploys to Netlify prod.

## Deploy Preview (test before going live)
```bash
./deploy.sh --preview
```
Returns a unique preview URL.

## Push to GitHub
```bash
cd ~/.openclaw/workspace/projects/titlewyse/app/frontend
git add -A
git commit -m "your message"
git push origin main
```

## Change the Backend URL
The backend URL is set in 3 files. When the backend is deployed, update all three:
```bash
OLD="http://localhost:8001"
NEW="https://YOUR-BACKEND-URL"

sed -i '' "s|$OLD|$NEW|g" \
  app/review/new/page.tsx \
  "app/review/[id]/processing/page.tsx" \
  "app/review/[id]/results/page.tsx"

./deploy.sh
```

## Backend
- **Source:** `~/.openclaw/workspace/projects/titlewyse/app/backend/`
- **Local run:** `cd ~/.openclaw/workspace/projects/titlewyse/app && uvicorn main:app --port 8001`
- **Deployed:** TBD (Railway/Render — see backend deploy agent output)

## Stack
- Next.js 15, deployed via Netlify CLI
- FastAPI (Python) backend, Claude Sonnet for analysis
- No database — in-memory job store (resets on restart, fine for demo)
