pragma solidity >0.4.99 <0.8.0;

contract AssetManagement {
    // Custom types
    struct Article {
        uint id;
        address payable seller;
        address buyer;
        string name;
        string description;
        uint256 price;
    }

    // State variables
    mapping(uint => Article) public articles;
    uint articleCounter;
    address seller;
    address buyer;
    string name;
    string description;
    uint256 price;

    // Events
    event LogSellArticle (
        uint indexed _id,
        address indexed _seller,
        string _name,
        uint256 _price);

    event LogBuyArticle (
        uint indexed _id,
        address indexed _seller,
        address indexed _buyer,
        string _name,
        uint256 _price);

    // sell an article
    function sellArticle(string memory _name, string memory _description, uint256 _price) public {
        // a new article
        articleCounter++;

        // store this article
        articles[articleCounter] = Article(
            articleCounter,
            msg.sender,
            address(0),
            _name,
            _description,
            _price
        );

        // trigger the event
        emit LogSellArticle(articleCounter, msg.sender, _name, _price);
    }

    // buy an article
    function buyArticle(uint _id) public payable {

        // we check whether there is at least one article
        require(articleCounter > 0, "There should be at least one article");

        // we check whether the article exists
        require(_id > 0 && _id <= articleCounter, "Article with this id does not exist");

        // we retrieve the article
        Article storage article = articles[_id];

        // we check whether the article has not already been sold
        require(article.buyer == address(0), "Article was already sold");

        // we don't allow the seller to buy his/her own article
        require(article.seller != msg.sender, "Seller cannot buy his own article");

        // we check whether the value sent corresponds to the article price
        require(article.price == msg.value, "Value provided does not match price of article");

        // keep buyer's information
        article.buyer = msg.sender;

        // the buyer can buy the article
        article.seller.transfer(msg.value);

        // trigger the event
        emit LogBuyArticle(_id, article.seller, article.buyer, article.name, article.price);
    }

    // fetch the number of articles in the contract
    function getNumberOfArticles() public view returns (uint) {
        return articleCounter;
    }

    // fetch and returns all article IDs available for sale
    function getArticlesForSale() public view returns (uint[]memory) {
        // we check whether there is at least one article
        if(articleCounter == 0) {
            return new uint[](0);
        }

        // prepare output arrays
        uint[] memory articleIds = new uint[](articleCounter);

        uint numberOfArticlesForSale = 0;
        // iterate over articles
        for (uint i = 1; i <= articleCounter; i++) {
            // keep only the ID for the article not already sold
            if (articles[i].buyer == address(0)) {
                articleIds[numberOfArticlesForSale] = articles[i].id;
                numberOfArticlesForSale++;
            }
        }

        // copy the articleIds array into the smaller forSale array
        uint[] memory forSale = new uint[](numberOfArticlesForSale);
        for (uint j = 0; j < numberOfArticlesForSale; j++) {
            forSale[j] = articleIds[j];
        }
        return forSale;
    }
}
