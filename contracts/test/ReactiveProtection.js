const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReactiveProtection", function () {
  it("emits a callback event for a matching NearLiquidation log", async function () {
    const [deployer] = await ethers.getSigners();
    const ReactiveProtection = await ethers.getContractFactory("ReactiveProtection");
    const topic = ethers.id("NearLiquidation(bytes32,uint256,uint256,uint256)");

    const contract = await ReactiveProtection.deploy(
      11155111,
      84532,
      deployer.address,
      topic,
      deployer.address
    );

    const log = {
      chain_id: 11155111,
      _contract: deployer.address,
      topic_0: BigInt(topic),
      topic_1: BigInt(ethers.encodeBytes32String("demo")),
      topic_2: 0,
      topic_3: 0,
      data: ethers.AbiCoder.defaultAbiCoder().encode(["uint256", "uint256", "uint256"], [84, 1000, 80]),
      block_number: 1,
      op_code: 0,
      block_hash: 0,
      tx_hash: 0,
      log_index: 0
    };

    const callbackInterface = new ethers.Interface([
      "function onReactiveCallback(address rvmId, bytes32 strategyId, uint256 triggerPrice, uint256 collateralValue, uint256 targetPrice, uint8 action)",
    ]);
    const payload = callbackInterface.encodeFunctionData("onReactiveCallback", [
      ethers.ZeroAddress,
      ethers.encodeBytes32String("demo"),
      84,
      1000,
      80,
      1,
    ]);

    await expect(contract.react(log))
      .to.emit(contract, "Callback")
      .withArgs(84532, deployer.address, 500000, payload);
  });
});
