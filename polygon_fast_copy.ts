import { ethers } from "ethers";
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

// ===== 环境变量验证 =====
function validateEnv() {
  const errors: string[] = [];
  
  // 检查 .env 文件是否存在
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error("❌ 错误: 未找到 .env 文件");
    console.error("   请创建 .env 文件并配置以下变量:");
    console.error("   RPC_WS, RPC_HTTP, PRIVATE_KEY, TARGET");
    process.exit(1);
  }

  // 验证必需的环境变量
  const RPC_WS = process.env.RPC_WS;
  const RPC_HTTP = process.env.RPC_HTTP;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const TARGET = process.env.TARGET;

  if (!RPC_WS || RPC_WS.includes("你的KEY") || RPC_WS.trim() === "") {
    errors.push("❌ RPC_WS 未配置或配置错误（请填入完整的 WebSocket RPC URL）");
  } else if (!RPC_WS.startsWith("wss://")) {
    errors.push("❌ RPC_WS 格式错误（必须以 wss:// 开头）");
  }

  if (!RPC_HTTP || RPC_HTTP.includes("你的KEY") || RPC_HTTP.trim() === "") {
    errors.push("❌ RPC_HTTP 未配置或配置错误（请填入完整的 HTTP RPC URL）");
  } else if (!RPC_HTTP.startsWith("https://")) {
    errors.push("❌ RPC_HTTP 格式错误（必须以 https:// 开头）");
  }

  if (!PRIVATE_KEY || PRIVATE_KEY.includes("你的私钥") || PRIVATE_KEY.trim() === "") {
    errors.push("❌ PRIVATE_KEY 未配置或配置错误（请填入钱包私钥）");
  } else if (!PRIVATE_KEY.startsWith("0x") || PRIVATE_KEY.length !== 66) {
    errors.push("❌ PRIVATE_KEY 格式错误（应该是 0x 开头的 66 位十六进制字符串）");
  }

  if (!TARGET || TARGET.trim() === "") {
    errors.push("❌ TARGET 未配置或配置错误（请填入目标跟单地址）");
  } else if (!TARGET.startsWith("0x") || TARGET.length !== 42) {
    errors.push("❌ TARGET 格式错误（应该是 0x 开头的 42 位地址）");
  }

  if (errors.length > 0) {
    console.error("\n⚠️  环境变量配置错误:\n");
    errors.forEach(err => console.error(`   ${err}`));
    console.error("\n📝 请检查 .env 文件，确保所有配置都已正确填写");
    console.error("   参考 ENV_SETUP.md 获取详细配置说明\n");
    process.exit(1);
  }

  return {
    RPC_WS: RPC_WS!,
    RPC_HTTP: RPC_HTTP!,
    PRIVATE_KEY: PRIVATE_KEY!,
    TARGET: TARGET!.toLowerCase()
  };
}

// ===== 配置 =====
const config = validateEnv();
const { RPC_WS, RPC_HTTP, PRIVATE_KEY, TARGET } = config;

console.log("✅ 环境变量验证通过");
console.log(`   RPC_WS: ${RPC_WS.substring(0, 30)}...`);
console.log(`   RPC_HTTP: ${RPC_HTTP.substring(0, 30)}...`);
console.log(`   TARGET: ${TARGET}\n`);

// ===== Provider =====
let wsProvider: ethers.WebSocketProvider;
let httpProvider: ethers.JsonRpcProvider;
let wallet: ethers.Wallet;

try {
  wsProvider = new ethers.WebSocketProvider(RPC_WS);
  httpProvider = new ethers.JsonRpcProvider(RPC_HTTP);
  wallet = new ethers.Wallet(PRIVATE_KEY, httpProvider);
} catch (error: any) {
  console.error("❌ 初始化 Provider 失败:", error.message);
  if (error.code === "EAI_AGAIN" || error.message.includes("getaddrinfo")) {
    console.error("\n💡 可能的原因:");
    console.error("   1. RPC_WS 或 RPC_HTTP URL 格式错误");
    console.error("   2. 网络连接问题");
    console.error("   3. RPC 节点服务不可用");
    console.error("\n   请检查 .env 文件中的 RPC 配置是否正确");
  }
  process.exit(1);
}

// 防止重复跟单
const seen = new Set<string>();

console.log("🚀 Polygon mempool copy-trading started…");
console.log(`👀 监听地址: ${TARGET}`);
console.log(`💰 跟单钱包: ${wallet.address}`);
console.log("");

// 测试连接
(async () => {
  try {
    const blockNumber = await httpProvider.getBlockNumber();
    console.log(`✅ HTTP RPC 连接成功，当前区块: ${blockNumber}`);
  } catch (error: any) {
    console.error("❌ HTTP RPC 连接失败:", error.message);
    console.error("   请检查 RPC_HTTP 配置是否正确");
    process.exit(1);
  }
})();

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
wsProvider.on("error", (error: any) => {
  console.error("⚠️  WebSocket 错误:", error.message);
  if (error.code === "EAI_AGAIN" || error.message.includes("getaddrinfo")) {
    console.error("\n💡 WebSocket 连接失败，可能的原因:");
    console.error("   1. RPC_WS URL 格式错误或未正确配置");
    console.error("   2. 网络连接问题");
    console.error("   3. RPC 节点服务不可用");
    console.error("\n   当前 RPC_WS 值:", RPC_WS);
    console.error("   请检查 .env 文件中的 RPC_WS 配置");
  }
});

// 优雅退出
process.on("SIGINT", () => {
  console.log("\n⏹️  正在关闭...");
  wsProvider.destroy();
  process.exit(0);
});
