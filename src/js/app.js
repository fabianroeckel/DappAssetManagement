App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  loading: false,

  init: async () => {
    return App.initWeb3();
  },

  initWeb3: async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.enable();
        App.displayAccountInfo();
        return App.initContract();
      } catch (error) {
        //user denied access
        console.error(
          "Unable to retrieve your accounts! You have to approve this application on Metamask"
        );
      }
    } else if (window.web3) {
      window.web3 = new Web3(web3.currentProvider || "ws://localhost:8545");
      App.displayAccountInfo();
      return App.initContract();
    } else {
      //no dapp browser
      console.log(
        "Non-ethereum browser detected. You should consider trying Metamask"
      );
    }
  },

  displayAccountInfo: async () => {
    const accounts = await window.web3.eth.getAccounts();
    App.account = accounts[0];
    $("#account").text(App.account);
    const balance = await window.web3.eth.getBalance(App.account);
    $("#accountBalance").text(
      window.web3.utils.fromWei(balance, "ether") + " ETH"
    );
  },

  initContract: async () => {
    $.getJSON("AssetManagement.json", (AssetmanagementArtifact) => {
      App.contracts.AssetManagement = TruffleContract(AssetmanagementArtifact);
      App.contracts.AssetManagement.setProvider(window.web3.currentProvider);
      App.listenToEvents();
      return App.reloadArticles();
    });
  },

  // Listen to events raised from the contract
  listenToEvents: async () => {
    const assetManagementInstance = await App.contracts.AssetManagement.deployed();
    if (App.logSellArticleEventListener == null) {
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
    if (App.logBuyArticleEventListener == null) {
      App.logBuyArticleEventListener = assetManagementInstance
        .LogBuyArticle({ fromBlock: "0" })
        .on("data", (event) => {
          $("#" + event.id).remove();
          $("#events").append(
            '<li class="list-group-item" id="' +
              event.id +
              '">' +
              event.returnValues._buyer +
              " bought " +
              event.returnValues._name +
              "</li>"
          );
          App.reloadArticles();
        })
        .on("error", (error) => {
          console.error(error);
        });
    }

    $(".btn-subscribe").hide();
    $(".btn-unsubscribe").show();
    $(".btn-show-events").show();
  },

  sellArticle: async () => {
    const articlePriceValue = parseFloat($("#article_price_sell").val());
    const articlePrice = isNaN(articlePriceValue)
      ? "0"
      : articlePriceValue.toString();
    const _name = $("#article_name_sell").val();
    const _description = $("#article_description_sell").val();
    const _price = window.web3.utils.toWei(articlePrice, "ether");
    if (_name.trim() == "" || _price === "0") {
      return false;
    }
    try {
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();
      const transactionReceipt = await assetManagementInstance
        .sellArticle(_name, _description, _price, {
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
  },

  createAsset: async () => {
    console.log("creating");
    const articlePriceValueCreate = parseFloat(
      $("#article_price_create").val()
    );
    const articlePriceCreate = isNaN(articlePriceValueCreate)
      ? "0"
      : articlePriceValueCreate.toString();
    const _nameCreate = $("#article_name_create").val();
    const _descriptionCreate = $("#article_description_create").val();
    const _priceCreate = window.web3.utils.toWei(articlePriceCreate, "ether");
    if (_nameCreate.trim() == "" || _priceCreate === "0") {
      return false;
    }
    try {
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();
      const transactionReceipt = await assetManagementInstance
        .createAsset(_nameCreate, _descriptionCreate, _priceCreate, {
          from: App.account,
          gas: 5000000,
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

    // retrieve the article price
    var _articleId = $(event.target).data("id");
    const articlePriceValue = parseFloat($(event.target).data("value"));
    const articlePrice = isNaN(articlePriceValue)
      ? "0"
      : articlePriceValue.toString();
    const _price = window.web3.utils.toWei(articlePrice, "ether");
    try {
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();
      const transactionReceipt = await assetManagementInstance
        .buyArticle(_articleId, {
          from: App.account,
          value: _price,
          gas: 500000,
        })
        .on("transactionHash", (hash) => {
          console.log("transaction hash", hash);
        });
      console.log("transaction receipt", transactionReceipt);
    } catch (error) {
      console.error(error);
    }
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
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();
      const articleIds = await assetManagementInstance.getArticlesForSale();
      $("#articlesRow").empty();
      for (let i = 0; i < articleIds.length; i++) {
        const article = await assetManagementInstance.articles(articleIds[i]);
        App.displayArticle(
          article[0],
          article[1],
          article[3],
          article[4],
          article[5]
        );
      }
      App.loading = false;
    } catch (error) {
      console.error(error);
      App.loading = false;
    }

    try {
      const assetManagementInstance = await App.contracts.AssetManagement.deployed();
      const articleIds2 = await assetManagementInstance.getOwnedAssets();
      $("#articlesRow2").empty();
      for (let i = 0; i < articleIds2.length; i++) {
        const article = await assetManagementInstance.ownArticles(
          articleIds2[i]
        );
        App.displayOwnedArticle(
          article[0],
          article[1],
          article[3],
          article[4],
          article[5]
        );
      }
      App.loading = false;
    } catch (error) {
      console.error(error);
      App.loading = false;
    }
  },

  displayArticle: (id, seller, name, description, price) => {
    // Retrieve the article placeholder
    const articlesRow = $("#articlesRow");
    const etherPrice = web3.utils.fromWei(price, "ether");

    // Retrieve and fill the article template
    var articleTemplateSell = $("#articleTemplateSell");
    articleTemplateSell.find(".panel-title").text(name);
    articleTemplateSell.find(".article-description-sell").text(description);
    articleTemplateSell.find(".article-price-sell").text(etherPrice + " ETH");
    articleTemplateSell.find(".btn-buy").attr("data-id", id);
    articleTemplateSell.find(".btn-buy").attr("data-value", etherPrice);

    // seller?
    if (seller == App.account) {
      articleTemplateSell.find(".article-seller-sell").text("You");
      articleTemplateSell.find(".btn-buy").hide();
    } else {
      articleTemplateSell.find(".article-seller-sell").text(seller);
      articleTemplateSell.find(".btn-buy").show();
    }

    // add this new article
    articlesRow.append(articleTemplateSell.html());
  },

  displayOwnedArticle: (id, seller, name, description, price) => {
    // Retrieve the article placeholder
    const articlesRow2 = $("#articlesRow2");
    const etherPrice = web3.utils.fromWei(price, "ether");

    // Retrieve and fill the article template
    var articleTemplateCreate = $("#articleTemplateCreate");
    articleTemplateCreate.find(".panel-title").text(name);
    articleTemplateCreate.find(".article-description-create").text(description);
    articleTemplateCreate
      .find(".article-price-create")
      .text(etherPrice + " ETH");
    articleTemplateCreate.find(".btn-buy").attr("data-id", id);
    articleTemplateCreate.find(".btn-buy").attr("data-value", etherPrice);

    // seller?
    if (seller == App.account) {
      articleTemplateCreate.find(".article-seller-create").text("You");
      articleTemplateCreate.find(".btn-buy").hide();
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
