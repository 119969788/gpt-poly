# 快速修复：缺少 check 脚本

## 问题
运行 `npm run check` 时提示 "Missing script: check"

## 解决方案

### 方法一：更新代码（推荐）

如果你在服务器上，需要先拉取最新代码：

```bash
# 拉取最新代码
git pull origin main

# 现在可以运行
npm run check
```

### 方法二：直接运行脚本

如果 `check-config.js` 文件存在，可以直接运行：

```bash
node check-config.js
```

### 方法三：手动添加脚本

如果 `package.json` 中没有 `check` 脚本，可以手动添加：

编辑 `package.json`，在 `scripts` 部分添加：

```json
"scripts": {
  "build": "tsc",
  "start": "node dist/polygon_fast_copy.js",
  "dev": "ts-node polygon_fast_copy.ts",
  "check": "node check-config.js"
}
```

然后运行：

```bash
npm run check
```

## 检查配置的替代方法

如果脚本不可用，可以手动检查 `.env` 文件：

```bash
# 查看 .env 文件
cat .env

# 或编辑
nano .env
```

确保配置格式正确：

```env
RPC_WS=wss://polygon-mainnet.g.alchemy.com/v2/你的真实KEY
RPC_HTTP=https://polygon-mainnet.g.alchemy.com/v2/你的真实KEY
PRIVATE_KEY=你的真实私钥（0x开头，66位）
TARGET=0xe00740bce98a594e26861838885ab310ec3b548c
```

## 验证配置是否正确

配置检查要点：

1. ✅ `RPC_WS` 必须以 `wss://` 开头
2. ✅ `RPC_HTTP` 必须以 `https://` 开头  
3. ✅ 不能包含 "你的KEY" 等模板文字
4. ✅ `PRIVATE_KEY` 必须是 0x 开头的 66 位字符串
5. ✅ `TARGET` 必须是 0x 开头的 42 位地址
