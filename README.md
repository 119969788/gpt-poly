# Polygon 快速跟单程序

这是一个针对 Polygon 链的 mempool 级别跟单程序，通过监听目标地址的 pending 交易，直接复制 calldata 实现快速跟单。

## ⚡ 核心特性

- ✅ **监听 mempool（pending）** - 不等区块确认，最快速度
- ✅ **直接复刻 calldata** - 不重新计算参数，零延迟
- ✅ **HTTP 发送交易** - 使用私有 RPC 节点，gas 略高于目标
- ❌ **不等区块确认** - 极致速度优化
- ❌ **不看网页/API** - 直接监听链上数据

## 📋 前置条件

### 1️⃣ 必须提前 Approve

在使用前，你必须给相关合约提前授权：

- **USDC** 或其他代币的 approve
- **条件代币合约** 的授权（如果需要）

否则第一次跟单时会慢一次 approve 交易。

### 2️⃣ 钱包余额

确保跟单钱包有足够余额：

- **USDC** 或其他交易代币
- **MATIC**（用于 gas 费）

### 3️⃣ 私有 RPC 节点（重要！）

**必须使用私有 RPC 节点**（Alchemy / Infura / QuickNode），否则会慢于其他跟单者。

公共 RPC 会有延迟，无法实现快速跟单。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，并填入你的配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
RPC_WS=wss://polygon-mainnet.g.alchemy.com/v2/你的KEY
RPC_HTTP=https://polygon-mainnet.g.alchemy.com/v2/你的KEY
PRIVATE_KEY=你的私钥
TARGET=0xe00740bce98a594e26861838885ab310ec3b548c
```

### 3. 运行程序

**开发模式（TypeScript）：**
```bash
npm run dev
```

**生产模式（编译后）：**
```bash
npm run build
npm start
```

## 🔍 如何验证是否"跑在前面"

1. 目标地址发起交易
2. 程序输出：
   ```
   🎯 Target pending tx: 0x...
   ✅ FOLLOW TX SENT: 0x...
   ```
3. 在区块浏览器查看：
   - 两笔交易在**同一个 block**
   - 或你的交易在目标交易**前面/紧挨着**

## 📝 代码说明

### 为什么这么写？

#### 1. **WebSocket 监听 mempool**

```typescript
wsProvider.on("pending", async (hash) => {
```

- 使用 WebSocket 实时监听 pending 交易
- 比轮询 API 快得多
- 比等待区块确认快得多

#### 2. **直接复制 calldata**

```typescript
data: tx.data,  // 完整复制
```

- 不解析、不重新计算参数
- 零延迟，直接复制原始数据
- 保证参数完全一致

#### 3. **Gas 策略**

```typescript
maxFeePerGas * 105n / 100n      // 比目标高 5%
maxPriorityFeePerGas * 120n / 100n  // priority fee 高 20%
```

- 略高于目标交易，确保被优先打包
- 使用目标的 gas 参数作为基准，避免过高或过低

#### 4. **HTTP Provider 发送交易**

```typescript
const httpProvider = new ethers.JsonRpcProvider(RPC_HTTP);
const wallet = new ethers.Wallet(PRIVATE_KEY, httpProvider);
```

- 发送交易用 HTTP（更稳定）
- 监听用 WebSocket（更实时）
- 使用私有节点，延迟最低

## ⚙️ 只需要改的地方

### 1. **环境变量**（`.env` 文件）

```env
RPC_WS=wss://你的节点
RPC_HTTP=https://你的节点
PRIVATE_KEY=你的私钥
TARGET=目标地址
```

### 2. **Gas 倍数调整**（可选）

如果需要更激进的 gas 策略，修改：

```typescript
// 当前：5% / 20%
maxFeePerGas * 105n / 100n
maxPriorityFeePerGas * 120n / 100n

// 改为：10% / 30%
maxFeePerGas * 110n / 100n
maxPriorityFeePerGas * 130n / 100n
```

### 3. **Gas Limit 倍数**（可选）

```typescript
gasLimit: tx.gasLimit ? tx.gasLimit * 120n / 100n : 600_000n
```

当前是 120%（留 20% 余量），可以根据需要调整。

### 4. **过滤特定交易类型**（扩展）

如果需要只跟某些交易，可以添加：

```typescript
// 过滤掉 redeem / close 等
if (tx.data.startsWith("0x...")) {
  return; // 跳过
}
```

## ⚠️ 注意事项

### ❌ 不要跟这些交易

- `redeem` - 可能会失败（状态已变）
- `claim` - 可能会有权限问题
- `closePosition` - 状态可能不同步

### 🔒 安全提示

- **私钥安全**：不要泄露 `.env` 文件，不要提交到 Git
- **余额监控**：确保钱包有足够余额
- **测试环境**：先在测试网验证

## 🎯 示例交易分析

示例交易 hash：`0x88d7af87e9b92d574fcb73060303ee68b706650e4d47cc51b8f2aa19c7bb3801`

这是用于验证和测试的目标交易。你可以：

1. 在 [PolygonScan](https://polygonscan.com) 查看这笔交易
2. 分析它的 `calldata` 和参数
3. 确认它调用的合约和方法

## 🔄 下一步优化方向

如果需要更进一步，可以考虑：

- 🔍 **自动解析 tx.data** - 只在 buy/sell 时跟单
- 🧠 **按比例跟单** - 0.5x / 2x 倍数
- 🛑 **失败自动止损** - 检测到失败时自动处理
- 🤖 **多地址监听** - 同时监听多个交易员
- ⚡ **Flashbots / 私有内存池** - 更高级的抢跑方案

## 📞 问题排查

### 问题：没有检测到交易

- 检查 WebSocket 连接是否正常
- 确认目标地址是否正确
- 检查 RPC 节点是否可用

### 问题：跟单失败

- 检查是否有足够的 approve
- 检查钱包余额是否充足
- 检查 gas 是否设置合理

### 问题：交易太慢

- 确认使用的是私有 RPC 节点
- 尝试提高 gas 倍数
- 检查网络连接质量

## 📄 License

MIT
