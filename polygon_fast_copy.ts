import { ethers } from "ethers";
import "dotenv/config";

// ===== 配置 =====
const RPC_WS = process.env.RPC_WS!;
const RPC_HTTP = process.env.RPC_HTTP!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const TARGET = process.env.TARGET!.toLowerCase();

// ===== Provider =====
const wsProvider = new ethers.WebSocketProvider(RPC_WS);
const httpProvider = new ethers.JsonRpcProvider(RPC_HTTP);
const wallet = new ethers.Wallet(PRIVATE_KEY, httpProvider);

// 防止重复跟单
const seen = new Set<string>();

console.log("🚀 Polygon mempool copy-trading started…");
console.log(`👀 监听地址: ${TARGET}`);
console.log(`💰 跟单钱包: ${wallet.address}`);

wsProvider.on("pending", async (hash) => {
  try {
    const tx = await wsProvider.getTransaction(hash);
    if (!tx || !tx.from || !tx.to || !tx.data) return;

    // 只监听目标地址
    if (tx.from.toLowerCase() !== TARGET) return;

    // 防重
    if (seen.has(tx.hash)) return;
    seen.add(tx.hash);

    console.log("🎯 Target pending tx:", tx.hash);

    // ===== Gas 策略（比他高）=====
    const maxFeePerGas = tx.maxFeePerGas
      ? tx.maxFeePerGas * 105n / 100n
      : undefined;

    const maxPriorityFeePerGas = tx.maxPriorityFeePerGas
      ? tx.maxPriorityFeePerGas * 120n / 100n
      : undefined;

    // ===== 关键：直接复刻 calldata =====
    const followTx = await wallet.sendTransaction({
      to: tx.to,
      data: tx.data,     // 完整复制
      value: tx.value ?? 0n,
      gasLimit: tx.gasLimit ? tx.gasLimit * 120n / 100n : 600_000n,
      maxFeePerGas,
      maxPriorityFeePerGas
    });

    console.log("✅ FOLLOW TX SENT:", followTx.hash);
    console.log(`   📊 目标交易: ${tx.hash}`);
    console.log(`   💸 Gas: ${maxFeePerGas ? ethers.formatUnits(maxFeePerGas, "gwei") : "auto"} gwei`);

  } catch (err: any) {
    // WS 偶发错误直接忽略
    if (err.code !== "UNPREDICTABLE_GAS_LIMIT" && err.message?.includes("replacement")) {
      console.error("❌ 跟单失败:", err.message);
    }
  }
});

// 错误处理
wsProvider.on("error", (error) => {
  console.error("⚠️  WebSocket 错误:", error.message);
});

// 优雅退出
process.on("SIGINT", () => {
  console.log("\n⏹️  正在关闭...");
  wsProvider.destroy();
  process.exit(0);
});
