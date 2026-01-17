#!/bin/bash

# 启动 Polygon 跟单程序

if command -v pm2 &> /dev/null; then
    echo "🚀 使用 PM2 启动..."
    if pm2 list | grep -q "polygon-copy-trading"; then
        echo "程序已在运行，重启中..."
        pm2 restart polygon-copy-trading --update-env
    else
        pm2 start ecosystem.config.js --update-env
    fi
    pm2 save
    echo ""
    echo "✅ 程序已启动"
    echo "📊 查看日志: pm2 logs polygon-copy-trading"
    echo "📋 查看状态: pm2 status"
    pm2 logs polygon-copy-trading
else
    echo "🚀 直接启动..."
    if [ ! -d "dist" ]; then
        echo "编译项目..."
        npm run build
    fi
    npm start
fi
