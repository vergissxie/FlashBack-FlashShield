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
      1000n,
      0n
    );
    await executor.waitForDeployment();

    return { deployer, proxy, executor };
  }

  it("initializes the demo balances and callback metadata", async function () {
    const { deployer, proxy, executor } = await deployFixture();

    expect(await executor.authorizedCallbackProxy()).to.equal(await proxy.getAddress());
    expect(await executor.expectedRvmId()).to.equal(deployer.address);
    expect(await executor.riskTokenBalance()).to.equal(1000n);
    expect(await executor.stableTokenBalance()).to.equal(0n);
    expect(await executor.protectedAmount()).to.equal(0n);
    expect(await executor.status()).to.equal(0n);
  });

  it("reverts when the callback sender is not the authorized proxy", async function () {
    const { deployer, executor } = await deployFixture();

    await expect(
      executor.onReactiveCallback(deployer.address, ethers.encodeBytes32String("demo"), 84n, 1)
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
        84n,
        1
      )
    )
      .to.be.revertedWithCustomError(executor, "InvalidRvmId")
      .withArgs(await executor.expectedRvmId(), wrongRvmId);
  });

  it("applies an 80% one-way protection switch on a valid callback", async function () {
    const { proxy, executor } = await deployFixture();
    const strategyId = ethers.encodeBytes32String("strategy-1");
    const triggerPrice = 84n;

    await expect(
      proxy.forwardReactiveCallback(await executor.getAddress(), await executor.expectedRvmId(), strategyId, triggerPrice, 1)
    )
      .to.emit(executor, "ProtectionExecuted")
      .withArgs(strategyId, triggerPrice, 800n, 200n, 800n);

    const state = await executor.getProtectionState();
    expect(state.riskBalance).to.equal(200n);
    expect(state.stableBalance).to.equal(800n);
    expect(state.amountProtected).to.equal(800n);
    expect(state.currentStatus).to.equal(1n);
    expect(state.strategyId).to.equal(strategyId);
    expect(state.triggerPrice).to.equal(84n);
    expect(state.action).to.equal(1n);
  });

  it("blocks repeated protection once the position is already protected", async function () {
    const { proxy, executor } = await deployFixture();
    const target = await executor.getAddress();
    const rvmId = await executor.expectedRvmId();

    await proxy.forwardReactiveCallback(target, rvmId, ethers.encodeBytes32String("strategy-1"), 84n, 1);

    await expect(
      proxy.forwardReactiveCallback(target, rvmId, ethers.encodeBytes32String("strategy-1"), 83n, 1)
    )
      .to.be.revertedWithCustomError(executor, "AlreadyProtected");
  });

  it("resets demo balances when a new strategy triggers after an earlier protected run", async function () {
    const { proxy, executor } = await deployFixture();
    const target = await executor.getAddress();
    const rvmId = await executor.expectedRvmId();

    await proxy.forwardReactiveCallback(target, rvmId, ethers.encodeBytes32String("strategy-1"), 84n, 1);

    await expect(
      proxy.forwardReactiveCallback(target, rvmId, ethers.encodeBytes32String("strategy-2"), 82n, 1)
    )
      .to.emit(executor, "ProtectionStateReset")
      .withArgs(ethers.encodeBytes32String("strategy-1"));

    const state = await executor.getProtectionState();
    expect(state.riskBalance).to.equal(200n);
    expect(state.stableBalance).to.equal(800n);
    expect(state.amountProtected).to.equal(800n);
    expect(state.currentStatus).to.equal(1n);
    expect(state.strategyId).to.equal(ethers.encodeBytes32String("strategy-2"));
    expect(state.triggerPrice).to.equal(82n);
  });
});
