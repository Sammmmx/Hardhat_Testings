const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Auction", function () {
  async function deployAuctionFixture() {
    const itemNumber = 1;
    const startingPrice = 100;
    const duration = 5000;

    const [owner, otherAccount, Account3] = await ethers.getSigners();

    const Auction = await ethers.getContractFactory("Auction");
    const auction = await Auction.deploy();

    await auction.createAuction(itemNumber, startingPrice, duration);

    return {
      auction,
      owner,
      otherAccount,
      itemNumber,
      startingPrice,
      duration,
      Account3,
    };
  }

  describe("Create Auction", async function () {
    it("should check if the sender is owner", async function () {
      const { auction, owner } = await loadFixture(deployAuctionFixture);

      expect(await auction.owner()).to.equal(owner.address);
    });

    it("should check if the auction is active", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      expect(await auction.checkAuctionActive(1)).to.equal(true);
    });

    it("should check if starting price is set correctly", async function () {
      const { auction, startingPrice } = await loadFixture(
        deployAuctionFixture,
      );

      expect(await auction.checkActiveBidPrice(1)).to.equal(startingPrice);
    });

    it("should check is duration is set correctly", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      expect(await auction.timeLeft(1)).is.not.equal(0);
    });
  });

  describe("Bid", async function () {
    it("should fail if item number is wrong", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      await expect(
        auction.bid(2, 100, { value: 200 }),
      ).to.be.revertedWithCustomError(auction, "ItemDoesNotExist");
    });

    it("it should fail if Bid Amount does not meet the starting price", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      await expect(
        auction.bid(1, 50, { value: 50 }),
      ).to.be.revertedWithCustomError(auction, "BidTooLow");
    });

    it("should fail Bid Amount is not higher than the last bid", async function () {
      const { auction, Account3, otherAccount } = await loadFixture(
        deployAuctionFixture,
      );

      await auction.connect(Account3).bid(1, 110, { value: 110 });
      await expect(
        auction.connect(otherAccount).bid(1, 105),
      ).to.be.revertedWithCustomError(auction, "BidTooLow");
    });

    it("should set the necessary item details", async function () {
      const { auction, Account3 } = await loadFixture(deployAuctionFixture);

      await auction.connect(Account3).bid(1, 110, { value: 110 });

      const item = await auction.itemlist(1);
      expect(await item.highbid).to.equal(Account3);
      expect(await item.high).to.equal(110);
    });

    it("should revert if ethers sent not equals bidAmount", async function () {
      const { auction, Account3 } = await loadFixture(deployAuctionFixture);

      await expect(
        auction.connect(Account3).bid(1, 110, { value: 105 }),
      ).to.be.revertedWithCustomError(auction, "IncorrectPayment");
    });

    it("should confirm if refund to previous bider was successfull", async function () {
      const { auction, Account3, otherAccount } = await loadFixture(
        deployAuctionFixture,
      );

      await auction.connect(Account3).bid(1, 110, { value: 110 });
      expect(await auction.connect(otherAccount).bid(1, 115, { value: 115 })).to
        .not.be.reverted;
    });
  });

  describe("Cancel Auction", async function () {
    it("should revert if item number is wrong", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      await expect(auction.cancelAuction(2)).to.be.revertedWithCustomError(
        auction,
        "ItemDoesNotExist",
      );
    });

    it("should work with correct item number", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      await auction.cancelAuction(1);
      expect(await auction.checkAuctionActive(1)).to.equal(false);
    });
  });

  describe("checkAuctionActive", async function () {
    it("should return true for active auctions", async function () {
      const { auction, itemNumber } = await loadFixture(deployAuctionFixture);

      expect(await auction.checkAuctionActive(1)).to.equal(true);
    });

    it("should return false for inactive auctions", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      expect(await auction.checkAuctionActive(2)).to.equal(false);
    });
  });

  describe("checkHighestBidder", async function () {
    it("should be revered ith item number is wrong", async function () {
      const { auction, itemNumber } = await loadFixture(deployAuctionFixture);

      expect(await auction.checkAuctionActive(1)).to.equal(true);
    });

    it("should revert if item number is wrong", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      expect(await auction.checkHighestBidder(2)).to.equal(
        "0x0000000000000000000000000000000000000000",
      );
    });

    it("it should check if the return value is highest bidder", async function () {
      const { auction, owner, otherAccount } = await loadFixture(
        deployAuctionFixture,
      );

      await auction.connect(owner).bid(1, 110, { value: 110 });
      await auction.connect(otherAccount).bid(1, 120, { value: 120 });
      expect(await auction.checkHighestBidder(1)).to.equal(
        otherAccount.address,
      );
    });
  });

  describe("checkActiveBidPrice", async function () {
    it("should be revered ith item number is wrong", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      expect(await auction.checkAuctionActive(1)).to.equal(true);
    });

    it("should revert if item number is wrong", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);

      await expect(
        auction.checkActiveBidPrice(2),
      ).to.be.revertedWithCustomError(auction, "ItemDoesNotExist");
    });

    it("should check if the return value is correct", async function () {
      const { auction, Account3 } = await loadFixture(deployAuctionFixture);

      await auction.connect(Account3).bid(1, 300, { value: 300 });
      expect(await auction.checkActiveBidPrice(1)).to.equal(300);
    });
  });
});
