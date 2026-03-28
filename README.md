# FlashShield

FlashShield 是一个基于 Reactive Network 的黑客松 Demo，用来展示“源链发生风险事件，目标链自动执行保护动作”的跨链自动化流程。

## 当前已完成能力

- A 链风控模拟合约会在接近清算时发出 `NearLiquidation`
- Reactive 合约真实监听 origin 事件，并向 destination 发出 callback
- B 链执行合约会把风险暴露从 `100 / 0` 切换为 `20 / 80`
- 前端页面可以连接钱包、发起 A 链动作、读取真实链上状态，并展示保护结果

## 当前有效部署

- `PositionRiskSimulator` / Ethereum Sepolia
  - `0x420dA053ECAC3FA636c5250A5735156bE51F2119`
- `ProtectionExecutor` / Base Sepolia
  - `0x980CFa7e8d3774DD2474d58b19733Cbf25C08663`
- `ReactiveProtection` / Reactive Lasna
  - `0x808783123980c7315f1d370410A2664beEa6867E`

更完整的地址、交易哈希和验证记录见：

- [部署记录.md](/home/moons/projects/FlashShield/docs/部署记录.md)

## 目录说明

- `contracts/`：Solidity 合约、测试、部署脚本
- `web/`：Next.js 前端 Demo
- `docs/`：部署说明、部署记录、演示操作手册
- [开发文档.md](/home/moons/projects/FlashShield/开发文档.md)：产品与架构说明
- [开发步骤.md](/home/moons/projects/FlashShield/开发步骤.md)：开发执行步骤

## 本地运行

### 合约

```bash
cd /home/moons/projects/FlashShield/contracts
/home/moons/.local/node-v20.20.0-linux-x64/bin/node ./node_modules/hardhat/internal/cli/cli.js compile
/home/moons/.local/node-v20.20.0-linux-x64/bin/node ./node_modules/hardhat/internal/cli/cli.js test
```

### 前端

```bash
cd /home/moons/projects/FlashShield/web
/home/moons/.local/node-v20.20.0-linux-x64/bin/node ./node_modules/next/dist/bin/next dev --hostname 0.0.0.0 --port 3000
```

## 环境变量

先从模板复制：

```bash
cp .env.example .env
```

真实私钥和 RPC 只放本地 `.env`，不要提交到 Git。

## 演示说明

推荐直接看：

- [演示操作手册.md](/home/moons/projects/FlashShield/docs/演示操作手册.md)

## 当前定位

当前仓库已经达到“可提交黑客松 Demo”的状态。  
后续如果还有时间，可以继续增强：

- 可配置保护比例
- 更强的前端交互与视觉演示
- 更真实的资金模型
