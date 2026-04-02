const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("TSV1", (m) => {
  const talentshowvoting = m.contract("WorldGotTalent");
  return { talentshowvoting };
});
