#!/usr/bin/env node

// 配置检查脚本
const fs = require("fs");
const path = require("path");

console.log("🔍 检查配置文件...\n");

// 检查 .env 文件
const envPath = path.join(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  console.error("❌ 未找到 .env 文件");
  console.error("   请创建 .env 文件并配置环境变量");
  process.exit(1);
}

console.log("✅ .env 文件存在");

// 读取并解析 .env 文件
require("dotenv").config();

const config = {
  RPC_WS: process.env.RPC_WS,
  RPC_HTTP: process.env.RPC_HTTP,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  TARGET: process.env.TARGET
};

console.log("\n📋 当前配置:\n");

// 检查 RPC_WS
console.log("RPC_WS:");
if (!config.RPC_WS) {
  console.error("   ❌ 未配置");
} else if (config.RPC_WS.includes("你的KEY")) {
  console.error("   ❌ 还是模板值，请填入真实的 RPC URL");
  console.error(`   当前值: ${config.RPC_WS.substring(0, 50)}...`);
} else if (!config.RPC_WS.startsWith("wss://")) {
  console.error("   ❌ 格式错误（应该以 wss:// 开头）");
  console.error(`   当前值: ${config.RPC_WS.substring(0, 50)}...`);
} else {
  console.log(`   ✅ ${config.RPC_WS.substring(0, 50)}...`);
}

// 检查 RPC_HTTP
console.log("\nRPC_HTTP:");
if (!config.RPC_HTTP) {
  console.error("   ❌ 未配置");
} else if (config.RPC_HTTP.includes("你的KEY")) {
  console.error("   ❌ 还是模板值，请填入真实的 RPC URL");
  console.error(`   当前值: ${config.RPC_HTTP.substring(0, 50)}...`);
} else if (!config.RPC_HTTP.startsWith("https://")) {
  console.error("   ❌ 格式错误（应该以 https:// 开头）");
  console.error(`   当前值: ${config.RPC_HTTP.substring(0, 50)}...`);
} else {
  console.log(`   ✅ ${config.RPC_HTTP.substring(0, 50)}...`);
}

// 检查 PRIVATE_KEY
console.log("\nPRIVATE_KEY:");
if (!config.PRIVATE_KEY) {
  console.error("   ❌ 未配置");
} else if (config.PRIVATE_KEY.includes("你的私钥")) {
  console.error("   ❌ 还是模板值，请填入真实的私钥");
} else if (!config.PRIVATE_KEY.startsWith("0x") || config.PRIVATE_KEY.length !== 66) {
  console.error("   ❌ 格式错误（应该是 0x 开头的 66 位字符串）");
  console.error(`   当前长度: ${config.PRIVATE_KEY.length}`);
} else {
  console.log(`   ✅ 已配置（长度: ${config.PRIVATE_KEY.length}）`);
}

// 检查 TARGET
console.log("\nTARGET:");
if (!config.TARGET) {
  console.error("   ❌ 未配置");
} else if (!config.TARGET.startsWith("0x") || config.TARGET.length !== 42) {
  console.error("   ❌ 格式错误（应该是 0x 开头的 42 位地址）");
  console.error(`   当前值: ${config.TARGET}`);
} else {
  console.log(`   ✅ ${config.TARGET}`);
}

console.log("\n💡 提示:");
console.log("   如果看到 ❌，请编辑 .env 文件并填入正确的配置");
console.log("   参考 ENV_SETUP.md 获取详细说明\n");
