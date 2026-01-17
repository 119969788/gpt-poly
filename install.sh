#!/bin/bash

# Polygon 快速跟单程序 - 一键安装脚本
# 支持 Linux/Unix 系统

set -e

echo "🚀 开始安装 Polygon 快速跟单程序..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}⚠️  未检测到项目文件，尝试从 GitHub 克隆...${NC}"
    if [ -d "gpt-poly" ]; then
        echo -e "${YELLOW}项目目录已存在，进入目录...${NC}"
        cd gpt-poly
    else
        echo "正在克隆项目..."
        git clone https://github.com/119969788/gpt-poly.git
        cd gpt-poly
    fi
fi

# 检查 Node.js
echo "📦 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  未检测到 Node.js，正在安装...${NC}"
    
    # 检测系统类型
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install node
        else
            echo -e "${RED}❌ 请先安装 Homebrew: https://brew.sh${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ 不支持的系统类型，请手动安装 Node.js 18+${NC}"
        exit 1
    fi
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 版本过低 (当前: $(node -v))，需要 18+${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# 安装依赖
echo ""
echo "📥 安装项目依赖..."
npm install

# 编译项目
echo ""
echo "🔨 编译 TypeScript..."
npm run build

# 检查 .env 文件
echo ""
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  未找到 .env 文件，正在创建模板...${NC}"
    cat > .env << 'EOF'
# Polygon RPC 节点配置（必须使用私有节点，否则会慢）
# 推荐：Alchemy / Infura / QuickNode
RPC_WS=wss://polygon-mainnet.g.alchemy.com/v2/你的KEY
RPC_HTTP=https://polygon-mainnet.g.alchemy.com/v2/你的KEY

# 跟单钱包私钥（不要泄露！）
PRIVATE_KEY=你的私钥

# 目标跟单地址（Trader）
TARGET=0xe00740bce98a594e26861838885ab310ec3b548c
EOF
    echo -e "${YELLOW}⚠️  请编辑 .env 文件并填入你的配置：${NC}"
    echo "   nano .env"
    echo ""
else
    echo -e "${GREEN}✅ .env 文件已存在${NC}"
fi

# 检查 PM2
echo ""
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  未检测到 PM2，建议安装以方便管理进程...${NC}"
    read -p "是否安装 PM2? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo npm install -g pm2
        echo -e "${GREEN}✅ PM2 已安装${NC}"
    fi
else
    echo -e "${GREEN}✅ PM2 $(pm2 -v)${NC}"
fi

# 创建启动脚本
echo ""
echo "📝 创建启动脚本..."

cat > start.sh << 'EOFSCRIPT'
#!/bin/bash
# 启动脚本

if command -v pm2 &> /dev/null; then
    echo "🚀 使用 PM2 启动..."
    pm2 start ecosystem.config.js --update-env
    pm2 save
    pm2 logs
else
    echo "🚀 直接启动..."
    npm start
fi
EOFSCRIPT

chmod +x start.sh

# 创建停止脚本
cat > stop.sh << 'EOFSCRIPT'
#!/bin/bash
# 停止脚本

if command -v pm2 &> /dev/null; then
    echo "⏹️  使用 PM2 停止..."
    pm2 stop polygon-copy-trading
else
    echo "⏹️  停止进程（Ctrl+C）..."
    pkill -f "node dist/polygon_fast_copy.js" || true
fi
EOFSCRIPT

chmod +x stop.sh

# 创建 PM2 配置文件
if command -v pm2 &> /dev/null; then
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'polygon-copy-trading',
    script: './dist/polygon_fast_copy.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

    # 创建日志目录
    mkdir -p logs
fi

echo ""
echo -e "${GREEN}✅ 安装完成！${NC}"
echo ""
echo "📋 下一步："
echo "   1. 编辑 .env 文件并填入你的配置"
echo "      nano .env"
echo ""
echo "   2. 启动程序："
if command -v pm2 &> /dev/null; then
    echo "      ./start.sh"
    echo "      或: pm2 start ecosystem.config.js"
else
    echo "      ./start.sh"
    echo "      或: npm start"
fi
echo ""
echo "   3. 查看日志："
if command -v pm2 &> /dev/null; then
    echo "      pm2 logs polygon-copy-trading"
else
    echo "      查看终端输出"
fi
echo ""
echo "   4. 停止程序："
echo "      ./stop.sh"
echo ""
