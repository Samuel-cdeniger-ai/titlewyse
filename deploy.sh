#!/usr/bin/env bash
# deploy.sh — Build and deploy TitleWyse frontend to Netlify
# Usage: ./deploy.sh [--preview]
#   --preview  Deploy to a preview URL (no --prod flag)
#   (default)  Deploy to production at https://titlewyse.netlify.app
#
# NOTE: Deploys from /tmp/titlewyse-deploy (working Netlify config).
# Source edits go in: ~/.openclaw/workspace/projects/titlewyse/app/frontend/
# This script syncs changed files before building.

set -e

SRC="$HOME/.openclaw/workspace/projects/titlewyse/app/frontend"
DEPLOY_DIR="/tmp/titlewyse-deploy"

echo "📂 Syncing source files to deploy dir..."
cp "$SRC/app/page.tsx"                                  "$DEPLOY_DIR/app/page.tsx"
cp "$SRC/app/layout.tsx"                                "$DEPLOY_DIR/app/layout.tsx"
cp "$SRC/app/globals.css"                               "$DEPLOY_DIR/app/globals.css"
cp "$SRC/app/review/new/page.tsx"                       "$DEPLOY_DIR/app/review/new/page.tsx"
cp "$SRC/app/review/[id]/processing/page.tsx"           "$DEPLOY_DIR/app/review/[id]/processing/page.tsx"
cp "$SRC/app/review/[id]/results/page.tsx"              "$DEPLOY_DIR/app/review/[id]/results/page.tsx"

echo "🏗️  Building..."
cd "$DEPLOY_DIR"
npm run build

if [ "$1" = "--preview" ]; then
  echo "🚀 Deploying preview..."
  netlify deploy
else
  echo "🚀 Deploying to production..."
  netlify deploy --prod
fi

echo "✅ Done. Live at https://titlewyse.netlify.app"
