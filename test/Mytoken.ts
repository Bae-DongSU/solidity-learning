import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("mytoken deploy", () => {
    let myTokenC: MyToken;
    let signers: HardhatEthersSigner[];
    before("should deploy", async () => {
        signers = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", [
            "MyToken",
            "MT",
            18,
        ]);
    });
    it("should return neme", async () => {
        expect(await myTokenC.name()).equal("MyToken");
    });
    it("should return symbol", async () => {
        expect(await myTokenC.symbol()).equal("MT");
    });
    it("should return decimals", async () => {
        expect(await myTokenC.decimals()).equal(18);
    });
    it("should return 0 totalSupply", async () => {
        expect(await myTokenC.totalSupply()).equal(0);
    });
    it("should return 0 balance for signer 0", async () => {
        expect(await myTokenC.balanceOf(signers[0].address)).equal(0);
    })
});