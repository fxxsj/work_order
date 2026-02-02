#!/bin/bash
#
# 印刷施工单跟踪系统启动脚本
# 同时启动 HTTP 服务器和 WebSocket 服务器
#

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# 激活虚拟环境
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
else
    echo -e "${RED}错误: 未找到虚拟环境 venv${NC}"
    exit 1
fi

# 检查进程并关闭
cleanup() {
    echo -e "\n${YELLOW}正在关闭服务器...${NC}"
    if [ ! -z "$HTTP_PID" ]; then
        kill $HTTP_PID 2>/dev/null
        echo "已关闭 HTTP 服务器 (PID: $HTTP_PID)"
    fi
    if [ ! -z "$WS_PID" ]; then
        kill $WS_PID 2>/dev/null
        echo "已关闭 WebSocket 服务器 (PID: $WS_PID)"
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# 检查端口是否被占用，如果占用则关闭
check_and_kill_port() {
    local port=$1
    local pid=$(lsof -t -i:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}警告: 端口 $port 已被占用 (PID: $pid)，正在关闭...${NC}"
        kill $pid 2>/dev/null
        sleep 1
        # 再次检查，确保已关闭
        pid=$(lsof -t -i:$port 2>/dev/null)
        if [ ! -z "$pid" ]; then
            kill -9 $pid 2>/dev/null
            sleep 1
        fi
        echo -e "${GREEN}端口 $port 已释放${NC}"
    fi
    return 0
}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  印刷施工单跟踪系统${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查并释放端口
echo -e "${YELLOW}检查端口占用情况...${NC}"
check_and_kill_port 8000
check_and_kill_port 8001

echo ""
echo -e "${GREEN}启动服务:${NC}"
echo "  - HTTP API:      http://localhost:8000"
echo "  - WebSocket:     ws://localhost:8001"
echo "  - API 文档:      http://localhost:8000/api/schema/"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
echo ""

# 启动 HTTP 服务器 (Django)
echo -e "${GREEN}[1/2]${NC} 启动 HTTP 服务器..."
cd backend
python manage.py runserver 0.0.0.0:8000 &
HTTP_PID=$!
cd ..

# 等待 HTTP 服务器启动
sleep 2

# 检查 HTTP 服务器是否启动成功
if ! kill -0 $HTTP_PID 2>/dev/null; then
    echo -e "${RED}错误: HTTP 服务器启动失败${NC}"
    exit 1
fi
echo -e "${GREEN}    HTTP 服务器已启动 (PID: $HTTP_PID)${NC}"

# 启动 ASGI 服务器 (Daphne for WebSocket)
echo -e "${GREEN}[2/2]${NC} 启动 WebSocket 服务器..."
cd backend
daphne -b 0.0.0.0 -p 8001 config.asgi:application &
WS_PID=$!
cd ..

# 等待 WebSocket 服务器启动
sleep 2

# 检查 WebSocket 服务器是否启动成功
if ! kill -0 $WS_PID 2>/dev/null; then
    echo -e "${RED}错误: WebSocket 服务器启动失败${NC}"
    kill $HTTP_PID 2>/dev/null
    exit 1
fi
echo -e "${GREEN}    WebSocket 服务器已启动 (PID: $WS_PID)${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  所有服务已启动！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 等待用户中断
wait
