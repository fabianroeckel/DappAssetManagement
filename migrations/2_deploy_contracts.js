var AssetManagement = artifacts.require("./AssetManagement.sol");

module.exports = function(deployer) {
  deployer.deploy(AssetManagement);
};
