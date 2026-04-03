const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const contract = "0x8C997702Bc4968C48ea31220F58B4bdFe2615ce9";

module.exports = buildModule("Prov1", (m) => {
  const proxy = m.contract("proxy", [contract]);
  return { proxy };
});
