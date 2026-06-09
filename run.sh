#!/usr/bin/env bash
set -e

# ─── Configuration ─────────────────────────────────────────────
MAX_STARTUP_WAIT=15  # seconds to wait for each service to start

BACKEND_PORT=3001
FRONTEND_PORT=5173
MERGE_SERVER_PORT=5002
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="${PROJECT_DIR}/.pids"

# ─── Colors ───────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ═══════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════

# ─── Header ─────────────────────────────────────────────────────
header() {
  echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║   🎵 YouTube Smart Playlist Creator          ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
  echo ""
}

# ─── Helper: kill process on a port ────────────────────────────
kill_port() {
  local PORT=$1
  local PIDS
  PIDS=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo -e "  ${YELLOW}Port $PORT is in use by PID(s): $PIDS${NC}"
    kill $PIDS 2>/dev/null || true
    sleep 1
    STILL_ALIVE=$(lsof -ti :"$PORT" 2>/dev/null || true)
    if [ -n "$STILL_ALIVE" ]; then
      kill -9 $STILL_ALIVE 2>/dev/null || true
      sleep 0.5
    fi
    echo -e "  ${GREEN}✓${NC} Port $PORT freed"
  fi
}

# ─── Check prerequisites ───────────────────────────────────────
check_prerequisites() {
  echo -e "${CYAN}🔍 Checking prerequisites...${NC}"

  if ! command -v go &>/dev/null; then
    echo -e "  ${RED}✗ Go is not installed. Please install Go 1.26+.${NC}"
    exit 1
  fi
  echo -e "  ${GREEN}✓${NC} Go $(go version | awk '{print $3}')"

  if command -v pg_isready &>/dev/null; then
    if pg_isready -q 2>/dev/null; then
      echo -e "  ${GREEN}✓${NC} PostgreSQL is running"
    else
      echo -e "  ${RED}✗ PostgreSQL is not running. Please start it first.${NC}"
      exit 1
    fi
  else
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

  if ! command -v python3 &>/dev/null; then
    echo -e "  ${RED}✗ Python 3 is not installed. Please install Python 3.10+.${NC}"
    exit 1
  fi
  echo -e "  ${GREEN}✓${NC} Python 3 $(python3 --version | awk '{print $2}')"

  if ! command -v ffmpeg &>/dev/null; then
    echo -e "  ${YELLOW}⚠ ffmpeg not found. Install with: brew install ffmpeg${NC}"
  else
    echo -e "  ${GREEN}✓${NC} ffmpeg found"
  fi

  if ! command -v yt-dlp &>/dev/null; then
    echo -e "  ${YELLOW}⚠ yt-dlp not found. Install with: brew install yt-dlp${NC}"
  else
    echo -e "  ${GREEN}✓${NC} yt-dlp found"
  fi
}

# ─── Install dependencies if missing ────────────────────────────
check_and_install_deps() {
  if [ -d "$PROJECT_DIR/.venv" ]; then
    echo -e "  ${GREEN}✓${NC} Project venv found"
  else
    echo -e "  ${YELLOW}⚠ Project venv not found. Creating one...${NC}"
    python3 -m venv "$PROJECT_DIR/.venv"
    source "$PROJECT_DIR/.venv/bin/activate"
    pip install -q flask
    echo -e "  ${GREEN}✓${NC} venv created and flask installed"
  fi

  if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
    echo -e "  ${YELLOW}⚠ Frontend dependencies not found. Running npm install...${NC}"
    cd "$PROJECT_DIR/frontend"
    npm install
    cd "$PROJECT_DIR"
    echo -e "  ${GREEN}✓${NC} Frontend dependencies installed"
  fi
}

# ─── Check single service status ────────────────────────────────
check_service_status() {
  local name=$1
  local port=$2
  local pid_file=$3
  local pid=""

  if [ -f "$pid_file" ]; then
    pid=$(cat "$pid_file")
  fi

  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $name running (PID $pid, port $port)"
  elif lsof -ti :"$port" &>/dev/null; then
    local actual_pid
    actual_pid=$(lsof -ti :"$port" 2>/dev/null | head -1)
    echo -e "  ${YELLOW}⚠ $name running on port $port (PID $actual_pid) but no pid file${NC}"
    echo "$actual_pid" > "$pid_file"
  else
    echo -e "  ${RED}✗ $name not running${NC}"
    all_running=false
  fi
}

