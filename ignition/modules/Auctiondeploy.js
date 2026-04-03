const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("AuctionModuleV2", (m) => {
  const auction = m.contract("Auction");
  return { auction };
});
