const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("ERC", function () {
  async function deployERC() {
    const [owner, otherAccount, Account3, Account4] = await ethers.getSigners();

    const ERC = await ethers.getContractFactory("ERC20Permit");
    const erc = await ERC.deploy();

    await erc.connect(owner).Register(Account4.address, 100);
    return { erc, owner, otherAccount, Account3, Account4 };
  }
  describe("Register", function () {
    it("should revert if the interactor is not an owner", async function () {
      const { erc, Account3, otherAccount } = await loadFixture(deployERC);

      await expect(
        erc.connect(Account3).Register(otherAccount.address, 100),
      ).to.be.revertedWithCustomError(erc, "NotOwner");
    });
    it("should revert if address is invalid", async function () {
      const { erc, owner } = await loadFixture(deployERC);

      await expect(
        erc.connect(owner).Register(ethers.ZeroAddress, 100),
      ).to.be.revertedWithCustomError(erc, "InvalidAddress");
    });
    it("should revert if amount is 0", async function () {
      const { erc, owner, Account3 } = await loadFixture(deployERC);

      await expect(
        erc.connect(owner).Register(Account3.address, 0),
      ).to.be.revertedWithCustomError(erc, "InvalidAmount");
    });
  });

  describe("Transfer", async function () {
    it("should revert if address is invalid", async function () {
      const { erc, otherAccount } = await loadFixture(deployERC);

      await expect(
        erc.connect(otherAccount).transfer(ethers.ZeroAddress, 100),
      ).to.be.revertedWithCustomError(erc, "InvalidAddress");
    });
    it("should revert if balance is insufficient", async function () {
      const { erc, Account3, Account4 } = await loadFixture(deployERC);

      await expect(
        erc.connect(Account4).transfer(Account3.address, 110),
      ).to.be.revertedWithCustomError(erc, "InsufficientBalance");
    });
    it("should record the event", async function () {
      const { erc, Account3, Account4 } = await loadFixture(deployERC);

      expect(await erc.connect(Account4).transfer(Account3.address, 20))
        .to.emit(erc, "_transfer")
        .withArgs(Account4.address, Account3.address, 20);
    });
    it("should complete the transfer", async function () {
      const { erc, Account3, Account4 } = await loadFixture(deployERC);
      await erc.connect(Account4).transfer(Account3.address, 20);
      expect(await erc.Members(Account3.address)).to.be.equal(20);
    });
  });

  describe("TransferFrom", async function () {
    it("should revert if addresses are invalid", async function () {
      const { erc, Account3, Account4 } = await loadFixture(deployERC);

      await expect(
        erc
          .connect(Account4)
          .transferFrom(ethers.ZeroAddress, Account3.address, 20),
      ).to.be.revertedWithCustomError(erc, "InvalidAddress");
      await expect(
        erc
          .connect(Account4)
          .transferFrom(Account3.address, ethers.ZeroAddress, 20),
      ).to.be.revertedWithCustomError(erc, "InvalidAddress");
    });
    it("should revert if Unauthorized user tries to transfer", async function () {
      const { erc, otherAccount, Account3, Account4 } = await loadFixture(
        deployERC,
      );

      await expect(
        erc
          .connect(otherAccount)
          .transferFrom(Account4.address, Account3.address, 40),
      ).to.be.revertedWithCustomError(erc, "NotAllowed");
    });
    it("should work when amount is inside allowance", async function () {
      const { erc, Account3, Account4, otherAccount } = await loadFixture(
        deployERC,
      );

      await erc.connect(Account4).approve(otherAccount.address, 50);
      expect(
        await erc
          .connect(otherAccount)
          .transferFrom(Account4.address, Account3.address, 40),
      ).not.to.be.reverted;
    });
    it("should revert if amount is outside allowance", async function () {
      const { erc, Account3, Account4, otherAccount } = await loadFixture(
        deployERC,
      );

      await erc.connect(Account4).approve(otherAccount.address, 50);
      await expect(
        erc
          .connect(otherAccount)
          .transferFrom(Account4.address, Account3.address, 60),
      ).to.be.revertedWithCustomError(erc, "NotAllowed");
    });
    it("should complete the transfer and set allowance", async function () {
      const { erc, Account3, Account4, otherAccount } = await loadFixture(
        deployERC,
      );

      await erc.connect(Account4).approve(otherAccount.address, 50);
      await erc
        .connect(otherAccount)
        .transferFrom(Account4.address, Account3.address, 40);
      expect(await erc.Members(Account3.address)).to.equal(40);
      expect(
        await erc.Allowances(Account4.address, otherAccount.address),
      ).to.equal(10);
    });
    it("should record the event", async function () {
      const { erc, Account3, Account4, otherAccount } = await loadFixture(
        deployERC,
      );

      await erc.connect(Account4).approve(otherAccount.address, 50);
      await expect(
        erc
          .connect(otherAccount)
          .transferFrom(Account4.address, Account3.address, 40),
      )
        .to.emit(erc, "_transferFrom")
        .withArgs(Account4.address, Account3.address, 40);
    });
  });

  describe("Approve", async function () {
    it("should revert wrong address", async function () {
      const { erc, Account4 } = await loadFixture(deployERC);

      await expect(
        erc.connect(Account4).approve(ethers.ZeroAddress, 50),
      ).to.be.revertedWithCustomError(erc, "InvalidAddress");
    });
    it("should revert if amount is 0", async function () {
      const { erc, Account4, otherAccount } = await loadFixture(deployERC);

      await expect(
        erc.connect(Account4).approve(otherAccount.address, 0),
      ).to.be.revertedWithCustomError(erc, "InvalidAmount");
    });
    it("should set allowance", async function () {
      const { erc, otherAccount, Account4 } = await loadFixture(deployERC);

      await erc.connect(Account4).approve(otherAccount.address, 50);
      expect(
        await erc.Allowances(Account4.address, otherAccount.address),
      ).to.be.equal(50);
    });
    it("should record the event", async function () {
      const { erc, Account4, otherAccount } = await loadFixture(deployERC);

      await expect(erc.connect(Account4).approve(otherAccount.address, 50))
        .to.emit(erc, "_approve")
        .withArgs(Account4.address, otherAccount.address, 50);
    });
  });
});
