const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Logv1", (m) => {
  const logic = m.contract("Logic");
  return { logic };
});
