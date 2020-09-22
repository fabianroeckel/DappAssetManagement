pragma solidity >0.4.99 <0.8.0;

contract AssetManagement {
    // Custom types
    struct Article {
        uint256 id;
        address payable seller;
        address buyer;
        string name;
        string description;
        uint256 price;
        //transaktion history
    }

    struct Transaction {
        address usedToBeOwner;
        //Unix time Sold
        uint256 timeStampUnixSold;
    }

    // State variables
    uint256 articleCounter;
    uint256 articleCounterSell;
    //address seller;
    //address buyer;
    //string name;
    //string description;
    //uint256 price;

    //Marktplatz
    mapping(uint256 => Article) public articles;

    //All articles !not! on the market
    mapping(uint256 => Article) public ownArticles;

    // Events
    event LogSellArticle(
        uint256 indexed _id,
        address indexed _seller,
        string _name,
        uint256 _price
    );

    event LogBuyArticle(
        uint256 indexed _id,
        address indexed _seller,
        address indexed _buyer,
        string _name,
        uint256 _price
    );

    //create new Asset for own vault
    function createAsset(
        string memory _name,
        string memory _description,
        uint256 _price
    ) public {
        // a new article
        articleCounter++;

        // store this article
        ownArticles[articleCounter] = Article(
            articleCounter,
            msg.sender,
            address(0),
            _name,
            _description,
            _price
        );
    }

    // fetch and returns all article IDs available for sale
    function getOwnedAssets() public view returns (uint256[] memory) {
        // we check whether there is at least one article
        if (articleCounter == 0) {
            return new uint256[](0);
        }

        // prepare output arrays
        uint256[] memory articleIds = new uint256[](articleCounter);
        uint256 numberOfArticlesOwned = 0;
        // iterate over articles
        for (uint256 i = 1; i <= articleCounter; i++) {
            if (ownArticles[i].id != 0) {
                articleIds[numberOfArticlesOwned] = ownArticles[i].id;
                numberOfArticlesOwned++;
            }
        }

        // copy the articleIds array into the smaller forSale array
        uint256[] memory ownedAssets = new uint256[](numberOfArticlesOwned);
        for (uint256 j = 0; j < numberOfArticlesOwned; j++) {
            ownedAssets[j] = articleIds[j];
        }
        //Problem! i change the ouput to see if its changes the outcame
        return ownedAssets;
    }

    // sell an article
    function sellArticle(
        string memory _name,
        string memory _description,
        uint256 _price
    ) public {
        // a new article
        articleCounterSell++;

        // store this article
        articles[articleCounterSell] = Article(
            articleCounterSell,
            msg.sender,
            address(0),
            _name,
            _description,
            _price
        );
        // trigger the event
        emit LogSellArticle(articleCounterSell, msg.sender, _name, _price);
    }

    function sentToMarket(uint256 _id) public {
        //we check wether there is at least one owned article
        require(
            articleCounter > 0,
            "There should be at least one owned article"
        );

        //we check whether the article exists
        require(
            _id > 0 && _id <= articleCounter,
            "Article with this id does not exits"
        );
        // we retrieve the article
        Article storage ownArticle = ownArticles[_id];

        //check if articel is allready deleted
        require(ownArticle.id != 0);

        articleCounterSell++;
        ownArticle.id = articleCounter;
        articles[articleCounterSell] = ownArticle;

        delete (ownArticles[_id]);
    }

    function sellOwnArticle(uint256 _articleId, uint256 _sellPrice) public {
        Article storage articleForSell = ownArticles[_articleId];
        if (msg.sender == articleForSell.seller) {
            // a new article
            articleCounterSell++;
            // store this article
            articles[articleCounterSell] = Article(
                articleCounterSell,
                articleForSell.seller,
                address(0),
                articleForSell.name,
                articleForSell.description,
                _sellPrice
            );
            delete (ownArticles[_articleId].seller);
            delete (ownArticles[_articleId]);
        }
    }

    //remove from market
    function removeFromMarket(uint256 _id) public {
        require(articles[_id].seller == msg.sender);
        articleCounter++;
        Article storage articleToMoveToOwn = articles[_id];
        ownArticles[articleCounter] = articleToMoveToOwn;
    }

    // buy an article
    function buyArticle(uint256 _id) public payable {
        // we check whether there is at least one article
        require(articleCounterSell > 0, "There should be at least one article");

        // we check whether the article exists
        require(
            _id > 0 && _id <= articleCounterSell,
            "Article with this id does not exist"
        );

        // we retrieve the article
        Article storage article = articles[_id];

        // we check whether the article has not already been sold
        require(article.buyer == address(0), "Article was already sold");

        //deleted Objects cant be bought
        require(article.id != 0);
        // we don't allow the seller to buy his/her own article
        require(
            article.seller != msg.sender,
            "Seller cannot buy his own article"
        );

        // we check whether the value sent corresponds to the article price
        require(
            article.price == msg.value,
            "Value provided does not match price of article"
        );

        //selller is new owner
        article.seller = msg.sender;
        articleCounter++;

        //importatnt to have right article id form the spot where its located
        article.id = articleCounter;

        //add Article to all the article owned by some one and not for sale
        ownArticles[articleCounter] = article;

        // the buyer can buy the article
        article.seller.transfer(msg.value);

        //delet Asset form Market

        // trigger the event
        emit LogBuyArticle(
            _id,
            article.seller,
            msg.sender,
            article.name,
            article.price
        );
        delete (articles[_id]);
        delete (articles[_id].seller);
    }

    //Problem! number is wrong   -Articles can change owner
    // fetch the number of articles in the contract
    function getNumberOfArticles() public view returns (uint256) {
        return articleCounter;
    }

    //Probelm! number is wrong -Articles can change owner and number jumps up
    // fetch the number of articles in the contract
    function getNumberOfSellingArticles() public view returns (uint256) {
        return articleCounterSell;
    }

    // fetch and returns all article IDs available for sale
    function getArticlesForSale() public view returns (uint256[] memory) {
        // we check whether there is at least one article
        if (articleCounterSell == 0) {
            return new uint256[](0);
        }

        // prepare output arrays
        uint256[] memory articleIds = new uint256[](articleCounterSell);

        uint256 numberOfArticlesForSale = 0;
        // iterate over articles
        for (uint256 i = 1; i <= articleCounterSell; i++) {
            // keep only the ID for the article id is 0 when deleted so check it
            //articels only exist if not deleted while swapping
            //Attention! deleted articles[i].buyer == address(0) &&
            if (articles[i].id != 0) {
                articleIds[numberOfArticlesForSale] = articles[i].id;
                numberOfArticlesForSale++;
            }
        }

        // copy the articleIds array into the smaller forSale array
        uint256[] memory forSale = new uint256[](numberOfArticlesForSale);
        for (uint256 j = 0; j < numberOfArticlesForSale; j++) {
            forSale[j] = articleIds[j];
        }
        //Attention! changeed the return because not needed ?
        return forSale;
    }
}
