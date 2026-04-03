const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Logic", function () {
  async function deployLogicFixture() {
    const Value = 0;

    const [owner, otherAccount] = await ethers.getSigners();

    const Logic = await ethers.getContractFactory("Logic");
    const logic = await Logic.deploy();

    return { logic, Value, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("should check if the Value is 0", async function () {
      const { logic, Value } = await loadFixture(deployLogicFixture);

      expect(await logic.getCount()).to.equal(Value);
    });
  });

  describe("Increment", function () {
    it("should increase value by 1", async function () {
      const { logic, Value } = await loadFixture(deployLogicFixture);

      await logic.increment();
      expect(await logic.getCount()).to.equal(1);
    });
  });
});
