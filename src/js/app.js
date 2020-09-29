App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  loading: false,

  init: async () => {
    return App.initWeb3();
  },

  initWeb3: async () => {
    //We check if we have an etherum object (higher version MetaMask)
    if (window.ethereum) {
      //initialize new web3 object
      window.web3 = new Web3(window.ethereum);
      try {
        //display dialog, to allow access
        await window.ethereum.enable();

        //Checking for changed account event emitted by Meta Mask
        //reload Account information and assetsForSale
        ethereum.on("accountsChanged", function (accounts) {
          App.displayAccountInfo();
          App.reloadAssets();
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
      console.log("Non-ethereum browser detected.");
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
      return App.reloadAssets();
    });
  },

  // Listen to events raised from the contract
  listenToEvents: async () => {
    //initialize instance of our contract
    const assetManagementInstance = await App.contracts.AssetManagement.deployed();

    //check if we already started to listen to events
    if (App.logsellAssetEventListener == null) {
      //initialize asset event listener from block 0 (range)
      //to listen to data events
      App.logsellAssetEventListener = assetManagementInstance
        .LogSellAsset({ fromBlock: "0" })
        .on("data", (event) => {
          $("#" + event.id).remove();
          $("#events").append(
            '<li class="list-group-item" id="' +
              event.id +
              '">' +
              event.returnValues._name +
              " is for sale</li>"
          );
          App.reloadAssets();
        })
        .on("error", (error) => {
          console.error(error);
        });
    }
    //check if we already started to listen to events
    if (App.logbuyAssetEventListener == null) {
      //initialize asset event listener from block 0 (range)
      //to listen to data events
      App.logbuyAssetEventListener = assetManagementInstance
        .LogBuyAsset({ fromBlock: "0" })
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
          App.reloadAssets();
        })
        .on("error", (error) => {
          console.error(error);
        });
    }
    //check if we already started to listen to events
    if (App.logOffMarketEventListener == null) {
      //initialize asset event listener from block 0 (range)
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
          App.reloadAssets();
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
    var _assetID = $(event.target).data("id");
    console.log(_assetID); //!NotNeeded

    //initialize instance of contract
    const assetManagementInstance = await App.contracts.AssetManagement.deployed();
    const arraylength = await assetManagementInstance.getArrayLength(_assetID);
    console.log(arraylength.length);
    $("#transactionHistory").empty();
    for (let i = 0; i < arraylength.length; i++) {
      const test = await assetManagementInstance
        .getTimeAndOwner(_assetID, i)
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
    var _assetID = $(event.target).data("id");
    console.log(_assetID);
    const assetManagementInstance = await App.contracts.AssetManagement.deployed();
    const arraylength = await assetManagementInstance.getArrayLength(_assetID);
    console.log(arraylength.length);
    $("#transactionHistorySell").empty();
    for (let i = 0; i < arraylength.length; i++) {
      const test = await assetManagementInstance
        .getTimeAndOwner(_assetID, i)
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

  sellAsset: async () => {
    //retrieve asset price from dialog
    const assetPriceValue = parseFloat($("#asset_price_sell").val());

    //check if Number and convert it to string
    const assetPrice = isNaN(assetPriceValue)
      ? "0"
      : assetPriceValue.toString();

    //retrieve asset name for dialog
    const _name = $("#asset_name_sell").val();

    //retrieve asset serial id from dialog
    const _serialID = $("#asset_serialID_sell").val();

    //convert price into Wei
    const _price = window.web3.utils.toWei(assetPrice, "ether");

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
        .sellAsset(_name, _serialID, _price, {
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
    App.reloadAssets();
  },

  createAsset: async () => {
    console.log("creating"); //!Not Neded

    //retrieve asset price from dialog
    const assetPriceValueCreate = parseFloat($("#asset_price_create").val());

    //check if Number and convert it to string
    const assetPriceCreate = isNaN(assetPriceValueCreate)
      ? "0"
      : assetPriceValueCreate.toString();

    //retrieve name from dialog
    const _nameCreate = $("#asset_name_create").val();

    //retrieve serialID from dialog
    const _serialIDCreate = $("#asset_serialID_create").val();

    //convert price to Wei
    const _priceCreate = window.web3.utils.toWei(assetPriceCreate, "ether");

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
      App.reloadAssets();
    } catch (error) {
      console.error(error);
    }
  },

  buyAsset: async () => {
    event.preventDefault();

    // retrieve the asset id, price from button
    var _assetID = $(event.target).data("id");

    // retrieve the asset price, price from button
    const assetPriceValue = parseFloat($(event.target).data("value"));

    //check if its a number and convert it into a String
    const assetPrice = isNaN(assetPriceValue)
      ? "0"
      : assetPriceValue.toString();

    //Converts wei value into a ether value
    const _price = window.web3.utils.toWei(assetPrice, "ether");

    try {
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();

      /**@dev allows to buy asset
       * @param uint256 _assetID asset itentifier
       * */
      const transactionReceipt = await assetManagementInstance
        .buyAsset(_assetID, {
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

  sellOwnAsset: async (event) => {
    event.preventDefault();

    //retrieve asset id from button event (onclick)
    var _assetID = $(event.target).data("id");

    //retrieve price from button event (onclick)
    const assetPriceValue = parseFloat($(event.target).data("value"));

    //check if number and convert it to string
    const assetPrice = isNaN(assetPriceValue)
      ? "0"
      : assetPriceValue.toString();

    //convert price from ether to Wei
    const _price = window.web3.utils.toWei(assetPrice, "ether");

    //!Not Needed
    console.log("sell id from object: " + _assetID + " sellprice " + _price);

    try {
      //initialize contract instance
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();

      /**@dev allows to sell asset (available for sale)
       * @param uint256 _assetID asset itentifier
       * @param uint _price asset price
       * */
      const transactionReceipt = await assetManagementInstance
        .sellOwnAsset(_assetID, _price, {
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
    App.reloadAssets();
  },

  removeAsset: async () => {
    event.preventDefault();

    //retrieve the asset id from event (button click)
    var _assetID = $(event.target).data("id");

    try {
      //intitialize contract instance
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();

      /**@dev allows to remove asset from market (not available for sale anymore)
       * @param uint256 _assetID asset itentifier
       * */
      const transactionReceipt = await assetManagementInstance
        .removeFromMarket(_assetID, {
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
    App.reloadAssets();
  },

  reloadAssets: async () => {
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

      //get assetIDs for assetsForSale for sale
      const assetID = await assetManagementInstance.getAssetsForSale();
      console.log("IDs in ForSale Row Array: " + assetID);

      //clear the assetsRow list
      $("#assetsRow").empty();

      //!Not Needed
      console.log(
        "Länge Aarry of Articles for Sale in reloadArticels(): " +
          assetID.length
      );

      for (let i = 0; i < assetID.length; i++) {
        //console.log("Thats the Asset i= " + i + " and aticleID "); !Not Needed

        //retrieve asset from mapping
        const asset = await assetManagementInstance.assetsForSale(assetID[i]);

        // Problem! if added   -only if artikel is not deleted at that spot !NotNeeded
        App.displayAsset(
          asset[0],
          asset[1],
          asset[3],
          asset[4],
          asset[5],
          asset[6]
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

      //get assetIDs for assetsForSale for owned
      const assetIDs2 = await assetManagementInstance.getOwnedAssets();

      //!Not Needed
      console.log("IDs in Owned Row Array: " + assetIDs2);

      //clear the assetsRow list
      $("#assetsRow2").empty();
      for (let i = 0; i < assetIDs2.length; i++) {
        //retrieve asset from mapping
        const asset = await assetManagementInstance.assetsNotForSale(
          assetIDs2[i]
        );
        App.displayOwnedAsset(
          asset[0],
          asset[1],
          asset[3],
          asset[4],
          asset[5],
          asset[6]
        );
      }
      App.loading = false;
    } catch (error) {
      console.error(error);
      App.loading = false;
    }
  },

  /**
   * Display assetsForSale on the market
   * param  {uint256}  id [asset id]
   * param  {address}  seller [asset seller/owner]
   * param  {string}   name [asset name]
   * param  {uint256}  serialID [asset serialIdentifier]
   * param  {uint256}  price [asset price]
   */
  displayAsset: (id, seller, name, serialID, price) => {
    // Retrieve the asset placeholder
    const assetsRow = $("#assetsRow");

    //Converts wei value into a ether value
    const etherPrice = web3.utils.fromWei(price, "ether");

    // Retrieve and fill the asset template
    var assetTemplateSell = $("#assetTemplateSell");
    assetTemplateSell.find(".asset-name-sell").text(name);
    assetTemplateSell.find(".asset-serialID-sell").text(serialID);
    assetTemplateSell.find(".asset-price-sell").text(etherPrice + " ETH");
    assetTemplateSell.find(".btn-buy").attr("data-id", id);
    assetTemplateSell.find(".btn-transactionHistory");
    //.attr("data-id", uniqueId); !Not needed
    assetTemplateSell.find(".btn-transactionHistorySell");
    //.attr("data-id", uniqueId); !Not needed
    assetTemplateSell.find(".btn-remove").attr("data-id", id);
    assetTemplateSell.find(".btn-buy").attr("data-value", etherPrice);

    //check if logged in account is owner, then change the UI
    if (seller == App.account) {
      assetTemplateSell.find(".asset-seller-sell").text("You");
      assetTemplateSell.find(".btn-buy").hide();
      assetTemplateSell.find(".btn-remove").show();
    } else {
      assetTemplateSell
        .find(".asset-seller-sell")
        .text(seller.substring(0, 15) + "...");
      assetTemplateSell.find(".btn-buy").show();
      assetTemplateSell.find(".btn-remove").hide();
      //assetTemplateSell.find("remove-asset-market").hide(); !NotNeeded
    }

    // add this new asset
    assetsRow.append(assetTemplateSell.html());
  },

  /**
   * Display assetsForSale from the market
   * param  {uint256}  id [asset id]
   * param  {address}  seller [asset seller/owner]
   * param  {string}   name [asset name]
   * param  {uint256}  serialID [asset serialIdentifier]
   * param  {uint256}  price [asset price]
   */
  displayOwnedAsset: (id, seller, name, serialID, price) => {
    // Retrieve the asset placeholder
    const assetsRow2 = $("#assetsRow2");

    //Converts wei value into a ether value
    const etherPrice = web3.utils.fromWei(price, "ether");

    // Retrieve and fill the asset template
    var assetTemplateCreate = $("#assetTemplateCreate");
    assetTemplateCreate.find(".asset-name-create").text(name);
    assetTemplateCreate.find(".asset-serialID-create").text(serialID);
    assetTemplateCreate.find(".asset-price-create").text(etherPrice + " ETH");
    assetTemplateCreate.find(".btn-buy").attr("data-id", id);
    assetTemplateCreate.find(".btn-buy").attr("data-value", etherPrice);
    assetTemplateCreate.find(".btn-transactionHistory");
    //.attr("data-id", uniqueId);
    assetTemplateCreate.find(".btn-transactionHistorySell");
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
      assetTemplateCreate.find(".asset-seller-create").text("You");
      assetTemplateCreate.find(".btn-buy");
      // add this new asset
      assetsRow2.append(assetTemplateCreate.html());
    }
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
