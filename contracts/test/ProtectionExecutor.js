const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProtectionExecutor", function () {
  async function deployFixture() {
    const [deployer] = await ethers.getSigners();

    const ProxyFactory = await ethers.getContractFactory("ProtectionCallbackProxyMock");
    const proxy = await ProxyFactory.deploy();
    await proxy.waitForDeployment();

    const ExecutorFactory = await ethers.getContractFactory("ProtectionExecutor");
    const executor = await ExecutorFactory.deploy(
      await proxy.getAddress(),
      deployer.address,
      100n
    );
    await executor.waitForDeployment();

    return { deployer, proxy, executor };
  }

  it("initializes callback metadata and hedge config", async function () {
    const { deployer, proxy, executor } = await deployFixture();

    expect(await executor.authorizedCallbackProxy()).to.equal(await proxy.getAddress());
    expect(await executor.expectedRvmId()).to.equal(deployer.address);
    expect(await executor.contractMultiplier()).to.equal(100n);
    expect(await executor.lastHedgeSize()).to.equal(0n);
    expect(await executor.status()).to.equal(0n);
  });

  it("reverts when the callback sender is not the authorized proxy", async function () {
    const { deployer, executor } = await deployFixture();

    await expect(
      executor.onReactiveCallback(
        deployer.address,
        ethers.encodeBytes32String("demo"),
        90n,
        1_000n,
        80n,
        1
      )
    )
      .to.be.revertedWithCustomError(executor, "InvalidCallbackSource")
      .withArgs(deployer.address);
  });

  it("reverts when the callback RVM id does not match", async function () {
    const { proxy, executor } = await deployFixture();
    const wrongRvmId = ethers.getAddress("0x000000000000000000000000000000000000dEaD");

    await expect(
      proxy.forwardReactiveCallback(
        await executor.getAddress(),
        wrongRvmId,
        ethers.encodeBytes32String("demo"),
        90n,
        1_000n,
        80n,
        1
      )
    )
      .to.be.revertedWithCustomError(executor, "InvalidRvmId")
      .withArgs(await executor.expectedRvmId(), wrongRvmId);
  });

  it("opens a mock short with a dynamically calculated hedge size", async function () {
    const { proxy, executor } = await deployFixture();
    const strategyId = ethers.encodeBytes32String("strategy-1");

    await expect(
      proxy.forwardReactiveCallback(
        await executor.getAddress(),
        await executor.expectedRvmId(),
        strategyId,
        90n,
        1_000n,
        80n,
        1
      )
    )
      .to.emit(executor, "ShortPositionOpened")
      .withArgs(strategyId, 90n, 80n, 1_000n, 100n, 100n);

    const state = await executor.getProtectionState();
    expect(state.hedgeSize).to.equal(100n);
    expect(state.collateralValue).to.equal(1_000n);
    expect(state.triggerPrice).to.equal(90n);
    expect(state.targetPrice).to.equal(80n);
    expect(state.multiplier).to.equal(100n);
    expect(state.currentStatus).to.equal(1n);
    expect(state.strategyId).to.equal(strategyId);
    expect(state.direction).to.equal(1n);
    expect(state.action).to.equal(1n);
  });

  it("blocks repeated hedging for the same strategy", async function () {
    const { proxy, executor } = await deployFixture();
    const target = await executor.getAddress();
    const rvmId = await executor.expectedRvmId();

    await proxy.forwardReactiveCallback(target, rvmId, ethers.encodeBytes32String("strategy-1"), 90n, 1_000n, 80n, 1);

    await expect(
      proxy.forwardReactiveCallback(target, rvmId, ethers.encodeBytes32String("strategy-1"), 88n, 1_000n, 78n, 1)
    )
      .to.be.revertedWithCustomError(executor, "AlreadyHedged");
  });

  it("resets mock short state when a new strategy triggers later", async function () {
    const { proxy, executor } = await deployFixture();
    const target = await executor.getAddress();
    const rvmId = await executor.expectedRvmId();

    await proxy.forwardReactiveCallback(target, rvmId, ethers.encodeBytes32String("strategy-1"), 90n, 1_000n, 80n, 1);

    await expect(
      proxy.forwardReactiveCallback(target, rvmId, ethers.encodeBytes32String("strategy-2"), 84n, 2_000n, 74n, 1)
    )
      .to.emit(executor, "HedgeStateReset")
      .withArgs(ethers.encodeBytes32String("strategy-1"));

    const state = await executor.getProtectionState();
    expect(state.hedgeSize).to.equal(200n);
    expect(state.collateralValue).to.equal(2_000n);
    expect(state.triggerPrice).to.equal(84n);
    expect(state.targetPrice).to.equal(74n);
    expect(state.strategyId).to.equal(ethers.encodeBytes32String("strategy-2"));
  });

  it("reverts when target price does not imply further downside", async function () {
    const { proxy, executor } = await deployFixture();

    await expect(
      proxy.forwardReactiveCallback(
        await executor.getAddress(),
        await executor.expectedRvmId(),
        ethers.encodeBytes32String("strategy-1"),
        90n,
        1_000n,
        90n,
        1
      )
    ).to.be.revertedWithCustomError(executor, "InvalidTargetPrice");
  });

  it("reverts when the formula resolves to zero hedge size", async function () {
    const { proxy, executor } = await deployFixture();

    await expect(
      proxy.forwardReactiveCallback(
        await executor.getAddress(),
        await executor.expectedRvmId(),
        ethers.encodeBytes32String("strategy-1"),
        90n,
        1n,
        89n,
        1
      )
    ).to.be.revertedWithCustomError(executor, "InvalidHedgeFormula");
  });
});
