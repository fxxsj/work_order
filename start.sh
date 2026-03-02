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
    # 清理后端进程
    pkill -f "daphne.*config.asgi" 2>/dev/null && echo "已关闭后端服务"
    # 清理前端进程
    pkill -f "vue-cli-service.*serve" 2>/dev/null && echo "已关闭前端服务"
    exit 0
}

trap cleanup SIGINT SIGTERM

check_port() {
    local port=$1
    # 使用 netstat 或 lsof 检查端口
    if command -v netstat &>/dev/null; then
        netstat -an | grep ":$port.*LISTEN" | awk '{print $7}' | xargs -r kill -9 2>/dev/null
    elif command -v lsof &>/dev/null; then
        lsof -ti:$port 2>/dev/null | xargs -r kill -9 2>/dev/null
    fi
}

wait_for_service() {
    local pid=$1
    local name=$2
    local max_wait=10
    local count=0
    
    while [ $count -lt $max_wait ]; do
        if kill -0 $pid 2>/dev/null; then
            echo -e "${GREEN}    $name 已启动 (PID: $pid)${NC}"
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    
    echo -e "${RED}    $name 启动超时${NC}"
    return 1
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
echo "  - API文档: http://localhost:8000/api/docs/"
echo "  - WebSocket: ws://localhost:8000"
echo ""

# 启动后端 (Daphne 支持 HTTP + WebSocket)
echo -e "${GREEN}[1/2]${NC} 启动后端服务..."
cd "$PROJECT_DIR/backend"
source venv/bin/activate

# 确保后端依赖已安装
if ! python - <<'PY' >/dev/null 2>&1
import importlib
importlib.import_module("pkg_resources")
importlib.import_module("rest_framework_simplejwt")
PY
then
    echo -e "${YELLOW}后端依赖缺失，正在安装...${NC}"
    {
        echo "===== $(date) ====="
        # setuptools>=81 移除了 pkg_resources，这里固定到兼容版本
        python -m pip install --disable-pip-version-check --upgrade pip "setuptools==70.0.0" wheel
        python -m pip install --disable-pip-version-check -r requirements.txt
    } >> /tmp/workorder_backend_install.log 2>&1 || {
        echo -e "${RED}后端依赖安装失败，查看日志：${NC}"
        tail -30 /tmp/workorder_backend_install.log
        exit 1
    }
    if ! python - <<'PY' >/dev/null 2>&1
import importlib
importlib.import_module("pkg_resources")
importlib.import_module("rest_framework_simplejwt")
PY
    then
        echo -e "${RED}后端依赖安装后仍缺失，查看日志：${NC}"
        tail -30 /tmp/workorder_backend_install.log
        exit 1
    fi
fi

# 启动 daphne 并重定向日志
daphne -b 127.0.0.1 -p 8000 config.asgi:application > /tmp/workorder_backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}    后端启动失败，查看日志：${NC}"
    tail -20 /tmp/workorder_backend.log
    exit 1
fi

if ! wait_for_service $BACKEND_PID "后端"; then
    echo -e "${RED}    后端启动失败${NC}"
    tail -20 /tmp/workorder_backend.log
    exit 1
fi

# 启动前端
echo -e "${GREEN}[2/2]${NC} 启动前端服务..."
cd "$PROJECT_DIR/frontend"

# 启动前端并重定向日志
npm run serve > /tmp/workorder_frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 等待前端启动
sleep 5
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}    前端启动失败，查看日志：${NC}"
    tail -30 /tmp/workorder_frontend.log
    cleanup
    exit 1
fi

if ! wait_for_service $FRONTEND_PID "前端"; then
    echo -e "${RED}    前端启动失败${NC}"
    tail -30 /tmp/workorder_frontend.log
    cleanup
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  所有服务已启动！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}访问地址:${NC}"
echo "  前端:  http://localhost:8080"
echo "  后端:  http://localhost:8000/api/v1/"
echo "  文档:  http://localhost:8000/api/docs/"
echo ""
echo -e "${YELLOW}日志文件:${NC}"
echo "  后端:  /tmp/workorder_backend.log"
echo "  前端:  /tmp/workorder_frontend.log"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
echo ""

wait
