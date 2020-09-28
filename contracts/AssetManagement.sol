pragma solidity >0.4.99 <0.8.0;

contract AssetManagement {
    // Custom types
    struct Article {
        uint256 id;
        address payable seller;
        address buyer;
        string name;
        uint256 serialID;
        uint256 price;
        //address[] history;
    }

    // State variables
    uint256 articleCounter;
    uint256 articleCounterSell;

    //All articles on the market (onMarket)
    mapping(uint256 => Article) public articles;

    //All articles !not! on the market (offMarket)
    mapping(uint256 => Article) public ownArticles;

    mapping(uint256 => bool) private serialIDVerification;

    //-    -   -   -   -   -   -   -                                     -   -   -   History
    mapping(uint256 => address[]) public ownerHistory;
    mapping(uint256 => uint256[]) public timeStamps;

    function setTimeAndOwner(uint256 _serialID) internal {
        ownerHistory[_serialID].push(msg.sender);
        timeStamps[_serialID].push(block.timestamp);
    }

    function getTimeAndOwner(uint256 _serialID, uint256 position)
        public
        view
        returns (address owner, uint256 time)
    {
        return (
            ownerHistory[_serialID][position],
            timeStamps[_serialID][position]
        );
    }

    function getArrayLength(uint256 _serialID)
        public
        view
        returns (uint256 arraylength)
    {
        return ownerHistory[_serialID].length;
    }

    //-    -   -   -   -   -   -   -      ^       ^      ^      -   -   -   History
    // Events

    // Event: new article is now for sale
    event LogSellArticle(
        uint256 indexed _id,
        address indexed _seller,
        string _name,
        uint256 _price
    );

    // Event: article was bought 
    event LogBuyArticle(
        uint256 indexed _id,
        address indexed _seller,
        address indexed _buyer,
        string _name,
        uint256 _price
    );

    // Event: article was removed from market 
    event LogOffMarket(
        uint256 indexed _id,
        address indexed _seller,
        address indexed _buyer,
        string _name,
        uint256 _price
    );

    /**
    * Create new Asset, if serialID isn't taken
    * param  {String}  _name [name of the asset]
    * param  {uint256} _serialID [serial id of the asset]
    * param  {uint256} _price [price of the asset]
    */
    function createAsset(
        string memory _name,
        uint256 _serialID,
        uint256 _price
    ) public {
        //we only need one maybe require is the better Version //check for error while calling
        require(
            !serialIDVerification[_serialID],
            "serialId is allready taken and cant be claimed"
        );

        if (!serialIDVerification[_serialID]) {
            
            // a new article 
            articleCounter++;

            //check if _serialID is not taken
            serialIDVerification[_serialID] = true;

            // !ATENTION! Data for transaction history 
            setTimeAndOwner(_serialID);

            //creation of new article with input paramenter, adding article to mapping (offMarket)
            ownArticles[articleCounter] = Article(
                articleCounter,
                msg.sender,
                address(0),
                _name,
                _serialID,
                _price
            );
        }
    }


    // fetch and returns all article IDs availablle (offMarket)
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

    // sell an article, creates a new article which is directly for sale (onMarket)
    function sellArticle(
        string memory _name,
        uint256 _serialID,
        uint256 _price
    ) public {
        require(
            !serialIDVerification[_serialID],
            "serialId is allready taken and cant be claimed"
        );
        if (!serialIDVerification[_serialID]) {
            setTimeAndOwner(_serialID);
            serialIDVerification[_serialID] = true;
            // a new article
            articleCounterSell++;
            // store this article
            articles[articleCounterSell] = Article(
                articleCounterSell,
                msg.sender,
                address(0),
                _name,
                _serialID,
                _price
            );
        }
        // trigger the event
        emit LogSellArticle(articleCounterSell, msg.sender, _name, _price);
    }

    /**
    * Sell owned asset, which was already created
    * param  {uint256}  _articleId [articleID from asset]
    * param  {uint256} _sellPrice  [price from asset]
    */
    function sellOwnArticle(uint256 _articleId, uint256 _sellPrice) public {

        //retrieve article from mapping and store it
        Article storage articleForSell = ownArticles[_articleId];

        //checking if seller is locked in account
        if (msg.sender == articleForSell.seller) {

            // a new article
            articleCounterSell++;

            //Create new article & store this article
            articles[articleCounterSell] = Article(
                articleCounterSell,
                articleForSell.seller,
                address(0),
                articleForSell.name,
                articleForSell.serialID,
                _sellPrice
            );

            //emit Event for market event ticker 
            emit LogSellArticle(
                articleCounterSell,
                msg.sender,
                articleForSell.name,
                articleForSell.price
            );

            //delete old article
            delete (ownArticles[_articleId].seller);
            delete (ownArticles[_articleId]);
        }
    }

    /**
    * Remove asset from market back to owned Assets
    * param  {uint256}  _articleId [articleID from asset]
    */
    function removeFromMarket(uint256 _id) public {
        //retrieve article from mapping and store it
        Article storage article = articles[_id];

        // a new article
        articleCounter++;

        //create & store this article
        ownArticles[articleCounter] = Article(
            articleCounter,
            article.seller,
            address(0),
            article.name,
            article.serialID,
            article.price
        );

        //emit Event for market ticker  
        emit LogOffMarket(
            article.id,
            article.seller,
            article.buyer,
            article.name,
            article.price
        );

        //delete old article
        delete (articles[_id]);
    }

    /**
    * Buy Asset from market
    * param  {uint256}  _articleId [articleID from asset]
    */
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

        //add Article to all the article owned by some one and not for sale
        ownArticles[articleCounter] = article;

        // the buyer can buy the article
        article.seller.transfer(msg.value);

        // keep buyer's information
        article.buyer = msg.sender;

        //add to hisory
        setTimeAndOwner(article.serialID);

        //selller is new owner
        article.seller = msg.sender;

        // trigger the event for market ticker
        emit LogBuyArticle(
            _id,
            article.seller,
            article.buyer,
            article.name,
            article.price
        );

        //create new article
        articleCounter++;
        ownArticles[articleCounter] = Article(
            articleCounter,
            article.seller,
            address(0),
            article.name,
            article.serialID,
            article.price
        );

        //delet Asset form Market
        delete (articles[_id]);
    }

    // fetch and returns all article IDs available for sale
    function getArticlesForSale() public view returns (uint256[] memory) {

        // we check whether there is at least one article
        if (articleCounterSell == 0) {
            return new uint256[](0);
        }

        // prepare output arrays
        uint256[] memory articleIds = new uint256[](articleCounterSell);

        //initialize var
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
