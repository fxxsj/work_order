#!/bin/bash
#
# 印刷施工单跟踪系统启动脚本
# 同时启动前端和后端服务
#

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

cleanup() {
    echo -e "\n${YELLOW}正在关闭所有服务...${NC}"
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null && echo "已关闭后端服务"
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null && echo "已关闭前端服务"
    exit 0
}

trap cleanup SIGINT SIGTERM

check_port() {
    local port=$1
    lsof -t -i:$port 2>/dev/null | xargs -r kill -9 2>/dev/null
}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  印刷施工单跟踪系统${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${YELLOW}检查端口占用...${NC}"
check_port 8000
check_port 8080
echo -e "${GREEN}端口已释放${NC}"
echo ""

echo -e "${GREEN}启动服务:${NC}"
echo "  - 前端:    http://localhost:8080"
echo "  - 后端:    http://localhost:8000"
echo "  - WebSocket: ws://localhost:8000"
echo ""

# 启动后端 (Daphne 支持 HTTP + WebSocket)
echo -e "${GREEN}[1/2]${NC} 启动后端服务..."
cd "$PROJECT_DIR/backend"
daphne -b 0.0.0.0 -p 8000 config.asgi:application > /dev/null 2>&1 &
BACKEND_PID=$!
cd ..

sleep 2
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}    后端已启动 (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}    后端启动失败${NC}"
    exit 1
fi

# 启动前端
echo -e "${GREEN}[2/2]${NC} 启动前端服务..."
cd "$PROJECT_DIR/frontend"
npm run serve > /dev/null 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 3
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${GREEN}    前端已启动 (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}    前端启动失败${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  所有服务已启动！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "访问: http://localhost:8080"
echo ""

wait
