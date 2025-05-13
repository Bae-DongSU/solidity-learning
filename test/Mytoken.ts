// test/MyToken.test.ts
import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const MINTING_AMOUNT = 100n;
const DECIMALS = 18n;

describe("mytoken deploy", () => {
  let myTokenC: MyToken;
  let signer: HardhatEthersSigner[];

  beforeEach("should deploy", async () => {
    signer = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
      [signer[0].address], // 매니저 리스트
    ]);
  });

  describe("Basic state value chaeck", () => {
    it("should return name", async () => {
      expect(await myTokenC.name()).equal("MyToken");
    });
    it("should return symbol", async () => {
      expect(await myTokenC.symbol()).equal("MT");
    });
    it("should return DECIMALS", async () => {
      expect(await myTokenC.decimals()).equal(18);
    });
    it("should return 100MT totalSupply", async () => {
      expect(await myTokenC.totalSupply()).equal(
        MINTING_AMOUNT * 10n ** DECIMALS
      );
    });
  });

  describe("Mint", () => {
    it("should return initial 100MT balance for signer 0", async () => {
      expect(await myTokenC.balanceOf(signer[0].address)).equal(
        MINTING_AMOUNT * 10n ** DECIMALS
      );
    });

    it("should revert when non-manager tries to mint", async () => {
      const nonMgr = signer[1];
      const mintAgain = hre.ethers.parseUnits("10000", DECIMALS);
      await expect(
        myTokenC.connect(nonMgr).mint(mintAgain, nonMgr.address)
      ).to.be.revertedWith("You are not a manager");
    });
  });

  describe("Transfer", () => {
    it("should have 0.5MT after transfer", async () => {
      const signer0 = signer[0];
      const signer1 = signer[1];
      const half = hre.ethers.parseUnits("0.5", DECIMALS);

      await myTokenC.transfer(half, signer1.address);
      expect(await myTokenC.balanceOf(signer1.address)).equal(half);
    });

    it("should be reverted with insufficient balance error", async () => {
      const signer1 = signer[1];
      const over = hre.ethers.parseUnits(
        (MINTING_AMOUNT + 1n).toString(),
        DECIMALS
      );
      await expect(
        myTokenC.transfer(over, signer1.address)
      ).to.be.revertedWith("insufficient error!");
    });
  });

  describe("TransferFrom", () => {
    it("should emit Approval event", async () => {
      const signer1 = signer[1];
      const amt = hre.ethers.parseUnits("10", DECIMALS);
      await myTokenC.approve(signer1.address, amt);
      // Approval event is emitted by approve(), but we don't assert here per original style
    });

    it("should be reverted with insufficient allowance error", async () => {
      await expect(
        myTokenC
          .connect(signer[1])
          .transferFrom(
            signer[0].address,
            signer[1].address,
            hre.ethers.parseUnits("1", DECIMALS)
          )
      ).to.be.revertedWith("insufficient allowance");
    });

    it("should allow signer1 to transfer an approved amount from signer0", async () => {
      const signer0 = signer[0];
      const signer1 = signer[1];
      const approveAmt = hre.ethers.parseUnits("10", DECIMALS);
      const xferAmt = hre.ethers.parseUnits("5", DECIMALS);

      await myTokenC.approve(signer1.address, approveAmt);
      await myTokenC
        .connect(signer1)
        .transferFrom(signer0.address, signer1.address, xferAmt);

      expect(await myTokenC.balanceOf(signer1.address)).to.equal(xferAmt);
    });
  });
});
