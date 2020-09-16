// Contract to be tested
const AssetManagement = artifacts.require("./AssetManagement.sol");

// Test suite
contract("AssetManagement", function (accounts) {
  let assetManagementInstance;
  const seller = accounts[1];
  const buyer = accounts[2];
  const articleName1 = "article 1";
  const articleDescription1 = "Description for article 1";
  const articlePrice1 = web3.utils.toBN(10);
  const articleName2 = "article 2";
  const articleDescription2 = "Description for article 2";
  const articlePrice2 = web3.utils.toBN(20);
  let sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
  let buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

  before("set up contract instance for each test", async () => {
    assetManagementInstance = await AssetManagement.deployed();
  });

  // Test case: check initial values
  it("should be initialized with empty values", async () => {
    const numberOfArticles = await assetManagementInstance.getNumberOfSellingArticles();
    assert.equal(numberOfArticles, 0, "number of articles must be zero");
    const articlesForSale = await assetManagementInstance.getArticlesForSale();
    assert.equal(
      articlesForSale.length,
      0,
      "articles for sale should be empty"
    );
  });

  // Test case: sell a first article
  it("should let us sell a first article", async () => {
    const receipt = await assetManagementInstance.sellArticle(
      articleName1,
      articleDescription1,
      web3.utils.toWei(articlePrice1, "ether"),
      {
        from: seller,
      }
    );
    //check event
    assert.equal(receipt.logs.length, 1, "should have received one event");
    assert.equal(
      receipt.logs[0].event,
      "LogSellArticle",
      "event name should be LogSellArticle"
    );
    assert.equal(receipt.logs[0].args._id.toNumber(), 1, "id must be 1");
    assert.equal(
      receipt.logs[0].args._seller,
      seller,
      "seller must be " + seller
    );
    assert.equal(
      receipt.logs[0].args._name,
      articleName1,
      "article name must be " + articleName1
    );
    assert.equal(
      receipt.logs[0].args._price.toString(),
      web3.utils.toWei(articlePrice1, "ether").toString(),
      "article price must be " + web3.utils.toWei(articlePrice1, "ether")
    );

    const numberOfArticles = await assetManagementInstance.getNumberOfSellingArticles();
    assert.equal(numberOfArticles, 1, "number of articles must be one");

    const articlesForSale = await assetManagementInstance.getArticlesForSale();
    assert.equal(
      articlesForSale.length,
      1,
      "there must now be 1 article for sale"
    );
    const articleId = articlesForSale[0].toNumber();
    assert.equal(articleId, 1, "article id must be 1");

    const article = await assetManagementInstance.articles(articleId);
    assert.equal(article[0].toNumber(), 1, "article id must be 1");
    assert.equal(article[1], seller, "seller must be " + seller);
    assert.equal(article[2], 0x0, "buyer must be empty");
    assert.equal(
      article[3],
      articleName1,
      "article name must be " + articleName1
    );
    assert.equal(
      article[4],
      articleDescription1,
      "article description must be " + articleDescription1
    );
    assert.equal(
      article[5].toString(),
      web3.utils.toWei(articlePrice1, "ether").toString(),
      "article price must be " + web3.utils.toWei(articlePrice1, "ether")
    );
  });

  // Test case: sell a second article
  it("should let us sell a second article", async () => {
    const receipt = await assetManagementInstance.sellArticle(
      articleName2,
      articleDescription2,
      web3.utils.toWei(articlePrice2, "ether"),
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
      "LogSellArticle",
      "event should be LogSellArticle"
    );
    assert.equal(receipt.logs[0].args._id.toNumber(), 2, "id must be 2");
    assert.equal(
      receipt.logs[0].args._seller,
      seller,
      "event seller must be " + seller
    );
    assert.equal(
      receipt.logs[0].args._name,
      articleName2,
      "event article name must be " + articleName2
    );
    assert.equal(
      receipt.logs[0].args._price.toString(),
      web3.utils.toWei(articlePrice2, "ether").toString(),
      "event article price must be " + web3.utils.toWei(articlePrice2, "ether")
    );

    const numberOfArticles = await assetManagementInstance.getNumberOfSellingArticles();
    assert.equal(numberOfArticles, 2, "number of articles must be two");

    const articlesForSale = await assetManagementInstance.getArticlesForSale();
    assert.equal(
      articlesForSale.length,
      2,
      "there must now be 2 articles for sale"
    );
    const articleId = articlesForSale[1].toNumber();
    assert.equal(articleId, 2, "article id must be 2");

    const article = await assetManagementInstance.articles(articleId);
    assert.equal(article[0].toNumber(), 2, "article id must be 2");
    assert.equal(article[1], seller, "seller must be " + seller);
    assert.equal(article[2], 0x0, "buyer must be empty");
    assert.equal(
      article[3],
      articleName2,
      "article name must be " + articleName2
    );
    assert.equal(
      article[4],
      articleDescription2,
      "article description must be " + articleDescription2
    );
    assert.equal(
      article[5].toString(),
      web3.utils.toWei(articlePrice2, "ether").toString(),
      "article price must be " + web3.utils.toWei(articlePrice2, "ether")
    );
  });

  // Test case: buy the first article
  it("should let us buy the first article", async () => {
    const articleId = 1;

    // record balances of seller and buyer before the buy
    sellerBalanceBeforeBuy = parseFloat(
      web3.utils.fromWei(await web3.eth.getBalance(seller), "ether")
    );
    buyerBalanceBeforeBuy = parseFloat(
      web3.utils.fromWei(await web3.eth.getBalance(buyer), "ether")
    );

    const receipt = await assetManagementInstance.buyArticle(articleId, {
      from: buyer,
      value: web3.utils.toWei(articlePrice1, "ether"),
    });

    assert.equal(
      receipt.logs.length,
      1,
      "one event should have been triggered"
    );
    assert.equal(
      receipt.logs[0].event,
      "LogBuyArticle",
      "event should be LogBuyArticle"
    );
    assert.equal(
      receipt.logs[0].args._id.toNumber(),
      articleId,
      "articleId must be " + articleId
    );
    assert.equal(
      receipt.logs[0].args._seller,
      seller,
      "event seller must be " + seller
    );
    assert.equal(
      receipt.logs[0].args._buyer,
      buyer,
      "event buyer must be " + buyer
    );
    assert.equal(
      receipt.logs[0].args._name,
      articleName1,
      "event article name must be " + articleName1
    );
    assert.equal(
      receipt.logs[0].args._price.toString(),
      web3.utils.toWei(articlePrice1, "ether").toString(),
      "event article price must be " + web3.utils.toWei(articlePrice1, "ether")
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
      sellerBalanceAfterBuy ==
        sellerBalanceBeforeBuy + articlePrice1.toNumber(),
      "seller should have earned " + articlePrice1 + " ETH"
    );
    assert(
      buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - articlePrice1.toNumber(),
      "buyer should have spent " + articlePrice1 + " ETH"
    );

    const article = await assetManagementInstance.articles(articleId);

    assert.equal(article[0].toNumber(), 1, "article id must be 1");
    assert.equal(article[1], seller, "seller must be " + seller);
    assert.equal(article[2], buyer, "buyer must be " + buyer);
    assert.equal(
      article[3],
      articleName1,
      "article name must be " + articleName1
    );
    assert.equal(
      article[4],
      articleDescription1,
      "article description must be " + articleDescription1
    );
    assert.equal(
      article[5].toString(),
      web3.utils.toWei(articlePrice1, "ether").toString(),
      "article price must be " + web3.utils.toWei(articlePrice1, "ether")
    );

    const articlesForSale = await assetManagementInstance.getArticlesForSale();

    assert(
      articlesForSale.length,
      1,
      "there should now be only one article left for sale"
    );
  });
});
