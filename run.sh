#!/usr/bin/env bash
set -e

# Ensure we're in the project root (works regardless of where script is called from)
cd "$(dirname "$0")"

echo "======================================"
echo "  YouTube Smart Playlist Creator"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ─── 1. Install dependencies ───────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}[1/4] Installing dependencies...${NC}"
  npm install
  echo -e "${GREEN}  ✓ Dependencies installed${NC}"
else
  echo -e "${CYAN}[1/4] Dependencies already installed (skip)${NC}"
fi

# ─── 2. Generate Prisma Client ─────────────────────────────────
echo -e "${YELLOW}[2/4] Generating Prisma Client...${NC}"
cd server
npx prisma generate
cd ..
echo -e "${GREEN}  ✓ Prisma Client generated${NC}"

# ─── 3. Push schema to database ────────────────────────────────
echo -e "${YELLOW}[3/4] Pushing schema to database...${NC}"
cd server

# Push schema with helpful error message on failure
if ! npx prisma db push --accept-data-loss --skip-generate; then
  echo ""
  echo -e "${RED}  ✗ Database setup failed.${NC}"
  echo -e "  Ensure PostgreSQL is running on localhost:5432"
  echo -e "  Expected: postgresql://postgres:password@localhost:5432/playlist"
  echo ""
  exit 1
fi

cd ..
echo -e "${GREEN}  ✓ Schema pushed to database${NC}"

# ─── 4. Start dev servers ──────────────────────────────────────
echo -e "${YELLOW}[4/4] Starting development servers...${NC}"
echo ""
echo -e "  ${CYAN}Client:${NC} http://localhost:5173"
echo -e "  ${CYAN}Server:${NC} http://localhost:3001"
echo -e "  ${CYAN}Health:${NC} http://localhost:3001/api/health"
echo ""

# Run both servers in parallel
npm run dev --workspace=client &
CLIENT_PID=$!
npm run dev --workspace=server &
SERVER_PID=$!

# Trap Ctrl+C to kill both
trap 'echo ""; echo -e "${YELLOW}Shutting down...${NC}"; kill $CLIENT_PID $SERVER_PID 2>/dev/null; exit' INT TERM

# Wait for both
wait $CLIENT_PID $SERVER_PID
