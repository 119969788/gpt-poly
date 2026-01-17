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

// ===== WebSocket 连接状态监听（ethers v6 正确方式）=====
// 方法一：直接监听 WS 底层事件（最可靠）
try {
  const ws = (wsProvider as any).websocket || (wsProvider as any)._websocket;
  if (ws) {
    // 尝试多种方式访问 WebSocket 事件
    if (typeof (ws as any).onopen !== 'undefined') {
      (ws as any).onopen = () => {
        console.log("✅ WS connected (WebSocket 已连接)");
      };
    } else if (typeof ws.addEventListener === 'function') {
      ws.addEventListener("open", () => {
        console.log("✅ WS connected (WebSocket 已连接)");
      });
    } else if (typeof (ws as any).on === 'function') {
      (ws as any).on("open", () => {
        console.log("✅ WS connected (WebSocket 已连接)");
      });
    }

    if (typeof (ws as any).onclose !== 'undefined') {
      (ws as any).onclose = (e: any) => {
        console.log(`⚠️  WS closed (WebSocket 已关闭) - Code: ${e?.code || 'unknown'}, Reason: ${e?.reason || "无"}`);
      };
    } else if (typeof ws.addEventListener === 'function') {
      ws.addEventListener("close", (e: any) => {
        console.log(`⚠️  WS closed (WebSocket 已关闭) - Code: ${e?.code || 'unknown'}`);
      });
    } else if (typeof (ws as any).on === 'function') {
      (ws as any).on("close", (code: number) => {
        console.log(`⚠️  WS closed (WebSocket 已关闭) - Code: ${code}`);
      });
    }

    if (typeof (ws as any).onerror !== 'undefined') {
      (ws as any).onerror = (e: any) => {
        console.error("❌ WS error (WebSocket 错误):", e?.message || e);
      };
    } else if (typeof ws.addEventListener === 'function') {
      ws.addEventListener("error", (e: any) => {
        console.error("❌ WS error (WebSocket 错误):", e?.message || e);
      });
    } else if (typeof (ws as any).on === 'function') {
      (ws as any).on("error", (err: Error) => {
        console.error("❌ WS error (WebSocket 错误):", err.message);
      });
    }
  } else {
    console.log("⚠️  无法访问 WebSocket 对象，将使用区块监听验证连接");
  }
} catch (err: any) {
  console.log(`⚠️  WebSocket 事件监听设置失败: ${err.message}，将使用区块监听验证连接`);
}

// 防止重复跟单
const seen = new Set<string>();

// 统计计数器
let pendingCount = 0;
let blockCount = 0;
let targetTxCount = 0;
let copyTxCount = 0;

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

// ===== 方法二：区块监听（活性检测 - 最简单可靠）=====
// 能收到新区块 = WS 100% 正常
// Polygon 每 ~2 秒一次
wsProvider.on("block", (blockNumber: number) => {
  blockCount++;
  if (blockCount <= 3 || blockCount % 10 === 0) {
    console.log(`🧱 new block (新区块): ${blockNumber} (累计: ${blockCount})`);
  }
  
  // 如果 10 秒内没有新区块，说明可能有问题
  if (blockCount === 1) {
    console.log("✅ 区块监听正常，WebSocket 连接和订阅 OK");
  }
});

// 定期输出统计信息（方法三的补充）
setInterval(() => {
  console.log(`\n📊 统计信息 (运行中...):`);
  console.log(`   - Pending 交易数: ${pendingCount}`);
  console.log(`   - 新区块数: ${blockCount}`);
  console.log(`   - 目标地址交易: ${targetTxCount}`);
  console.log(`   - 成功跟单数: ${copyTxCount}`);
  
  // 诊断信息
  if (pendingCount === 0 && blockCount > 0) {
    console.log(`   ⚠️  警告: Pending 计数为 0，但区块正常 → 可能节点不支持 mempool`);
  } else if (pendingCount === 0 && blockCount === 0) {
    console.log(`   ❌ 错误: 既没有 Pending 也没有区块 → WebSocket 连接或订阅失败`);
  } else if (pendingCount > 0) {
    console.log(`   ✅ Pending 监听正常`);
  }
  console.log("");
}, 5000); // 每5秒输出一次（更频繁，便于诊断）

