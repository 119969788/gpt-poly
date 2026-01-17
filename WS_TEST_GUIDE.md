# WebSocket 连接测试指南

## ✅ 方法一：直接监听 WS 底层事件（最重要）

这是判断"有没有连上"唯一靠谱的方法。

### ethers v6 正确方式

```typescript
const provider = new ethers.WebSocketProvider(process.env.RPC_WS);

provider.websocket.onopen = () => {
  console.log("✅ WS connected");
};

provider.websocket.onclose = (e) => {
  console.log("⚠️ WS closed", e.code, e.reason);
};

provider.websocket.onerror = (e) => {
  console.log("❌ WS error", e);
};
```

**已在代码中实现** ✅

## ✅ 方法二：区块监听（活性检测）

能收到新区块 = WS 100% 正常

```typescript
provider.on("block", (bn) => {
  console.log("🧱 new block:", bn);
});
```

**判断标准：**
- ✅ 有输出（每 ~2 秒一次，Polygon）→ WS 连接 + 订阅 OK
- ❌ 完全没输出 → WS 根本没连 or 订阅失败

**已在代码中实现** ✅

## ✅ 方法三：检查是否真的在订阅 mempool (pending)

这个直接决定"为什么没有跟单"

```typescript
let pending = 0;

provider.on("pending", (hash) => {
  pending++;
  if (pending % 50 === 0) {
    console.log("⏳ pending tx seen:", pending);
  }
});

setInterval(() => {
  console.log("pending count:", pending);
}, 5000);
```

**判断标准：**
- ✅ 有增长 → 可以继续查 getTransaction
- ❌ 一直是 0 → 你的 WS / 节点 没提供 mempool

**已在代码中实现** ✅

## ✅ 方法四：绕过 ethers，直接测 QuickNode WS 能力（非常关键）

这一步可以排除"是你代码问题还是节点能力问题"。

### 安装 wscat

```bash
npm i -g wscat
```

### 连接你的 QuickNode WebSocket

```bash
wscat -c "wss://你的-quicknode-url/你的-key"
```

例如：
```bash
wscat -c "wss://shy-shy-pool.matic.quiknode.pro/ed174d2f0e75db5ac5d6752eac39b9ff7d85cbe1"
```

### 测试 1：订阅新区块（验证 WS 基本功能）

连上后发送（复制粘贴）：

```json
{"jsonrpc":"2.0","id":1,"method":"eth_subscribe","params":["newHeads"]}
```

**预期结果：**
- ✅ 如果能不断收到新区块推送 → WS OK，节点正常
- ❌ 如果没任何响应 → WS 连接或节点有问题

**示例响应：**
```json
{"jsonrpc":"2.0","id":1,"result":"0x..."}
{"jsonrpc":"2.0","method":"eth_subscription","params":{"subscription":"0x...","result":{"number":"0x..."}}}
```

### 测试 2：订阅 Mempool (Pending Transactions)

发送：

```json
{"jsonrpc":"2.0","id":2,"method":"eth_subscribe","params":["newPendingTransactions"]}
```

**预期结果：**
- ✅ 有 hash 推送（不断收到交易 hash）→ 节点支持 mempool，代码层面问题
- ❌ 没任何推送 / 报错 → 节点不支持 mempool 或权限受限

**示例响应（如果支持）：**
```json
{"jsonrpc":"2.0","id":2,"result":"0x..."}
{"jsonrpc":"2.0","method":"eth_subscription","params":{"subscription":"0x...","result":"0x88d7af87e9b92d574fcb73060303ee68b706650e4d47cc51b8f2aa19c7bb3801"}}
{"jsonrpc":"2.0","method":"eth_subscription","params":{"subscription":"0x...","result":"0x..."}}
```

### 测试 3：取消订阅

```json
{"jsonrpc":"2.0","id":3,"method":"eth_unsubscribe","params":["0x..."]}
```

（使用订阅时返回的 subscription ID）

## 🔍 诊断流程

### 步骤 1：测试 WebSocket 基本连接

```bash
wscat -c "你的-RPC_WS-URL"
```

如果连接失败：
- ❌ 检查 URL 是否正确
- ❌ 检查网络连接
- ❌ 检查节点服务是否可用

### 步骤 2：测试新区块订阅

发送 `eth_subscribe` newHeads

如果没响应：
- ❌ WebSocket 连接有问题
- ❌ 节点不支持订阅

如果有响应：
- ✅ WebSocket 连接正常
- ✅ 继续测试 mempool

### 步骤 3：测试 Mempool 订阅

发送 `eth_subscribe` newPendingTransactions

如果没响应：
- ⚠️ 节点不支持 mempool（常见）
- ⚠️ 需要升级节点套餐
- ⚠️ 需要检查节点配置

如果有响应：
- ✅ 节点支持 mempool
- ✅ 问题在代码层面（检查 ethers 实现）

## 📋 常见节点对 Mempool 的支持情况

| 节点服务 | 免费套餐 | 付费套餐 | 备注 |
|---------|---------|---------|------|
| QuickNode | ❌ 通常不支持 | ✅ 支持 | 需要 Growth 或更高 |
| Alchemy | ❌ 不支持 | ✅ 支持 | 需要付费套餐 |
| Infura | ❌ 不支持 | ⚠️ 部分支持 | 需要企业套餐 |
| 公共 RPC | ❌ 不支持 | - | 完全不支持 |

## 💡 如果节点不支持 Mempool

如果测试发现节点不支持 `newPendingTransactions`：

1. **升级节点套餐**（推荐）
   - QuickNode: 升级到 Growth 或更高
   - Alchemy: 升级到付费套餐

2. **使用替代方案**
   - 监听区块，在区块确认时检测（会有延迟）
   - 使用多个节点，轮询检测

3. **代码调整**
   - 程序会自动降级到区块监听
   - 但会失去 mempool 级别的速度优势

## 🎯 完整测试流程

```bash
# 1. 安装 wscat
npm i -g wscat

# 2. 连接 WebSocket
wscat -c "wss://你的-RPC_WS-URL"

# 3. 测试新区块（应该立即有响应）
{"jsonrpc":"2.0","id":1,"method":"eth_subscribe","params":["newHeads"]}

# 4. 测试 Mempool（关键测试）
{"jsonrpc":"2.0","id":2,"method":"eth_subscribe","params":["newPendingTransactions"]}

# 5. 观察输出
# - 如果有交易 hash 不断推送 → 支持 mempool ✅
# - 如果没有任何推送 → 不支持 mempool ❌
```

## 📊 判断结果对照表

| 测试项 | 结果 | 含义 |
|--------|------|------|
| WS 连接 | ✅ 成功 | WebSocket URL 正确 |
| newHeads | ✅ 有响应 | WS 订阅功能正常 |
| newHeads | ❌ 无响应 | WS 或订阅有问题 |
| newPendingTransactions | ✅ 有 hash 推送 | 节点支持 mempool |
| newPendingTransactions | ❌ 无响应 | 节点不支持 mempool |

## 🔧 如果测试失败

1. **检查 RPC URL**
   - 确保是 WebSocket URL（wss://）
   - 确保 API Key 正确

2. **检查节点套餐**
   - 查看节点服务商文档
   - 确认套餐是否支持 mempool

3. **联系节点支持**
   - 询问 mempool 订阅是否可用
   - 确认是否需要特殊配置
