# 故障排查指南

## 问题：找不到 check-config.js

### 原因
服务器上的代码可能没有更新到最新版本。

### 解决方案

#### 方法一：更新代码（推荐）

```bash
# 在服务器上执行
cd /root/gpt-poly
git pull origin main
```

然后就可以使用：
```bash
npm run check
```

#### 方法二：直接运行程序（程序会自动检查配置）

程序本身已经内置了环境变量验证，直接运行会告诉你配置哪里有问题：

```bash
npm start
```

如果配置错误，会看到详细的错误提示，例如：

```
⚠️  环境变量配置错误:

   ❌ RPC_WS 未配置或配置错误（请填入完整的 WebSocket RPC URL）
   ❌ RPC_HTTP 未配置或配置错误（请填入完整的 HTTP RPC URL）

📝 请检查 .env 文件，确保所有配置都已正确填写
```

#### 方法三：手动检查 .env 文件

```bash
# 查看 .env 文件内容
cat .env
```

确保格式正确：

```env
# ✅ 正确格式
RPC_WS=wss://polygon-mainnet.g.alchemy.com/v2/YOUR_ACTUAL_KEY
RPC_HTTP=https://polygon-mainnet.g.alchemy.com/v2/YOUR_ACTUAL_KEY
PRIVATE_KEY=0x你的真实私钥（66位，0x开头）
TARGET=0xe00740bce98a594e26861838885ab310ec3b548c
```

**检查要点：**
- ✅ `RPC_WS` 必须以 `wss://` 开头
- ✅ `RPC_HTTP` 必须以 `https://` 开头
- ✅ 不能包含 "你的KEY" 或 "你的私钥" 等模板文字
- ✅ `PRIVATE_KEY` 必须是 0x 开头的 66 位字符串
- ✅ `TARGET` 必须是 0x 开头的 42 位地址

## 常见错误及解决方法

### 错误 1: getaddrinfo EAI_AGAIN wss

**原因：** RPC_WS 或 RPC_HTTP 配置错误

**解决：**
1. 检查 `.env` 文件中的 RPC URL 是否正确
2. 确保替换了所有 "你的KEY" 为真实的 API Key
3. 确保 URL 格式正确（wss:// 和 https://）

### 错误 2: Cannot find module 'check-config.js'

**原因：** 代码未更新

**解决：**
```bash
git pull origin main
```

或者直接运行程序，程序会自动检查配置。

### 错误 3: 环境变量未配置

**原因：** `.env` 文件不存在或配置不完整

**解决：**
1. 创建 `.env` 文件
2. 参考 `ENV_SETUP.md` 填写配置
3. 确保所有变量都已正确填写

## 快速验证配置

最简单的方法就是直接运行程序：

```bash
npm start
```

程序会在启动时自动验证所有配置，如果有问题会显示详细的错误信息。
