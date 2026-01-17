#!/bin/bash

# 停止 Polygon 跟单程序

if command -v pm2 &> /dev/null; then
    echo "⏹️  使用 PM2 停止..."
    if pm2 list | grep -q "polygon-copy-trading"; then
        pm2 stop polygon-copy-trading
        pm2 save
        echo "✅ 程序已停止"
    else
        echo "⚠️  程序未在运行"
    fi
else
    echo "⏹️  停止进程..."
    pkill -f "node dist/polygon_fast_copy.js" || true
    echo "✅ 已尝试停止进程"
fi
