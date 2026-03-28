const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PositionRiskSimulator", function () {
  async function deploySimulator() {
    const Factory = await ethers.getContractFactory("PositionRiskSimulator");
    const simulator = await Factory.deploy();
    await simulator.waitForDeployment();
    return simulator;
  }

  it("opens a position with the expected initial state", async function () {
    const simulator = await deploySimulator();
    const strategyId = ethers.encodeBytes32String("demo");

    await expect(simulator.openPosition(strategyId, 100_000n, 85_000n, 1_000_000n, 80_000n))
      .to.emit(simulator, "PositionOpened")
      .withArgs(strategyId, 100_000n, 85_000n, 1_000_000n, 80_000n);

    const position = await simulator.getPosition(strategyId);
    expect(position.entryPrice).to.equal(100_000n);
    expect(position.markPrice).to.equal(100_000n);
    expect(position.liquidationThreshold).to.equal(85_000n);
    expect(position.collateralValue).to.equal(1_000_000n);
    expect(position.targetPrice).to.equal(80_000n);
    expect(BigInt(position.status)).to.equal(0n);
  });

  it("emits NearLiquidation when the price enters the warning zone", async function () {
    const simulator = await deploySimulator();
    const strategyId = ethers.encodeBytes32String("demo");

    await simulator.openPosition(strategyId, 100_000n, 85_000n, 1_000_000n, 80_000n);

    await expect(simulator.updateMarkPrice(strategyId, 92_000n))
      .to.emit(simulator, "NearLiquidation")
      .withArgs(strategyId, 92_000n, 1_000_000n, 80_000n);

    const position = await simulator.getPosition(strategyId);
    expect(position.markPrice).to.equal(92_000n);
    expect(BigInt(position.status)).to.equal(1n);
  });

  it("emits LiquidationTriggered when the price breaks the liquidation threshold", async function () {
    const simulator = await deploySimulator();
    const strategyId = ethers.encodeBytes32String("demo");

    await simulator.openPosition(strategyId, 100_000n, 85_000n, 1_000_000n, 80_000n);

    await expect(simulator.updateMarkPrice(strategyId, 84_000n))
      .to.emit(simulator, "LiquidationTriggered")
      .withArgs(strategyId, 84_000n);

    const position = await simulator.getPosition(strategyId);
    expect(position.markPrice).to.equal(84_000n);
    expect(BigInt(position.status)).to.equal(2n);
  });

  it("keeps a liquidated position liquidated on further updates", async function () {
    const simulator = await deploySimulator();
    const strategyId = ethers.encodeBytes32String("demo");

    await simulator.openPosition(strategyId, 100_000n, 85_000n, 1_000_000n, 80_000n);
    await simulator.updateMarkPrice(strategyId, 84_000n);
    await simulator.updateMarkPrice(strategyId, 95_000n);

    const position = await simulator.getPosition(strategyId);
    expect(position.markPrice).to.equal(95_000n);
    expect(BigInt(position.status)).to.equal(2n);
  });

  it("reverts on unknown positions", async function () {
    const simulator = await deploySimulator();

    await expect(simulator.updateMarkPrice(ethers.encodeBytes32String("missing"), 90_000n))
      .to.be.revertedWithCustomError(simulator, "PositionNotFound")
      .withArgs(ethers.encodeBytes32String("missing"));
  });

  it("reverts when target price is not below the liquidation threshold", async function () {
    const simulator = await deploySimulator();
    const strategyId = ethers.encodeBytes32String("demo");

    await expect(simulator.openPosition(strategyId, 100_000n, 85_000n, 1_000_000n, 85_000n))
      .to.be.revertedWithCustomError(simulator, "InvalidThreshold");
  });
});