# ═══════════════════════════════════════════════════════════════
#  COMMAND: start
# ═══════════════════════════════════════════════════════════════
cmd_start() {
  if [ -f "$PID_DIR/backend.pid" ] && kill -0 "$(cat "$PID_DIR/backend.pid")" 2>/dev/null; then
    echo -e "${YELLOW}⚠ Services appear to be running already. Use '$0 restart' or '$0 stop' first.${NC}"
    cmd_status
    exit 0
  fi

  mkdir -p "$PID_DIR"

  header
  check_prerequisites
  check_and_install_deps
  echo ""

  # Clear ports
  echo -e "${CYAN}🔍 Checking ports...${NC}"
  kill_port $BACKEND_PORT
  kill_port $FRONTEND_PORT
  kill_port $MERGE_SERVER_PORT
  echo ""

  # ─── Start backend ─────────────────────────────────────────
  echo -e "${CYAN}🚀 Starting backend (port $BACKEND_PORT)...${NC}"
  cd "$PROJECT_DIR/backend"
  go run . &
  BACKEND_PID=$!
  echo "$BACKEND_PID" > "$PID_DIR/backend.pid"
  cd "$PROJECT_DIR"

  echo -e "  ${GREEN}✓${NC} Backend PID: $BACKEND_PID"
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

  # ─── Start Python merge server ─────────────────────────────
  echo -e "${CYAN}🚀 Starting Python merge server (port $MERGE_SERVER_PORT)...${NC}"
  if [ -d "$PROJECT_DIR/.venv" ]; then
    source "$PROJECT_DIR/.venv/bin/activate"
  fi
  python3 "$PROJECT_DIR/scripts/merge_server.py" &
  MERGE_PID=$!
  echo "$MERGE_PID" > "$PID_DIR/merge_server.pid"

  sleep 2
  if kill -0 "$MERGE_PID" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Merge server PID: $MERGE_PID"
  else
    echo -e "  ${YELLOW}⚠ Merge server may not have started. Check logs.${NC}"
  fi
  echo ""

  # ─── Start frontend ────────────────────────────────────────
  echo -e "${CYAN}🚀 Starting frontend (port $FRONTEND_PORT)...${NC}"
  cd "$PROJECT_DIR/frontend"
  npm run dev &
  FRONTEND_PID=$!
  echo "$FRONTEND_PID" > "$PID_DIR/frontend.pid"
  cd "$PROJECT_DIR"

  echo -e "  ${GREEN}✓${NC} Frontend PID: $FRONTEND_PID"
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
  echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║   ✅ All 3 services are running!                     ║${NC}"
  echo -e "${GREEN}║                                                    ║${NC}"
  echo -e "${GREEN}║   Frontend:     http://localhost:$FRONTEND_PORT       ║${NC}"
  echo -e "${GREEN}║   Backend:      http://localhost:$BACKEND_PORT       ║${NC}"
  echo -e "${GREEN}║   Merge server: http://localhost:$MERGE_SERVER_PORT   ║${NC}"
  echo -e "${GREEN}║                                                    ║${NC}"
  echo -e "${GREEN}║   Run '$0 stop' to stop all services.               ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# ═══════════════════════════════════════════════════════════════
#  COMMAND: stop
# ═══════════════════════════════════════════════════════════════
cmd_stop() {
  echo -e "${YELLOW}⏹  Stopping services...${NC}"
  local any_stopped=false

  for svc in backend frontend merge_server; do
    local pid_file="$PID_DIR/${svc}.pid"
    # Build display name (e.g. "merge_server" → "Merge server")
    case "$svc" in
      backend)      display_name="Backend" ;;
      frontend)     display_name="Frontend" ;;
      merge_server) display_name="Merge server" ;;
      *)            display_name="$svc" ;;
    esac

    if [ -f "$pid_file" ]; then
      local pid
      pid=$(cat "$pid_file")
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null || true
        wait "$pid" 2>/dev/null || true
        echo -e "  ${GREEN}✓${NC} $display_name stopped (PID $pid)"
        any_stopped=true
      else
        echo -e "  ${YELLOW}⚠ $display_name (PID $pid) not running, cleaning up pid file${NC}"
      fi
      rm -f "$pid_file"
    fi
  done

  # Also free ports for any lingering processes
  kill_port $BACKEND_PORT
  kill_port $FRONTEND_PORT
  kill_port $MERGE_SERVER_PORT

  rm -rf "$PID_DIR" 2>/dev/null || true

  if [ "$any_stopped" = true ]; then
    echo -e "${GREEN}✅ All services stopped.${NC}"
  else
    echo -e "${YELLOW}No running services found.${NC}"
  fi
}

# ═══════════════════════════════════════════════════════════════
#  COMMAND: restart
# ═══════════════════════════════════════════════════════════════
cmd_restart() {
  cmd_stop
  sleep 1
  cmd_start
}

# ═══════════════════════════════════════════════════════════════
#  COMMAND: status
# ═══════════════════════════════════════════════════════════════
cmd_status() {
  echo -e "${CYAN}📊 Service status:${NC}"
  echo ""

  local all_running=true

  check_service_status "Backend"      $BACKEND_PORT     "$PID_DIR/backend.pid"
  check_service_status "Frontend"     $FRONTEND_PORT    "$PID_DIR/frontend.pid"
  check_service_status "Merge server" $MERGE_SERVER_PORT "$PID_DIR/merge_server.pid"

  echo ""
  if [ "$all_running" = true ]; then
    echo -e "${GREEN}▶  All services running. Run '$0 stop' to stop.${NC}"
  else
    echo -e "${YELLOW}▶  Some services are down. Run '$0 start' to start all.${NC}"
  fi
}

# ═══════════════════════════════════════════════════════════════
#  COMMAND DISPATCH  (must be at the bottom, after all functions)
# ═══════════════════════════════════════════════════════════════
case "${1:-start}" in
  start)    cmd_start ;;
  stop)     cmd_stop ;;
  restart)  cmd_restart ;;
  status)   cmd_status ;;
  *)
    echo -e "${RED}Usage:${NC} $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
