// Contract to be tested
const AssetManagement = artifacts.require("./AssetManagement.sol");

// Test suite
contract("AssetManagement", function (accounts) {
  let assetManagementinstance;
  const seller = accounts[1];
  const buyer = accounts[2];
  const assetId = 1;
  const assetName = "asset 1";
  const assetSerialID = 1;
  const assetPrice = web3.utils.toBN(10);

  before("set up contract instance for each test", async () => {
    assetManagementinstance = await AssetManagement.deployed();
  });

  // Test case: buying an asset when no asset for sale yet
  it("should throw an exception if you try to buy an asset when there is no asset for sale", async () => {
    try {
      await assetManagementinstance.buyAsset(assetId, {
        from: buyer,
        value: web3.utils.toWei(assetPrice, "ether"),
      });
      assert.fail();
    } catch (error) {
      assert.equal(error.reason, "There should be at least one asset");
    }

    const numberOfAssets = await assetManagementinstance.getNumberOfAssets();

    //make sure sure the contract state was not altered
    assert.equal(numberOfAssets.toNumber(), 0, "number of assets must be zero");
  });

  // Test case: buying an asset that does not exist
  it("should throw an exception if you try to buy an asset that does not exist", async () => {
    await assetManagementinstance.sellAsset(
      assetName,
      assetSerialID,
      web3.utils.toWei(assetPrice, "ether"),
      {
        from: seller,
      }
    );

    try {
      await assetManagementinstance.buyAsset(2, {
        from: seller,
        value: web3.utils.toWei(assetPrice, "ether"),
      });
      assert.fail();
    } catch (error) {
      assert.equal(error.reason, "Asset with this id does not exist");
    }

    const asset = await assetManagementinstance.getAssetForSaleByID(assetId);
    assert.equal(asset[0].toNumber(), assetId, "asset id must be " + assetId);
    assert.equal(asset[1], seller, "seller must be " + seller);
    assert.equal(asset[2], 0x0, "buyer must be empty");
    assert.equal(asset[3], assetName, "asset name must be " + assetName);
    assert.equal(
      asset[4],
      assetSerialID,
      "asset description must be " + assetSerialID
    );
    assert.equal(
      asset[5].toString(),
      web3.utils.toWei(assetPrice, "ether").toString(),
      "asset price must be " + web3.utils.toWei(assetPrice, "ether")
    );
  });

  // Test case: buying an asset you are selling
  it("should throw an exception if you try to buy your own asset", async () => {
    try {
      await assetManagementinstance.buyAsset(assetId, {
        from: seller,
        value: web3.utils.toWei(assetPrice, "ether"),
      });
      assert.fail();
    } catch (error) {
      assert.equal(error.reason, "Seller cannot buy his own asset");
    }

    const asset = await assetManagementinstance.getAssetForSaleByID(assetId);
    //make sure sure the contract state was not altered
    assert.equal(asset[0].toNumber(), assetId, "asset id must be " + assetId);
    assert.equal(asset[1], seller, "seller must be " + seller);
    assert.equal(asset[2], 0x0, "buyer must be empty");
    assert.equal(asset[3], assetName, "asset name must be " + assetName);
    assert.equal(
      asset[4],
      assetSerialID,
      "asset description must be " + assetSerialID
    );
    assert.equal(
      asset[5].toString(),
      web3.utils.toWei(assetPrice, "ether").toString(),
      "asset price must be " + web3.utils.toWei(assetPrice, "ether")
    );
  });

  // Test case: incorrect value
  it("should throw an exception if you try to buy an asset for a value different from its price", async () => {
    try {
      await assetManagementinstance.buyAsset(assetId, {
        from: buyer,
        value: web3.utils.toWei(assetPrice + 1, "ether"),
      });
    } catch (error) {
      assert.equal(
        error.reason,
        "Value provided does not match price of asset"
      );
    }

    const asset = await assetManagementinstance.getAssetForSaleByID(assetId);
    //make sure sure the contract state was not altered
    assert.equal(asset[0].toNumber(), assetId, "asset id must be " + assetId);
    assert.equal(asset[1], seller, "seller must be " + seller);
    assert.equal(asset[2], 0x0, "buyer must be empty");
    assert.equal(asset[3], assetName, "asset name must be " + assetName);
    assert.equal(
      asset[4],
      assetSerialID,
      "asset description must be " + assetSerialID
    );
    assert.equal(
      asset[5].toString(),
      web3.utils.toWei(assetPrice, "ether").toString(),
      "asset price must be " + web3.utils.toWei(assetPrice, "ether")
    );
  });
});
