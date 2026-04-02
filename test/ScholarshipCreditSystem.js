const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("ScholarshipCreditContract", function () {
  async function deployScholarshipFixture() {
    const [owner, student1, student2, merchant1, merchant2] =
      await ethers.getSigners();

    const Scholarship = await ethers.getContractFactory(
      "ScholarshipCreditContract",
    );
    const scholarship = await Scholarship.deploy();

    return { scholarship, owner, student1, student2, merchant1, merchant2 };
  }

  describe("grantScholarship", function () {
    it("should revert if caller is not owner", async function () {
      const { scholarship, student1, student2 } = await loadFixture(
        deployScholarshipFixture,
      );

      await expect(
        scholarship.connect(student1).grantScholarship(student2.address, 100),
      ).to.be.revertedWithCustomError(scholarship, "NotOwner");
    });

    it("should revert if address is invalid", async function () {
      const { scholarship, owner } = await loadFixture(
        deployScholarshipFixture,
      );

      await expect(
        scholarship.connect(owner).grantScholarship(ethers.ZeroAddress, 100),
      ).to.be.revertedWithCustomError(scholarship, "InvalidAddress");
    });

    it("should revert if student is owner", async function () {
      const { scholarship, owner } = await loadFixture(
        deployScholarshipFixture,
      );

      await expect(
        scholarship.connect(owner).grantScholarship(owner.address, 100),
      ).to.be.revertedWithCustomError(scholarship, "OwnerCannotBeStudent");
    });

    it("should revert if student is a merchant", async function () {
      const { scholarship, owner, merchant1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).registerMerchant(merchant1.address);
      await expect(
        scholarship.connect(owner).grantScholarship(merchant1.address, 100),
      ).to.be.revertedWithCustomError(scholarship, "MerchantCannotBeStudent");
    });

    it("should revert if amount is 0", async function () {
      const { scholarship, owner, student1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await expect(
        scholarship.connect(owner).grantScholarship(student1.address, 0),
      ).to.be.revertedWithCustomError(scholarship, "InvalidAmount");
    });

    it("should grant scholarship correctly", async function () {
      const { scholarship, owner, student1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).grantScholarship(student1.address, 500);
      expect(await scholarship.connect(student1).checkBalance()).to.equal(500);
    });

    it("should reduce totalCredits after granting", async function () {
      const { scholarship, owner, student1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).grantScholarship(student1.address, 500);
      expect(await scholarship.totalCredits()).to.equal(999500);
    });

    it("should emit ScholarshipGranted event", async function () {
      const { scholarship, owner, student1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await expect(
        scholarship.connect(owner).grantScholarship(student1.address, 500),
      )
        .to.emit(scholarship, "ScholarshipGranted")
        .withArgs(student1.address, 500);
    });
  });

  describe("registerMerchant", function () {
    it("should revert if caller is not owner", async function () {
      const { scholarship, student1, merchant1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await expect(
        scholarship.connect(student1).registerMerchant(merchant1.address),
      ).to.be.revertedWithCustomError(scholarship, "NotOwner");
    });

    it("should revert if merchant is owner", async function () {
      const { scholarship, owner } = await loadFixture(
        deployScholarshipFixture,
      );

      await expect(
        scholarship.connect(owner).registerMerchant(owner.address),
      ).to.be.revertedWithCustomError(scholarship, "OwnerCannotBeMerchant");
    });

    it("should revert if merchant is already a student", async function () {
      const { scholarship, owner, student1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).grantScholarship(student1.address, 100);
      await expect(
        scholarship.connect(owner).registerMerchant(student1.address),
      ).to.be.revertedWithCustomError(scholarship, "StudentCannotBeMerchant");
    });

    it("should revert if already registered", async function () {
      const { scholarship, owner, merchant1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).registerMerchant(merchant1.address);
      await expect(
        scholarship.connect(owner).registerMerchant(merchant1.address),
      ).to.be.revertedWithCustomError(scholarship, "AlreadyMerchant");
    });

    it("should register merchant correctly", async function () {
      const { scholarship, owner, merchant1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).registerMerchant(merchant1.address);
      const details = await scholarship.merchants(merchant1.address);
      expect(details.registered).to.equal(true);
    });

    it("should emit MerchantRegistered event", async function () {
      const { scholarship, owner, merchant1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await expect(
        scholarship.connect(owner).registerMerchant(merchant1.address),
      )
        .to.emit(scholarship, "MerchantRegistered")
        .withArgs(merchant1.address);
    });
  });

  describe("deregisterMerchant", function () {
    it("should revert if not a merchant", async function () {
      const { scholarship, owner, merchant1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await expect(
        scholarship.connect(owner).deregisterMerchant(merchant1.address),
      ).to.be.revertedWithCustomError(scholarship, "NotMerchant");
    });

    it("should deregister merchant and return credits", async function () {
      const { scholarship, owner, student1, merchant1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).registerMerchant(merchant1.address);
      await scholarship.connect(owner).grantScholarship(student1.address, 500);
      await scholarship.connect(student1).spend(merchant1.address, 200);
      await scholarship.connect(owner).deregisterMerchant(merchant1.address);

      const details = await scholarship.merchants(merchant1.address);
      expect(details.registered).to.equal(false);
      expect(await scholarship.totalCredits()).to.equal(999700);
    });

    it("should emit MerchantDeregistered event", async function () {
      const { scholarship, owner, merchant1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).registerMerchant(merchant1.address);
      await expect(
        scholarship.connect(owner).deregisterMerchant(merchant1.address),
      )
        .to.emit(scholarship, "MerchantDeregistered")
        .withArgs(merchant1.address);
    });
  });

  describe("revokeScholarship", function () {
    it("should revert if not a student", async function () {
      const { scholarship, owner, student1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await expect(
        scholarship.connect(owner).revokeScholarship(student1.address),
      ).to.be.revertedWithCustomError(scholarship, "NotStudent");
    });

    it("should revoke scholarship and return credits", async function () {
      const { scholarship, owner, student1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).grantScholarship(student1.address, 500);
      await scholarship.connect(owner).revokeScholarship(student1.address);

      const details = await scholarship.students(student1.address);
      expect(details.registered).to.equal(false);
      expect(await scholarship.totalCredits()).to.equal(1000000);
    });

    it("should emit ScholarshipRevoked event", async function () {
      const { scholarship, owner, student1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).grantScholarship(student1.address, 500);
      await expect(
        scholarship.connect(owner).revokeScholarship(student1.address),
      ).to.emit(scholarship, "ScholarshipRevoked");
    });
  });

  describe("spend", function () {
    it("should revert if caller is not a student", async function () {
      const { scholarship, owner, student1, merchant1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).registerMerchant(merchant1.address);
      await expect(
        scholarship.connect(student1).spend(merchant1.address, 100),
      ).to.be.revertedWithCustomError(scholarship, "NotStudent");
    });

    it("should revert if merchant is not registered", async function () {
      const { scholarship, owner, student1, merchant1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).grantScholarship(student1.address, 500);
      await expect(
        scholarship.connect(student1).spend(merchant1.address, 100),
      ).to.be.revertedWithCustomError(scholarship, "NotMerchant");
    });

    it("should revert if amount exceeds balance", async function () {
      const { scholarship, owner, student1, merchant1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).grantScholarship(student1.address, 100);
      await scholarship.connect(owner).registerMerchant(merchant1.address);
      await expect(
        scholarship.connect(student1).spend(merchant1.address, 200),
      ).to.be.revertedWithCustomError(scholarship, "InsufficientCredits");
    });

    it("should spend credits correctly", async function () {
      const { scholarship, owner, student1, merchant1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).grantScholarship(student1.address, 500);
      await scholarship.connect(owner).registerMerchant(merchant1.address);
      await scholarship.connect(student1).spend(merchant1.address, 200);

      expect(await scholarship.connect(student1).checkBalance()).to.equal(300);
      expect(await scholarship.connect(merchant1).checkBalance()).to.equal(200);
    });

    it("should emit CreditsSpent event", async function () {
      const { scholarship, owner, student1, merchant1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await scholarship.connect(owner).grantScholarship(student1.address, 500);
      await scholarship.connect(owner).registerMerchant(merchant1.address);
      await expect(scholarship.connect(student1).spend(merchant1.address, 200))
        .to.emit(scholarship, "CreditsSpent")
        .withArgs(student1.address, merchant1.address, 200);
    });
  });

  describe("checkBalance", function () {
    it("should return totalCredits for owner", async function () {
      const { scholarship, owner } = await loadFixture(
        deployScholarshipFixture,
      );

      expect(await scholarship.connect(owner).checkBalance()).to.equal(1000000);
    });

    it("should revert for unregistered address", async function () {
      const { scholarship, student1 } = await loadFixture(
        deployScholarshipFixture,
      );

      await expect(
        scholarship.connect(student1).checkBalance(),
      ).to.be.revertedWithCustomError(scholarship, "InvalidAddress");
    });
  });
});
