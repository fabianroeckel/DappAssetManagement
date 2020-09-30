// Contract to be tested
const AssetManagement = artifacts.require("./AssetManagement.sol");

// Test suite
contract("AssetManagement", function (accounts) {
  let assetManagementInstance;
  const seller = accounts[1];
  const buyer = accounts[2];
  const assetName1 = "asset 1";
  const assetSerialID1 = 1;
  const assetPrice1 = web3.utils.toBN(10);
  const assetName2 = "asset 2";
  const assetSerialID2 = 2;
  const assetPrice2 = web3.utils.toBN(20);
  let sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
  let buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

  before("set up contract instance for each test", async () => {
    assetManagementInstance = await AssetManagement.deployed();
  });

  // Test case: check initial values
  it("should be initialized with empty values", async () => {
    const numberOfassets = await assetManagementInstance.getNumberOfSellingAssets();
    assert.equal(numberOfassets, 0, "number of assets must be zero");
    const assetsForSale = await assetManagementInstance.getAssetsForSale();
    assert.equal(assetsForSale.length, 0, "assets for sale should be empty");
  });

  // Test case: sell a first asset
  it("should let us sell a first asset", async () => {
    const receipt = await assetManagementInstance.sellAsset(
      assetName1,
      assetSerialID1,
      web3.utils.toWei(assetPrice1, "ether"),
      {
        from: seller,
      }
    );
    //check event
    assert.equal(receipt.logs.length, 1, "should have received one event");
    assert.equal(
      receipt.logs[0].event,
      "LogSellAsset",
      "event name should be LogSellAsset"
    );
    assert.equal(receipt.logs[0].args._id.toNumber(), 1, "id must be 1");
    assert.equal(
      receipt.logs[0].args._seller,
      seller,
      "seller must be " + seller
    );
    assert.equal(
      receipt.logs[0].args._name,
      assetName1,
      "asset name must be " + assetName1
    );
    assert.equal(
      receipt.logs[0].args._price.toString(),
      web3.utils.toWei(assetPrice1, "ether").toString(),
      "asset price must be " + web3.utils.toWei(assetPrice1, "ether")
    );

    const assetsForSale = await assetManagementInstance.getAssetsForSale();
    assert.equal(assetsForSale.length, 1, "there must now be 1 asset for sale");
    const assetId = assetsForSale[0].toNumber();
    assert.equal(assetId, 1, "asset id must be 1");

    const asset = await assetManagementInstance.getAssetForSaleByID(assetId);
    assert.equal(asset[0].toNumber(), 1, "asset id must be 1");
    assert.equal(asset[1], seller, "seller must be " + seller);
    assert.equal(asset[2], 0x0, "buyer must be empty");
    assert.equal(asset[3], assetName1, "asset name must be " + assetName1);
    assert.equal(
      asset[4],
      assetSerialID1,
      "asset description must be " + assetSerialID1
    );
    assert.equal(
      asset[5].toString(),
      web3.utils.toWei(assetPrice1, "ether").toString(),
      "asset price must be " + web3.utils.toWei(assetPrice1, "ether")
    );
  });

  // Test case: sell a second asset
  it("should let us sell a second asset", async () => {
    const receipt = await assetManagementInstance.sellAsset(
      assetName2,
      assetSerialID2,
      web3.utils.toWei(assetPrice2, "ether"),
      {
        from: seller,
      }
    );
    assert.equal(
      receipt.logs.length,
      1,
      "one event should have been triggered"
    );
    assert.equal(
      receipt.logs[0].event,
      "LogSellAsset",
      "event should be LogSellAsset"
    );
    assert.equal(receipt.logs[0].args._id.toNumber(), 2, "id must be 2");
    assert.equal(
      receipt.logs[0].args._seller,
      seller,
      "event seller must be " + seller
    );
    assert.equal(
      receipt.logs[0].args._name,
      assetName2,
      "event asset name must be " + assetName2
    );
    assert.equal(
      receipt.logs[0].args._price.toString(),
      web3.utils.toWei(assetPrice2, "ether").toString(),
      "event asset price must be " + web3.utils.toWei(assetPrice2, "ether")
    );

    const assetsForSale = await assetManagementInstance.getAssetsForSale();
    assert.equal(
      assetsForSale.length,
      2,
      "there must now be 2 assets for sale"
    );
    const assetId = assetsForSale[1].toNumber();
    assert.equal(assetId, 2, "asset id must be 2");

    const asset = await assetManagementInstance.getAssetForSaleByID(assetId);
    assert.equal(asset[0].toNumber(), 2, "asset id must be 2");
    assert.equal(asset[1], seller, "seller must be " + seller);
    assert.equal(asset[2], 0x0, "buyer must be empty");
    assert.equal(asset[3], assetName2, "asset name must be " + assetName2);
    assert.equal(
      asset[4],
      assetSerialID2,
      "asset description must be " + assetSerialID2
    );
    assert.equal(
      asset[5].toString(),
      web3.utils.toWei(assetPrice2, "ether").toString(),
      "asset price must be " + web3.utils.toWei(assetPrice2, "ether")
    );
  });

  // Test case: buy the first asset
  it("should let us buy the first asset", async () => {
    const assetId = 1;

    // record balances of seller and buyer before the buy
    sellerBalanceBeforeBuy = parseFloat(
      web3.utils.fromWei(await web3.eth.getBalance(seller), "ether")
    );
    buyerBalanceBeforeBuy = parseFloat(
      web3.utils.fromWei(await web3.eth.getBalance(buyer), "ether")
    );

    const receipt = await assetManagementInstance.buyAsset(assetId, {
      from: buyer,
      value: web3.utils.toWei(assetPrice1, "ether"),
    });

    assert.equal(
      receipt.logs.length,
      1,
      "one event should have been triggered"
    );
    assert.equal(
      receipt.logs[0].event,
      "LogBuyAsset",
      "event should be LogBuyAsset"
    );
    assert.equal(
      receipt.logs[0].args._id.toNumber(),
      assetId,
      "assetId must be " + assetId
    );
    assert.equal(
      receipt.logs[0].args._buyer,
      buyer,
      "event buyer must be " + buyer
    );
    assert.equal(
      receipt.logs[0].args._name,
      assetName1,
      "event asset name must be " + assetName1
    );
    assert.equal(
      receipt.logs[0].args._price.toString(),
      web3.utils.toWei(assetPrice1, "ether").toString(),
      "event asset price must be " + web3.utils.toWei(assetPrice1, "ether")
    );

    // record balances of buyer and seller after the buy
    sellerBalanceAfterBuy = parseFloat(
      web3.utils.fromWei(await web3.eth.getBalance(seller), "ether")
    );
    buyerBalanceAfterBuy = parseFloat(
      web3.utils.fromWei(await web3.eth.getBalance(buyer), "ether")
    );

    //check the effect of buy on balances of buyer and seller, accounting for gas
    assert(
      sellerBalanceAfterBuy == sellerBalanceBeforeBuy + assetPrice1.toNumber(),
      "seller should have earned " + assetPrice1 + " ETH"
    );
    assert(
      buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - assetPrice1.toNumber(),
      "buyer should have spent " + assetPrice1 + " ETH"
    );
    const assetsForSale = await assetManagementInstance.getAssetsForSale();

    assert(
      assetsForSale.length,
      1,
      "there should now be only one asset left for sale"
    );
  });
});
