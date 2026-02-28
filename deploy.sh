#!/usr/bin/env bash
# deploy.sh — Build and deploy TitleWyse frontend to Netlify
# Usage: ./deploy.sh [--preview]
#   --preview  Deploy to a preview URL (no --prod flag)
#   (default)  Deploy to production at https://titlewyse.netlify.app

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🏗️  Building TitleWyse..."
npm run build

if [ "$1" = "--preview" ]; then
  echo "🚀 Deploying preview..."
  netlify deploy
else
  echo "🚀 Deploying to production..."
  netlify deploy --prod
fi

echo "✅ Done. Live at https://titlewyse.netlify.app"
