App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  loading: false,

  init: async () => {
    return App.initWeb3();
  },

  

  initWeb3: async () => {

    //We check if we have an etherum object (modern version MetaMask)
    if (window.ethereum) {

      //initialize new web3 object 
      window.web3 = new Web3(window.ethereum);
      try {
         
        //display dialog, to allow access
        await window.ethereum.enable();

         //Checking for changed account event emitted by Meta Mask
         //reload Account information and articles
        ethereum.on("accountsChanged", function (accounts) {
          App.displayAccountInfo();
          App.reloadArticles();
        });

        App.displayAccountInfo();
        return App.initContract();

      } catch (error) {
        //user denied access
        console.error(
          "Unable to retrieve your accounts! You have to approve this application on Metamask"
        );
      }

      //user uses Meta Mask with older version
    } else if (window.web3) {
      window.web3 = new Web3(web3.currentProvider || "ws://localhost:8545");
      App.displayAccountInfo();
      return App.initContract();
    } else {

      //no dapp browser
      console.log(
        "Non-ethereum browser detected."
      );
    }
  },

  /**
   * @dev Allows the display account balance and address.
   */
  displayAccountInfo: async () => {

    //return list of accounts we have access to 
    const accounts = await window.web3.eth.getAccounts();

    //retrieve account 
    App.account = accounts[0];

    //jquery to display account address
    $("#account").text(App.account);

    //retrieve balance from logged-in account
    const balance = await window.web3.eth.getBalance(App.account);

    //jquery to display account balance converted to Ether
    $("#accountBalance").text(
      window.web3.utils.fromWei(balance, "ether") + " ETH"
    );
  },


  initContract: async () => {
    $.getJSON("AssetManagement.json", (AssetmanagementArtifact) => {
      
      //initialize the truffle contract abstraction
      App.contracts.AssetManagement = TruffleContract(AssetmanagementArtifact);

      //connect the contract with Meta Mask instance
      App.contracts.AssetManagement.setProvider(window.web3.currentProvider);
      App.listenToEvents();
      return App.reloadArticles();
    });
  },

  // Listen to events raised from the contract
  listenToEvents: async () => {

    //initialize instance of our contract
    const assetManagementInstance = await App.contracts.AssetManagement.deployed();
    
    //check if we already started to listen to events
    if (App.logSellArticleEventListener == null) {
      
      //initialize article event listener from block 0 (range)
      //to listen to data events
      App.logSellArticleEventListener = assetManagementInstance
        .LogSellArticle({ fromBlock: "0" })
        .on("data", (event) => {
          $("#" + event.id).remove();
          $("#events").append(
            '<li class="list-group-item" id="' +
              event.id +
              '">' +
              event.returnValues._name +
              " is for sale</li>"
          );
          App.reloadArticles();
        })
        .on("error", (error) => {
          console.error(error);
        });
    }
    //check if we already started to listen to events
    if (App.logBuyArticleEventListener == null) {

      //initialize article event listener from block 0 (range)
      //to listen to data events
      App.logBuyArticleEventListener = assetManagementInstance
        .LogBuyArticle({ fromBlock: "0" })
        .on("data", (event) => {
          $("#" + event.id).remove();
          $("#events").append(
            '<li class="list-group-item" id="' +
              event.id +
              '">' +
              event.returnValues._buyer +
              " bought  " +
              event.returnValues._name +
              "</li>"
          );
          App.reloadArticles();
        })
        .on("error", (error) => {
          console.error(error);
        });
    }
    //check if we already started to listen to events
    if (App.logOffMarketEventListener == null) {

      //initialize article event listener from block 0 (range)
      //to listen to data events
      App.logOffMarketEventListener = assetManagementInstance
        .LogOffMarket({ fromBlock: "0" })
        .on("data", (event) => {
          $("#" + event.id).remove();
          $("#events").append(
            '<li class="list-group-item" id="' +
              event.id +
              '">' +
              event.returnValues._name +
              " isn't for sale anymore.</li>"
          );
          App.reloadArticles();
        })
        .on("error", (error) => {
          console.error(error);
        });
    }
    $(".btn-show-events").show();
  },

  //!NotNeeded
  getTransactionHistory: async (event) => {

    //retrieve asset id from button
    var _articleId = $(event.target).data("id");
    console.log(_articleId); //!NotNeeded

    //initialize instance of contract
    const assetManagementInstance = await App.contracts.AssetManagement.deployed();
    const arraylength = await assetManagementInstance.getArrayLength(
      _articleId
    );
    console.log(arraylength.length);
    $("#transactionHistory").empty();
    for (let i = 0; i < arraylength.length; i++) {
      const test = await assetManagementInstance
        .getTimeAndOwner(_articleId, i)
        .then((event) => {
          const localizedDate =
            new Date(event.time * 1000).toLocaleDateString() +
            " um " +
            new Date(event.time * 1000).toLocaleTimeString();
          $("#transactionHistory").append(
            '<li class="list-group-item my-3">' +
              "<b>Besitzer</b>: " +
              event.owner +
              ", <b>gekauft am</b>: " +
              localizedDate +
              "</li>"
          );
        });
    }
    $(".btn-transactionHistory").show();
  },


  //!Not Needed
  getTransactionHistorySell: async (event) => {
    var _articleId = $(event.target).data("id");
    console.log(_articleId);
    const assetManagementInstance = await App.contracts.AssetManagement.deployed();
    const arraylength = await assetManagementInstance.getArrayLength(
      _articleId
    );
    console.log(arraylength.length);
    $("#transactionHistorySell").empty();
    for (let i = 0; i < arraylength.length; i++) {
      const test = await assetManagementInstance
        .getTimeAndOwner(_articleId, i)
        .then((result) => {
          const localizedDate =
            new Date(result.time * 1000).toLocaleDateString() +
            " um " +
            new Date(result.time * 1000).toLocaleTimeString();
          $("#transactionHistorySell").append(
            '<li class="list-group-item my-3">' +
              "<b>Besitzer</b>: " +
              result.owner +
              ", <b>gekauft am</b>: " +
              localizedDate +
              "</li>"
          );
        });
    }
    $(".btn-transactionHistorySell").show();
  },



  sellArticle: async () => {

    //retrieve article price from dialog
    const articlePriceValue = parseFloat($("#article_price_sell").val());
   
    //check if Number and convert it to string
    const articlePrice = isNaN(articlePriceValue)
      ? "0"
      : articlePriceValue.toString();

    //retrieve article name for dialog
    const _name = $("#article_name_sell").val();

    //retrieve article serial id from dialog
    const _serialID = $("#article_description_sell").val();

    //convert price into Wei
    const _price = window.web3.utils.toWei(articlePrice, "ether");

    //we check if the name is empty or there isnt a price in form
    if (_name.trim() == "" || _price === "0") {
      return false;
    }

    try {
      //initialize instance of our contract
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();

      /**@dev allows to create & sell asset
       * @param string  _name asset name
       * @param uint256 _serialID unique serial identifier
       * @param uint256 _price asset price
       * */
      const transactionReceipt = await assetManagementInstance
        .sellArticle(_name, _serialID, _price, {
          from: App.account,
          gas: 6000000,
        })
        .on("transactionHash", (hash) => {
          console.log("transaction hash", hash);
        });
      console.log("transaction receipt", transactionReceipt);
    } catch (error) {
      console.error(error);
    }
    App.reloadArticles();
  },

  createAsset: async () => {
    console.log("creating"); //!Not Neded

    //retrieve article price from dialog
    const articlePriceValueCreate = parseFloat(
      $("#article_price_create").val()
    );

    //check if Number and convert it to string
    const articlePriceCreate = isNaN(articlePriceValueCreate)
      ? "0"
      : articlePriceValueCreate.toString();

    //retrieve name from dialog
    const _nameCreate = $("#article_name_create").val();

    //retrieve serialID from dialog
    const _serialIDCreate = $("#article_description_create").val();

    //convert price to Wei
    const _priceCreate = window.web3.utils.toWei(articlePriceCreate, "ether");

    //we check if the name is empty or there isnt a price in form
    if (_nameCreate.trim() == "" || _priceCreate === "0") {
      return false;
    }
    try {
      //initialize instance of our contract
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();
      
         /**@dev allows to create new asset
       * @param string  _name asset name
       * @param uint256 _serialID unique serial identifier
       * @param uint256 _price asset price
       * */
      const transactionReceipt = await assetManagementInstance
        .createAsset(_nameCreate, _serialIDCreate, _priceCreate, {
          from: App.account,
          gas: 6000000,
        })
        .on("transactionHash", (hash) => {
          console.log("transaction hash", hash);
        });
      console.log("transaction receipt", transactionReceipt);
      App.reloadArticles();
    } catch (error) {
      console.error(error);
    }
  },

  buyArticle: async () => {
    event.preventDefault();

    // retrieve the asset id, price from button
    var _articleId = $(event.target).data("id");

     // retrieve the asset price, price from button
    const articlePriceValue = parseFloat($(event.target).data("value"));

    //check if its a number and convert it into a String
    const articlePrice = isNaN(articlePriceValue)
      ? "0"
      : articlePriceValue.toString();

    //Converts wei value into a ether value 
    const _price = window.web3.utils.toWei(articlePrice, "ether");
    
    try {
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();
     
     
      /**@dev allows to buy asset
       * @param uint256 _articleID asset itentifier
       * */ 
      const transactionReceipt = await assetManagementInstance
        .buyArticle(_articleId, {
          from: App.account,
          value: _price,
          gas: 600000,
        })
        .on("transactionHash", (hash) => {
          console.log("transaction hash", hash);
        });
      console.log("transaction receipt", transactionReceipt);
    } catch (error) {
      console.error(error);
    }
  },

  sellOwnArticle: async (event) => {
    event.preventDefault();

    //retrieve asset id from button event (onclick)
    var _articleId = $(event.target).data("id");

    //retrieve price from button event (onclick)
    const articlePriceValue = parseFloat($(event.target).data("value"));

    //check if number and convert it to string
    const articlePrice = isNaN(articlePriceValue)
      ? "0"
      : articlePriceValue.toString();

    //convert price from ether to Wei
    const _price = window.web3.utils.toWei(articlePrice, "ether");

    //!Not Needed
    console.log("sell id from object: " + _articleId + " sellprice " + _price);

    try {
      //initialize contract instance
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();

      /**@dev allows to sell asset (available for sale)
       * @param uint256 _articleID asset itentifier
       * @param uint _price asset price 
       * */ 
      const transactionReceipt = await assetManagementInstance
        .sellOwnArticle(_articleId, _price, {
          from: App.account,
          gas: 5000000,
        })
        .on("transactionHash", (hash) => {
          console.log("transaction hash", hash);
        });
        console.log("transaction receipt", transactionReceipt);
    } catch (error) {
      console.error(error);
    }
    App.reloadArticles();
  },

  removeArticle: async () => {
    event.preventDefault();

    //retrieve the asset id from event (button click)
    var _articleId = $(event.target).data("id");

    try {
      //intitialize contract instance
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();

      /**@dev allows to remove article from market (not available for sale anymore)
       * @param uint256 _articleID asset itentifier 
       * */ 
      const transactionReceipt = await assetManagementInstance
        .removeFromMarket(_articleId, {
          from: App.account,
          gas: 5000000,
        })
        .on("transactionHash", (hash) => {
          console.log("transaction hash", hash);
        });
        console.log("transaction receipt", transactionReceipt);
    } catch (error) {
      console.error(error);
    }
    App.reloadArticles();
  },


  reloadArticles: async () => {
    // avoid reentry
    if (App.loading) {
      return;
    }
    App.loading = true;

    // refresh account information because the balance may have changed
    App.displayAccountInfo();

    try {

      //initialize contract instance
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();
      
      //get assetIDs for articles for sale
      const articleIds = await assetManagementInstance.getArticlesForSale();
      console.log("IDs in ForSale Row Array: " + articleIds);

      //clear the articlesRow list
      $("#articlesRow").empty();
      console.log(
        "Länge Aarry of Articles for Sale in reloadArticels(): " +
          articleIds.length
      );
      

      for (let i = 0; i < articleIds.length; i++) {
        //console.log("Thats the Article i= " + i + " and aticleID "); !Not Needed

        //retrieve article from mapping
        const article = await assetManagementInstance.articles(articleIds[i]);

        // Problem! if added   -only if artikel is not deleted at that spot !NotNeeded
        App.displayArticle(
          article[0],
          article[1],
          article[3],
          article[4],
          article[5],
          article[6]
        );
      }

      App.loading = false;
    } catch (error) {
      console.error(error);
      App.loading = false;
    }

    try {
      //initialize contract instance
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();

      //get assetIDs for articles for owned
      const articleIds2 = await assetManagementInstance.getOwnedAssets();

      //!Not Needed
      console.log("IDs in Owned Row Array: " + articleIds2);

      //clear the articlesRow list
      $("#articlesRow2").empty();
      for (let i = 0; i < articleIds2.length; i++) {

        //retrieve article from mapping
        const article = await assetManagementInstance.ownArticles(
          articleIds2[i]
        );
        App.displayOwnedArticle(
          article[0],
          article[1],
          article[3],
          article[4],
          article[5],
          article[6]
        );
      }
      App.loading = false;
    } catch (error) {
      console.error(error);
      App.loading = false;
    }
  },


  /**
    * Display articles on the market
    * param  {uint256}  id [asset id]
    * param  {address}  seller [asset seller/owner]
    * param  {string}   name [asset name]
    * param  {uint256}  serialID [asset serialIdentifier]
    * param  {uint256}  price [asset price]
    */
  displayArticle: (id, seller, name, serialID, price) => {
    
    // Retrieve the article placeholder
    const articlesRow = $("#articlesRow");
    
    //Converts wei value into a ether value
    const etherPrice = web3.utils.fromWei(price, "ether");

    // Retrieve and fill the article template
    var articleTemplateSell = $("#articleTemplateSell");
    articleTemplateSell.find(".article-name-sell").text(name);
    articleTemplateSell.find(".article-description-sell").text(serialID);
    articleTemplateSell.find(".article-price-sell").text(etherPrice + " ETH");
    articleTemplateSell.find(".btn-buy").attr("data-id", id);
    articleTemplateSell.find(".btn-transactionHistory");
    //.attr("data-id", uniqueId); !Not needed
    articleTemplateSell.find(".btn-transactionHistorySell");
    //.attr("data-id", uniqueId); !Not needed
    articleTemplateSell.find(".btn-remove").attr("data-id", id);
    articleTemplateSell.find(".btn-buy").attr("data-value", etherPrice);

    //check if logged in account is owner, then change the UI
    if (seller == App.account) {
      articleTemplateSell.find(".article-seller-sell").text("You");
      articleTemplateSell.find(".btn-buy").hide();
      articleTemplateSell.find(".btn-remove").show();
    } else {
      articleTemplateSell
        .find(".article-seller-sell")
        .text(seller.substring(0, 15) + "...");
      articleTemplateSell.find(".btn-buy").show();
      articleTemplateSell.find(".btn-remove").hide();
      //articleTemplateSell.find("remove-asset-market").hide(); !NotNeeded
    }

    // add this new article
    articlesRow.append(articleTemplateSell.html());
  },



  /**
    * Display articles from the market
    * param  {uint256}  id [asset id]
    * param  {address}  seller [asset seller/owner]
    * param  {string}   name [asset name]
    * param  {uint256}  serialID [asset serialIdentifier]
    * param  {uint256}  price [asset price]
    */
  displayOwnedArticle: (id, seller, name, serialID, price) => {

    // Retrieve the article placeholder
    const articlesRow2 = $("#articlesRow2");

    //Converts wei value into a ether value
    const etherPrice = web3.utils.fromWei(price, "ether");

    // Retrieve and fill the article template
    var articleTemplateCreate = $("#articleTemplateCreate");
    articleTemplateCreate.find(".article-name-create").text(name);
    articleTemplateCreate.find(".article-description-create").text(serialID);
    articleTemplateCreate
      .find(".article-price-create")
      .text(etherPrice + " ETH");
    articleTemplateCreate.find(".btn-buy").attr("data-id", id);
    articleTemplateCreate.find(".btn-buy").attr("data-value", etherPrice);
    articleTemplateCreate.find(".btn-transactionHistory");
    //.attr("data-id", uniqueId);
    articleTemplateCreate.find(".btn-transactionHistorySell");
    //.attr("data-id", uniqueId);
    console.log(
      "ID of: " +
        id +
        " Owner Displayed is: " +
        name +
        " Seller: " +
        seller +
        " line steht am Rand 320 "
    );

    // checking if loggend in Account is owner, change UI
    if (seller == App.account) {
      articleTemplateCreate.find(".article-seller-create").text("You");
      articleTemplateCreate.find(".btn-buy");
      // add this new article
      articlesRow2.append(articleTemplateCreate.html());
    }
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
