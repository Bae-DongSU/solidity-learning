import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const mintingAmount = 100n;
const decimals = 18n;

describe("mytoken deploy", () => {
    let myTokenC: MyToken;
    let signer: HardhatEthersSigner[];
    beforeEach("should deploy", async () => {
        signer = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", [
            "MyToken",
            "MT",
            decimals,
            mintingAmount,
        ]);
    });
    describe("Basic state value chaeck", () => {
        it("should return name", async () => {
            expect(await myTokenC.name()).equal("MyToken");
        });
        it("should return symbol", async () => {
            expect(await myTokenC.symbol()).equal("MT");
        });
        it("should return decimals", async () => {
            expect(await myTokenC.decimals()).equal(18);
        });
        it("should return 100MT totalSupply", async () => {
            expect(await myTokenC.totalSupply()).equal(mintingAmount * 10n ** decimals);
        });
    });
    describe("Mint", () => {
        it("should return 1MT balance for signer 0", async () => {
            expect(await myTokenC.balanceOf(signer[0].address)).equal(mintingAmount * 10n ** decimals);
        });
    });

    describe("Transfer", () => {
        it("should have 0.5MT", async () => {
            const signer0 = signer[0];
            const signer1 = signer[1];
            await expect(myTokenC.transfer(hre.ethers.parseUnits("0.5", decimals), signer1.address)).to.emit(myTokenC, "Transfer")
            .withArgs(signer0.address, signer1.address, hre.ethers.parseUnits("0.5", decimals));
            expect(await myTokenC.balanceOf(signer1.address)).equal(
                hre.ethers.parseUnits("0.5", decimals)
            );

            const filter = myTokenC.filters.Transfer(signer0.address);
            const logs = await myTokenC.queryFilter(filter, 0, "latest");
        });

        it("should be reverted with insufficient balance error", async () => {
            const signer1 = signer[1];
            await
                expect(myTokenC.transfer(hre.ethers.parseUnits((mintingAmount + 1n).toString(), decimals), signer1.address))
                .to.be.revertedWith("insufficient error!");
        });
    });
});