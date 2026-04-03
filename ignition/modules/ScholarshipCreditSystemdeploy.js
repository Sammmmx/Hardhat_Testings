const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SCSv1", (m) => {
  const scholarshipcreditsystem = m.contract("ScholarshipCreditContract");
  return { scholarshipcreditsystem };
});
