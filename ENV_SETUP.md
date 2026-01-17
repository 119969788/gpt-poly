# 环境变量配置说明

## 创建 `.env` 文件

在项目根目录创建 `.env` 文件（不要提交到 Git），内容如下：

```env
# Polygon RPC 节点配置（必须使用私有节点，否则会慢）
# 推荐：Alchemy / Infura / QuickNode
RPC_WS=wss://polygon-mainnet.g.alchemy.com/v2/你的KEY
RPC_HTTP=https://polygon-mainnet.g.alchemy.com/v2/你的KEY

# 跟单钱包私钥（不要泄露！）
PRIVATE_KEY=你的私钥

# 目标跟单地址（Trader）
TARGET=0xe00740bce98a594e26861838885ab310ec3b548c
```

## 如何获取 RPC 节点

### Alchemy（推荐）
1. 访问 https://www.alchemy.com/
2. 创建账户并创建 Polygon 应用
3. 复制 WebSocket 和 HTTP 端点

### Infura
1. 访问 https://www.infura.io/
2. 创建账户并创建 Polygon 项目
3. 获取 WebSocket 和 HTTP URL

### QuickNode
1. 访问 https://www.quicknode.com/
2. 创建 Polygon 端点
3. 复制 WebSocket 和 HTTP URL

## 注意事项

⚠️ **必须使用私有 RPC 节点**，公共节点会慢很多，无法实现快速跟单！

⚠️ **私钥安全**：不要泄露 `.env` 文件，不要提交到版本控制！
