const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Logv2", (m) => {
  const logic2 = m.contract("Logic2");
  return { logic2 };
});
