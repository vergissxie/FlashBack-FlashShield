# FlashShield

FlashShield 是一个基于 Reactive Network 的黑客松 Demo，用来展示“源链发生风险事件，目标链自动执行保护动作”的跨链自动化流程。

## 当前已完成能力

- A 链风控模拟合约会在接近清算时发出 `NearLiquidation`
- Reactive 合约真实监听 origin 事件，并向 destination 发出 callback
- B 链执行合约会根据 `collateralValue / triggerPrice / targetPrice / contractMultiplier` 计算 `hedgeSize`
- B 链执行结果以 `mock short` 语义落链，而不是固定 `20 / 80` 切仓
- 前端页面可以连接钱包、发起 A 链动作、读取真实链上状态，并展示对冲结果

## 当前有效部署

- `PositionRiskSimulator` / Ethereum Sepolia
  - `0xc61465d293a4F7EaA11535bB805AF6447b932298`
- `ProtectionExecutor` / Base Sepolia
  - `0xE5181de9751b82C86ce1f5D5bd2F7B183e8cBd37`
- `ReactiveProtection` / Reactive Lasna
  - `0x2Fb3e3f539B06940Fb37d5258dD409d36B959Bb9`

更完整的地址、交易哈希和验证记录见：

- [部署记录.md](docs/部署记录.md)

## 目录说明

- `contracts/`：Solidity 合约、测试、部署脚本
- `web/`：Next.js 前端 Demo
- `docs/`：部署说明、部署记录、演示操作手册、项目逻辑说明、本地复刻指南
- [开发文档.md](开发文档.md)：产品与架构说明
- [开发步骤.md](开发步骤.md)：开发执行步骤
- [项目逻辑说明.md](docs/项目逻辑说明.md)：帮助快速理解系统当前能做什么、链路如何成立、当前边界是什么
- [本地复刻指南.md](docs/本地复刻指南.md)：从拉取仓库到本地启动、测试和演示的完整命令步骤

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

- [演示操作手册.md](docs/演示操作手册.md)
- [项目逻辑说明.md](docs/项目逻辑说明.md)
- [本地复刻指南.md](docs/本地复刻指南.md)

## 当前定位

当前仓库已经达到“可提交黑客松 Demo”的状态。  
后续如果还有时间，可以继续增强：

- GMX / 真实永续协议接入
- 更真实的价格源与健康度模型
- 完整自动恢复 / 买回路径
