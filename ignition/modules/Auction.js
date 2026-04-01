const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("AuctionModule", (m) => {
  const auction = m.contract("Auction");
  return { auction };
});
