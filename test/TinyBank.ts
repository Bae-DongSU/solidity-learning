// test/TinyBank.test.ts
import hre from "hardhat";
import { expect } from "chai";
import { TinyBank, MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DECIMALS, MINTING_AMOUNT } from "./constant";

describe("TinyBank", () => {
  let signers: HardhatEthersSigner[];
  let myTokenC: MyToken;
  let tinyBankC: TinyBank;

  beforeEach(async () => {
    signers = await hre.ethers.getSigners();

    // MyToken 배포: 마지막 인자로 [signers[0].address] 전달 → manager 지정
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
      [signers[0].address],
    ]);

    // TinyBank 배포: 토큰 주소 + 3명의 manager 리스트
    tinyBankC = await hre.ethers.deployContract("TinyBank", [
      await myTokenC.getAddress(),
      [
        signers[0].address,
        signers[1].address,
        signers[2].address,
      ],
    ]);

    // TinyBank에 mint 권한 부여
    await myTokenC.setMgr(await tinyBankC.getAddress());
  });

  describe("Initialized state check", () => {
    it("should return totalStaked 0", async () => {
      expect(await tinyBankC.totalStaked()).to.equal(0);
    });

    it("should return staked 0 of signer 0", async () => {
      const signer0 = signers[0];
      expect(await tinyBankC.staked(signer0.address)).to.equal(0);
    });
  });

  describe("Staking", () => {
    it("should return staked amount", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.connect(signer0).approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.connect(signer0).stake(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).to.equal(stakingAmount);
      expect(await myTokenC.balanceOf(tinyBankC)).to.equal(await tinyBankC.totalStaked());
    });
  });

  describe("Withdraw", () => {
    it("should return 0 staked after withdrawing total token", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.connect(signer0).approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.connect(signer0).stake(stakingAmount);
      await tinyBankC.connect(signer0).withdraw(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).to.equal(0);
    });
  });

  describe("reward", () => {
    it("should reward >0 after 1 block", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.connect(signer0).approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.connect(signer0).stake(stakingAmount);

      // mine one block to accrue reward
      await hre.network.provider.send("evm_mine");

      await tinyBankC.connect(signer0).withdraw(stakingAmount);
      const bal = await myTokenC.balanceOf(signer0.address);
      // initial mint was MINTING_AMOUNT*1e18, so reward > 0
      expect(bal).to.be.gt(MINTING_AMOUNT * 10n ** DECIMALS);
    });

    it("Should revert when non-manager calls setRewardPerBlock", async () => {
      const hacker = signers[3];
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
      await expect(
        tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange)
      ).to.be.revertedWith("You are not a manager");
    });

    it("Should revert when not all managers confirmed", async () => {
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
      // 두 명만 confirm
      await tinyBankC.connect(signers[0]).confirmChange();
      await tinyBankC.connect(signers[1]).confirmChange();

      await expect(
        tinyBankC.connect(signers[0]).setRewardPerBlock(rewardToChange)
      ).to.be.revertedWith("Not all confirmed yet");
    });

    it("Should allow setRewardPerBlock after all confirmed", async () => {
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
      // 모든 manager 동의
      await tinyBankC.connect(signers[0]).confirmChange();
      await tinyBankC.connect(signers[1]).confirmChange();
      await tinyBankC.connect(signers[2]).confirmChange();

      await tinyBankC.connect(signers[0]).setRewardPerBlock(rewardToChange);
      expect(await tinyBankC.rewardPerBlock()).to.equal(rewardToChange);
    });

    it("Should reset confirmations after change", async () => {
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
      // 모든 동의 후 변경
      await tinyBankC.connect(signers[0]).confirmChange();
      await tinyBankC.connect(signers[1]).confirmChange();
      await tinyBankC.connect(signers[2]).confirmChange();
      await tinyBankC.connect(signers[0]).setRewardPerBlock(rewardToChange);

      // 리셋됐으므로 다시 실패
      await expect(
        tinyBankC.connect(signers[0]).setRewardPerBlock(rewardToChange)
      ).to.be.revertedWith("Not all confirmed yet");
    });
  });
});
