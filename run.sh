#!/usr/bin/env bash
set -e

# ─── Configuration ─────────────────────────────────────────────
MAX_STARTUP_WAIT=15  # seconds to wait for each service to start

# ─── Colors ───────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

BACKEND_PORT=3001
FRONTEND_PORT=5173
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─── Cleanup handler ───────────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}⏹  Stopping services...${NC}"
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null && wait "$BACKEND_PID" 2>/dev/null
    echo -e "  ${GREEN}✓${NC} Backend stopped"
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null && wait "$FRONTEND_PID" 2>/dev/null
    echo -e "  ${GREEN}✓${NC} Frontend stopped"
  fi
  echo -e "${GREEN}✅ All services stopped.${NC}"
}
trap cleanup EXIT

# ─── Helper: kill process on a port ────────────────────────────
kill_port() {
  local PORT=$1
  local PIDS
  PIDS=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo -e "  ${YELLOW}Port $PORT is in use by PID(s): $PIDS${NC}"
    kill $PIDS 2>/dev/null || true
    sleep 1
    # Force kill if still alive
    STILL_ALIVE=$(lsof -ti :"$PORT" 2>/dev/null || true)
    if [ -n "$STILL_ALIVE" ]; then
      kill -9 $STILL_ALIVE 2>/dev/null || true
      sleep 0.5
    fi
    echo -e "  ${GREEN}✓${NC} Port $PORT freed"
  fi
}

# ─── Header ─────────────────────────────────────────────────────
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🎵 YouTube Smart Playlist Creator          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ─── Check prerequisites ───────────────────────────────────────
echo -e "${CYAN}🔍 Checking prerequisites...${NC}"

if ! command -v go &>/dev/null; then
  echo -e "  ${RED}✗ Go is not installed. Please install Go 1.26+.${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Go $(go version | awk '{print $3}')"

# Check PostgreSQL
if command -v pg_isready &>/dev/null; then
  if pg_isready -q 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} PostgreSQL is running"
  else
    echo -e "  ${RED}✗ PostgreSQL is not running. Please start it first.${NC}"
    exit 1
  fi
else
  # Fallback: check if port 5432 is listening
  if lsof -ti :5432 &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} PostgreSQL appears to be running (port 5432)"
  else
    echo -e "  ${YELLOW}⚠ Could not verify PostgreSQL. Make sure it's running on port 5432.${NC}"
  fi
fi

if ! command -v node &>/dev/null; then
  echo -e "  ${RED}✗ Node.js is not installed. Please install Node.js 20+.${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node --version)"

if ! command -v npm &>/dev/null; then
  echo -e "  ${RED}✗ npm is not installed.${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} npm $(npm --version)"

# Check frontend dependencies
if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
  echo -e "  ${YELLOW}⚠ Frontend dependencies not found. Running npm install...${NC}"
  cd "$PROJECT_DIR/frontend"
  npm install
  cd "$PROJECT_DIR"
  echo -e "  ${GREEN}✓${NC} Frontend dependencies installed"
fi

echo ""

# ─── Clear ports ────────────────────────────────────────────────
echo -e "${CYAN}🔍 Checking ports...${NC}"
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
echo ""

# ─── Start backend ─────────────────────────────────────────────
echo -e "${CYAN}🚀 Starting backend (port $BACKEND_PORT)...${NC}"
cd "$PROJECT_DIR/backend"
go run . &
BACKEND_PID=$!
echo -e "  ${GREEN}✓${NC} Backend PID: $BACKEND_PID"
cd "$PROJECT_DIR"

# Poll until backend is running (or timeout)
echo -e "  ${YELLOW}⏳ Waiting for backend to start...${NC}"
for i in $(seq 1 $MAX_STARTUP_WAIT); do
  if kill -0 "$BACKEND_PID" 2>/dev/null; then
    break
  fi
  if [ "$i" -eq "$MAX_STARTUP_WAIT" ]; then
    echo -e "  ${RED}✗ Backend failed to start within ${MAX_STARTUP_WAIT}s. Check logs above.${NC}"
    exit 1
  fi
  sleep 1
done
echo -e "  ${GREEN}✓${NC} Backend is running"
echo ""

# ─── Start frontend ────────────────────────────────────────────
echo -e "${CYAN}🚀 Starting frontend (port $FRONTEND_PORT)...${NC}"
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo -e "  ${GREEN}✓${NC} Frontend PID: $FRONTEND_PID"
cd "$PROJECT_DIR"

# Poll until frontend is running (or timeout)
echo -e "  ${YELLOW}⏳ Waiting for frontend to start...${NC}"
for i in $(seq 1 $MAX_STARTUP_WAIT); do
  if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    break
  fi
  if [ "$i" -eq "$MAX_STARTUP_WAIT" ]; then
    echo -e "  ${RED}✗ Frontend failed to start within ${MAX_STARTUP_WAIT}s. Check logs above.${NC}"
    exit 1
  fi
  sleep 1
done
echo -e "  ${GREEN}✓${NC} Frontend is running"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Both services are running!              ║${NC}"
echo -e "${GREEN}║                                              ║${NC}"
echo -e "${GREEN}║   Frontend:  http://localhost:$FRONTEND_PORT    ║${NC}"
echo -e "${GREEN}║   Backend:   http://localhost:$BACKEND_PORT    ║${NC}"
echo -e "${GREEN}║                                              ║${NC}"
echo -e "${GREEN}║   Press Ctrl+C to stop all services.         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ─── Wait for either process to exit ───────────────────────────
wait