// ===== 方法三：检查是否真的在订阅 mempool (pending) =====
// 这个直接决定"为什么没有跟单"
wsProvider.on("pending", async (hash: string) => {
  pendingCount++;
  
  // 每 50 个 pending 输出一次（验证是否真的在监听）
  if (pendingCount % 50 === 0) {
    console.log(`⏳ pending tx seen (Pending 交易计数): ${pendingCount}`);
  }

  try {
    // ===== 重试机制：pending tx 可能一开始查不到 =====
    let tx: ethers.TransactionResponse | null = null;
    let retries = 3;
    let retryDelay = 100; // 100ms
    
    while (retries > 0 && !tx) {
      try {
        tx = await wsProvider.getTransaction(hash);
        if (tx) break;
      } catch (e) {
        // 忽略错误，继续重试
      }
      
      if (!tx && retries > 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // 指数退避
      }
      retries--;
    }

    // 如果还是查不到，跳过
    if (!tx) return;

    // 基本验证
    if (!tx.from || !tx.to || !tx.data) return;

    // ===== 过滤：只监听目标地址发出的交易 =====
    if (tx.from.toLowerCase() !== TARGET) return;

    targetTxCount++;
    console.log(`\n🎯 发现目标地址交易!`);
    console.log(`   Hash: ${tx.hash}`);
    console.log(`   From: ${tx.from}`);
    console.log(`   To: ${tx.to}`);
    console.log(`   Value: ${ethers.formatEther(tx.value || 0n)} MATIC`);
    console.log(`   Data: ${tx.data.substring(0, 20)}...`);

    // 防重
    if (seen.has(tx.hash)) {
      console.log(`   ⚠️  已处理过，跳过`);
      return;
    }
    seen.add(tx.hash);

    // ===== Gas 策略（比他高）=====
    // 处理 EIP-1559 和传统 gas 价格
    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;
    let gasPrice: bigint | undefined;

    if (tx.maxFeePerGas && tx.maxPriorityFeePerGas) {
      // EIP-1559 交易
      maxFeePerGas = tx.maxFeePerGas * 105n / 100n; // 高 5%
      maxPriorityFeePerGas = tx.maxPriorityFeePerGas * 120n / 100n; // 高 20%
      console.log(`   💸 Gas (EIP-1559): maxFee=${ethers.formatUnits(maxFeePerGas, "gwei")} gwei, priority=${ethers.formatUnits(maxPriorityFeePerGas, "gwei")} gwei`);
    } else if (tx.gasPrice) {
      // 传统交易
      gasPrice = tx.gasPrice * 110n / 100n; // 高 10%
      console.log(`   💸 Gas (Legacy): ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
    } else {
      // 如果没有 gas 信息，使用当前网络建议值
      const feeData = await httpProvider.getFeeData();
      maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas * 110n / 100n : undefined;
      maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas * 120n / 100n : undefined;
      console.log(`   💸 Gas (自动): maxFee=${maxFeePerGas ? ethers.formatUnits(maxFeePerGas, "gwei") : "auto"} gwei`);
    }

    // ===== 关键：直接复刻 calldata =====
    console.log(`   🔄 正在构建跟单交易...`);
    
    const followTx = await wallet.sendTransaction({
      to: tx.to,
      data: tx.data,     // 完整复制 calldata
      value: tx.value ?? 0n,
      gasLimit: tx.gasLimit ? tx.gasLimit * 120n / 100n : 600_000n, // 留 20% 余量
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasPrice
    });

    copyTxCount++;
    console.log(`\n✅ 跟单交易已发送!`);
    console.log(`   📊 目标交易: ${tx.hash}`);
    console.log(`   📊 跟单交易: ${followTx.hash}`);
    console.log(`   💸 Gas: ${maxFeePerGas ? ethers.formatUnits(maxFeePerGas, "gwei") : gasPrice ? ethers.formatUnits(gasPrice, "gwei") : "auto"} gwei`);
    console.log(`   ⏱️  时间: ${new Date().toLocaleTimeString()}\n`);

  } catch (err: any) {
    // 详细错误处理
    if (err.code === "UNPREDICTABLE_GAS_LIMIT") {
      // Gas 估算失败，可能是合约调用问题，静默忽略
      return;
    } else if (err.message?.includes("replacement") || err.message?.includes("nonce")) {
      // Nonce 冲突，静默忽略
      return;
    } else if (err.message?.includes("insufficient funds")) {
      console.error(`❌ 跟单失败: 余额不足`);
    } else {
      console.error(`❌ 跟单失败: ${err.message}`);
      if (err.code) console.error(`   错误代码: ${err.code}`);
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
