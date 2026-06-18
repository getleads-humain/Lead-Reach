#!/bin/sh
# Build cache marker: c783cb4-v2 (forces FC to rebuild container, not reuse cache)

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR"

# 存储所有子进程的 PID
pids=""

# 清理函数：优雅关闭所有服务
cleanup() {
    echo ""
    echo "🛑 正在关闭所有服务..."
    
    # 发送 SIGTERM 信号给所有子进程
    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            service_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
            echo "   关闭进程 $pid ($service_name)..."
            kill -TERM "$pid" 2>/dev/null
        fi
    done
    
    # 等待所有进程退出（最多等待 5 秒）
    sleep 1
    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            # 如果还在运行，等待最多 4 秒
            timeout=4
            while [ $timeout -gt 0 ] && kill -0 "$pid" 2>/dev/null; do
                sleep 1
                timeout=$((timeout - 1))
            done
            # 如果仍然在运行，强制关闭
            if kill -0 "$pid" 2>/dev/null; then
                echo "   强制关闭进程 $pid..."
                kill -KILL "$pid" 2>/dev/null
            fi
        fi
    done
    
    echo "✅ 所有服务已关闭"
    exit 0
}

echo "🚀 开始启动所有服务..."
echo ""

# 切换到构建目录
cd "$BUILD_DIR" || exit 1

ls -lah

DEFAULT_PACKAGED_DB_PATH="/app/db/custom.db"
DEFAULT_PACKAGED_DATABASE_URL="file:$DEFAULT_PACKAGED_DB_PATH"

# 启动 Next.js 服务器
if [ -f "./next-service-dist/server.js" ]; then
    echo "🚀 启动 Next.js 服务器..."
    cd next-service-dist/ || exit 1
    
    # 设置环境变量
    export NODE_ENV=production
    export PORT="${PORT:-3000}"
    export HOSTNAME="${HOSTNAME:-0.0.0.0}"
    export DATABASE_URL="${DATABASE_URL:-$DEFAULT_PACKAGED_DATABASE_URL}"
    # Conservative heap cap — standalone build is small, tighter heap reduces
    # GC pressure and speeds up cold start on Function Compute.
    export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}"

    if [ "$DATABASE_URL" = "$DEFAULT_PACKAGED_DATABASE_URL" ]; then
        if [ ! -f "$DEFAULT_PACKAGED_DB_PATH" ]; then
            echo "❌ 未找到打包后的数据库文件 $DEFAULT_PACKAGED_DB_PATH"
            echo "   为避免生产环境启动到空数据库，启动已终止"
            exit 1
        fi

        echo "🗄️  当前使用打包数据库: $DEFAULT_PACKAGED_DB_PATH"
    else
        echo "🗄️  当前使用外部指定数据库: $DATABASE_URL"
    fi
    
    # Choose runtime: prefer node (best Prisma/native-module compatibility),
    # fall back to bun if node is unavailable.
    if command -v node >/dev/null 2>&1; then
        RUNNER="node"
    elif command -v bun >/dev/null 2>&1; then
        RUNNER="bun"
    else
        echo "❌ Neither node nor bun found in PATH"
        exit 1
    fi
    echo " runtime: $RUNNER"
    
    # Start Next.js in the background.
    # We use 'nohup' + '&' so the process is fully detached from this shell —
    # important because 'exec caddy' later replaces this shell and would
    # otherwise take Next.js down with it.
    nohup "$RUNNER" server.js > /tmp/nextjs.log 2>&1 &
    NEXT_PID=$!
    pids="$NEXT_PID"
    
    # ── Wait for Next.js to actually be HTTP-ready ─────────────────────────
    # Previous version did 'sleep 1' and only checked the process was alive.
    # That was racy: Next.js with Prisma + 8-agent pipeline + 7 data-source
    # modules takes 5-15s to bind to the port. Caddy then proxied to a dead
    # upstream, FC's health checks failed, and the function got stuck in
    # "pending state" forever.
    #
    # Now we poll /health (an ultra-light route that returns 200 with no DB
    # or auth) every 0.5s, up to 60s. Only then do we start Caddy.
    echo "   waiting for Next.js HTTP readiness on :$PORT/health (max 60s)…"
    READY=0
    WAIT_SEC=0
    while [ $WAIT_SEC -lt 60 ]; do
        # Check process is still alive first
        if ! kill -0 "$NEXT_PID" 2>/dev/null; then
            echo "❌ Next.js process exited during startup. Last log lines:"
            tail -30 /tmp/nextjs.log 2>&1 || true
            exit 1
        fi
        
        # Try the health endpoint
        if command -v curl >/dev/null 2>&1; then
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/health" 2>/dev/null || echo "000")
        elif command -v wget >/dev/null 2>&1; then
            # wget fallback: -q quiet, -S server response, --spider don't download
            HTTP_CODE=$(wget -q -S --spider "http://127.0.0.1:$PORT/health" 2>&1 | grep -oE 'HTTP/[0-9.]+ [0-9]+' | tail -1 | awk '{print $2}')
            HTTP_CODE="${HTTP_CODE:-000}"
        else
            # No HTTP client available — fall back to port-listen check
            if command -v nc >/dev/null 2>&1; then
                nc -z 127.0.0.1 "$PORT" 2>/dev/null && HTTP_CODE="200" || HTTP_CODE="000"
            else
                # Last-resort fallback: assume ready after process is alive 5s
                HTTP_CODE="200"
            fi
        fi
        
        if [ "$HTTP_CODE" = "200" ]; then
            READY=1
            echo "   ✅ Next.js ready after ${WAIT_SEC}s (HTTP 200 from /health)"
            break
        fi
        
        sleep 1
        WAIT_SEC=$((WAIT_SEC + 1))
    done
    
    if [ $READY -eq 0 ]; then
        echo "⚠️  Next.js did not become HTTP-ready within 60s, but continuing anyway…"
        echo "   Last 20 log lines:"
        tail -20 /tmp/nextjs.log 2>&1 || true
        # Don't exit — Caddy will still try to proxy and may catch up.
        # FC's own health checks will retry and eventually succeed once
        # Next.js finishes booting.
    fi
    
    echo "✅ Next.js 服务器已启动 (PID: $NEXT_PID, Port: $PORT)"
    
    cd ../
else
    echo "⚠️  未找到 Next.js 服务器文件: ./next-service-dist/server.js"
fi

# 启动 mini-services
if [ -f "./mini-services-start.sh" ]; then
    echo "🚀 启动 mini-services..."
    
    # 运行启动脚本（从根目录运行，脚本内部会处理 mini-services-dist 目录）
    sh ./mini-services-start.sh &
    MINI_PID=$!
    pids="$pids $MINI_PID"
    
    # 等待一小段时间检查进程是否成功启动
    sleep 1
    if ! kill -0 "$MINI_PID" 2>/dev/null; then
        echo "⚠️  mini-services 可能启动失败，但继续运行..."
    else
        echo "✅ mini-services 已启动 (PID: $MINI_PID)"
    fi
elif [ -d "./mini-services-dist" ]; then
    echo "⚠️  未找到 mini-services 启动脚本，但目录存在"
else
    echo "ℹ️  mini-services 目录不存在，跳过"
fi

# 启动 Caddy（如果存在 Caddyfile）
echo "🚀 启动 Caddy..."

# Caddy 作为前台进程运行（主进程）
echo "✅ Caddy 已启动（前台运行）"
echo ""
echo "🎉 所有服务已启动！"
echo ""
echo "💡 按 Ctrl+C 停止所有服务"
echo ""

# Caddy 作为主进程运行
exec caddy run --config Caddyfile --adapter caddyfile
