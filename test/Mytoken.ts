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
            expect(await myTokenC.totalSupply()).equal(MINTING_AMOUNT * 10n ** DECIMALS);
        });
    });
    describe("Mint", () => {
        it("should return 1MT balance for signer 0", async () => {
            expect(await myTokenC.balanceOf(signer[0].address)).equal(MINTING_AMOUNT * 10n ** DECIMALS);
        });
    });

    describe("Transfer", () => {
        it("should have 0.5MT", async () => {
            const signer0 = signer[0];
            const signer1 = signer[1];
            await expect(myTokenC.transfer(hre.ethers.parseUnits("0.5", DECIMALS), signer1.address)).to.emit(myTokenC, "Transfer")
            .withArgs(signer0.address, signer1.address, hre.ethers.parseUnits("0.5", DECIMALS));
            expect(await myTokenC.balanceOf(signer1.address)).equal(
                hre.ethers.parseUnits("0.5", DECIMALS)
            );

            const filter = myTokenC.filters.Transfer(signer0.address);
            const logs = await myTokenC.queryFilter(filter, 0, "latest");
        });

        it("should be reverted with insufficient balance error", async () => {
            const signer1 = signer[1];
            await
                expect(myTokenC.transfer(hre.ethers.parseUnits((MINTING_AMOUNT + 1n).toString(), DECIMALS), signer1.address))
                .to.be.revertedWith("insufficient error!");
        });
    });
    describe("TransferFrom", () => {
        it("should emit Approval event", async () => {
            const signer1 = signer[1];
            await expect(myTokenC.approve(signer1, hre.ethers.parseUnits("10", DECIMALS)))
            .to.emit(myTokenC, "Approval")
            .withArgs(signer1.address, hre.ethers.parseUnits("10", DECIMALS));
        })
        it("should be reverted with insufficient allowance error", async () => {
            const signer0 = signer[0];
            const signer1 = signer[1];
            await expect(myTokenC.connect(signer1).transferFrom(
                signer0.address,
                signer1.address,
                hre.ethers.parseUnits("1", DECIMALS)
            )).to.revertedWith("insufficient allowance");
        });
        it("should allow signer1 to transfer an approved amount from signer0", async () => {
            const signer0 = signer[0];
            const signer1 = signer[1];
    
            // 10 MT를 허락
            await myTokenC.approve(signer1.address, hre.ethers.parseUnits("10", DECIMALS));
    
            // signer1이 signer0의 잔액 중 5 MT를 전송
            await expect(myTokenC.connect(signer1).transferFrom(
                signer0.address,
                signer1.address,
                hre.ethers.parseUnits("5", DECIMALS)
            ))
                .to.emit(myTokenC, "Transfer")
                .withArgs(
                    signer0.address,
                    signer1.address,
                    hre.ethers.parseUnits("5", DECIMALS)
                );
    
            // signer1 잔액이 5 MT가 되었는지 확인
            expect(await myTokenC.balanceOf(signer1.address)).to.equal(
                hre.ethers.parseUnits("5", DECIMALS)
            );
        });
    });
});