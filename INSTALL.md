# 服务器一键安装指南

## 🚀 快速安装（推荐）

### 方式一：从 GitHub 克隆并安装

```bash
# 克隆项目
git clone https://github.com/119969788/gpt-poly.git
cd gpt-poly

# 一键安装
chmod +x install.sh
./install.sh
```

### 方式二：如果已经下载了项目

```bash
# 在项目目录下直接运行
chmod +x install.sh
./install.sh
```

## 📋 安装脚本功能

安装脚本会自动完成：

1. ✅ **检查 Node.js** - 如果未安装会自动安装（需要 18+）
2. ✅ **安装依赖** - 自动运行 `npm install`
3. ✅ **编译项目** - 自动运行 `npm run build`
4. ✅ **创建 .env 模板** - 如果不存在会自动创建
5. ✅ **安装 PM2**（可选）- 方便进程管理
6. ✅ **创建启动/停止脚本** - `start.sh` 和 `stop.sh`

## ⚙️ 配置环境变量

安装完成后，必须配置 `.env` 文件：

```bash
nano .env
```

填入你的配置：

```env
RPC_WS=wss://polygon-mainnet.g.alchemy.com/v2/你的KEY
RPC_HTTP=https://polygon-mainnet.g.alchemy.com/v2/你的KEY
PRIVATE_KEY=你的私钥
TARGET=0xe00740bce98a594e26861838885ab310ec3b548c
```

## 🎯 启动程序

### 使用 PM2（推荐，后台运行）

```bash
./start.sh
```

或手动：

```bash
pm2 start ecosystem.config.js
pm2 logs polygon-copy-trading
```

**PM2 常用命令：**

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs polygon-copy-trading

# 停止
pm2 stop polygon-copy-trading

# 重启
pm2 restart polygon-copy-trading

# 查看详细信息
pm2 info polygon-copy-trading

# 设置开机自启
pm2 startup
pm2 save
```

### 直接运行（前台运行）

```bash
npm start
```

## 🛑 停止程序

```bash
./stop.sh
```

或手动：

```bash
# PM2
pm2 stop polygon-copy-trading

# 直接运行
Ctrl+C
```

## 📊 查看日志

### PM2 日志

```bash
# 实时日志
pm2 logs polygon-copy-trading

# 查看最后 100 行
pm2 logs polygon-copy-trading --lines 100

# 清空日志
pm2 flush
```

### 日志文件位置

- PM2 日志：`./logs/out.log` 和 `./logs/err.log`
- 终端输出：直接运行时会显示在终端

## 🔄 更新程序

```bash
# 拉取最新代码
git pull

# 重新安装依赖（如果有新增）
npm install

# 重新编译
npm run build

# 重启程序
pm2 restart polygon-copy-trading
```

## ❓ 常见问题

### 1. 安装失败：Node.js 版本过低

**解决：** 手动安装 Node.js 18+

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node -v
```

### 2. 权限错误：Permission denied

**解决：** 给脚本添加执行权限

```bash
chmod +x install.sh start.sh stop.sh
```

### 3. PM2 命令不存在

**解决：** 全局安装 PM2

```bash
sudo npm install -g pm2
```

### 4. 编译失败：TypeScript 错误

**解决：** 检查 TypeScript 版本和依赖

```bash
npm install
npm run build
```

### 5. 运行失败：找不到 .env

**解决：** 确保 `.env` 文件存在且配置正确

```bash
ls -la .env
cat .env
```

## 🛡️ 服务器安全建议

1. **私钥安全**
   - 不要将 `.env` 文件提交到 Git
   - 设置 `.env` 文件权限：`chmod 600 .env`
   - 使用环境变量而非文件（如果可能）

2. **防火墙配置**
   - 确保服务器端口安全
   - 限制 SSH 访问

3. **监控和告警**
   - 使用 PM2 监控进程状态
   - 设置日志轮转
   - 考虑添加异常告警

## 📞 需要帮助？

如果遇到问题：

1. 查看日志文件：`./logs/err.log`
2. 检查 `.env` 配置是否正确
3. 确认 RPC 节点可用性
4. 验证钱包余额

## 📄 相关文档

- [README.md](./README.md) - 完整使用说明
- [ENV_SETUP.md](./ENV_SETUP.md) - 环境变量配置详解
