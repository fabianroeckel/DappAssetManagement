pragma solidity >0.4.99 <0.8.0;

contract AssetManagement {
    // Custom types
    struct Asset {
        uint256 id;
        address payable seller;
        address buyer;
        string name;
        uint256 serialID;
        uint256 price;
    }

    //State variables for position -only used inside the contract
    uint256 internal assetCounter;
    uint256 internal assetCounterAssetsForSale;

    //All assetsForSale on the market (onMarket)
    mapping(uint256 => Asset) private assetsForSale;

    //All assetsForSale !not! on the market (offMarket)
    mapping(uint256 => Asset) private assetsNotForSale;

    //checking for allready existing serial nummbers
    mapping(uint256 => bool) private serialIDVerification;

    //get data from own assets, importanten to prevent mailicious over writting
    function getAssetNotForSale(uint256 id)
        public
        view
        returns (
            uint256,
            address,
            address,
            string memory,
            uint256,
            uint256
        )
    {
        return (
            assetsNotForSale[id].id,
            assetsNotForSale[id].seller,
            assetsNotForSale[id].buyer,
            assetsNotForSale[id].name,
            assetsNotForSale[id].serialID,
            assetsNotForSale[id].price
        );
    }

    //get data from assets on the Market, important to prevent mailicious over writting
    function getAssetForSaleByID(uint256 id)
        public
        view
        returns (
            uint256,
            address,
            address,
            string memory,
            uint256,
            uint256
        )
    {
        return (
            assetsForSale[id].id,
            assetsForSale[id].seller,
            assetsForSale[id].buyer,
            assetsForSale[id].name,
            assetsForSale[id].serialID,
            assetsForSale[id].price
        );
    }

    //-    -   -   -   -   -   -   -                                     -   -   -   History !notNeeded
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

    // Event: new asset is now for sale
    event LogSellAsset(
        uint256 indexed _id,
        address indexed _seller,
        string _name,
        uint256 _price
    );

    // Event: asset was bought
    event LogBuyAsset(
        uint256 indexed _id,
        address indexed _seller,
        address indexed _buyer,
        string _name,
        uint256 _price
    );

    // Event: asset was removed from market
    event LogOffMarket(
        uint256 indexed _id,
        address indexed _seller,
        address indexed _buyer,
        string _name,
        uint256 _price
    );

    /**
     * dev Create new Asset, if serialID isn't taken
     *   String  _name name of the asset
     *   uint256 _serialID serial id of the asset
     *   uint256 _price price of the asset
     */
    function createAsset(
        string memory _name,
        uint256 _serialID,
        uint256 _price
    ) public {
        //we only need one maybe require is the better Version //check for error while calling !notNeeded just one
        require(
            !serialIDVerification[_serialID],
            "serialId is allready taken and cant be claimed"
        );

        if (!serialIDVerification[_serialID]) {
            // a new asset
            assetCounter++;

            //check if _serialID is not taken
            serialIDVerification[_serialID] = true;

            // !ATENTION! Data for transaction history
            setTimeAndOwner(_serialID);

            //creation of new asset with input paramenter, adding asset to mapping (offMarket)
            assetsNotForSale[assetCounter] = Asset(
                assetCounter,
                msg.sender,
                address(0),
                _name,
                _serialID,
                _price
            );
        }
    }

    // fetch and returns all asset IDs availablle (offMarket)
    function getOwnedAssets() public view returns (uint256[] memory) {
        // we check whether there is at least one asset
        if (assetCounter == 0) {
            return new uint256[](0);
        }

        // prepare output arrays
        uint256[] memory assetIDs = new uint256[](assetCounter);
        uint256 numberOfAssetsOwned = 0;
        // iterate over assetsForSale
        for (uint256 i = 1; i <= assetCounter; i++) {
            if (assetsNotForSale[i].id != 0) {
                assetIDs[numberOfAssetsOwned] = assetsNotForSale[i].id;
                numberOfAssetsOwned++;
            }
        }

        // copy the assetIDs array into the smaller forSale array
        uint256[] memory ownedAssets = new uint256[](numberOfAssetsOwned);
        for (uint256 j = 0; j < numberOfAssetsOwned; j++) {
            ownedAssets[j] = assetIDs[j];
        }
        //Problem! i change the ouput to see if its changes the outcame
        return ownedAssets;
    }

    // sell an asset, creates a new asset which is directly for sale (onMarket)
    function sellAsset(
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
            // a new asset
            assetCounterAssetsForSale++;
            // store this asset
            assetsForSale[assetCounterAssetsForSale] = Asset(
                assetCounterAssetsForSale,
                msg.sender,
                address(0),
                _name,
                _serialID,
                _price
            );
        }
        // trigger the event
        emit LogSellAsset(assetCounterAssetsForSale, msg.sender, _name, _price);
    }

    /**
     * dev Sell owned asset, which was already created
     * uint256  _assetId assetId from asset
     * uint256 _sellPrice  price from asset
     */
    function sellOwnAsset(uint256 _assetId, uint256 _sellPrice) public {
        //retrieve asset from mapping and store it
        Asset storage assetForSale = assetsNotForSale[_assetId];

        //checking if seller is locked in account
        if (msg.sender == assetForSale.seller) {
            // a new asset
            assetCounterAssetsForSale++;

            //Create new asset & store this asset
            assetsForSale[assetCounterAssetsForSale] = Asset(
                assetCounterAssetsForSale,
                assetForSale.seller,
                address(0),
                assetForSale.name,
                assetForSale.serialID,
                _sellPrice
            );

            //emit Event for market event ticker
            emit LogSellAsset(
                assetCounterAssetsForSale,
                msg.sender,
                assetForSale.name,
                assetForSale.price
            );

            //delete old asset
            delete (assetsNotForSale[_assetId].seller);
            delete (assetsNotForSale[_assetId]);
        }
    }

    /**
     * dev Remove asset from market back to owned Assets
     * uint256  _assetId assetID from asset
     */
    function removeFromMarket(uint256 _id) public {
        //retrieve asset from mapping and store it
        Asset storage asset = assetsForSale[_id];

        // a new asset
        assetCounter++;

        //create & store this asset
        assetsNotForSale[assetCounter] = Asset(
            assetCounter,
            asset.seller,
            address(0),
            asset.name,
            asset.serialID,
            asset.price
        );

        //emit Event for market ticker
        emit LogOffMarket(
            asset.id,
            asset.seller,
            asset.buyer,
            asset.name,
            asset.price
        );

        //delete old asset
        delete (assetsForSale[_id]);
    }

    /**
     * dev Buy Asset from market
     * param  uint256  _assetId assetID from asset
     */
    function buyAsset(uint256 _id) public payable {
        // we check whether there is at least one asset
        require(
            assetCounterAssetsForSale > 0,
            "There should be at least one asset"
        );

        // we check whether the asset exists
        require(
            _id > 0 && _id <= assetCounterAssetsForSale,
            "Asset with this id does not exist"
        );

        // we retrieve the asset
        Asset storage asset = assetsForSale[_id];

        // we check whether the asset has not already been sold
        require(asset.buyer == address(0), "Asset was already sold");

        //deleted Objects cant be bought
        require(asset.id != 0);

        // we don't allow the seller to buy his/her own asset
        require(asset.seller != msg.sender, "Seller cannot buy his own asset");

        // we check whether the value sent corresponds to the asset price
        require(
            asset.price == msg.value,
            "Value provided does not match price of asset"
        );

        // the buyer can buy the asset
        asset.seller.transfer(msg.value);

        // keep buyer's information
        asset.buyer = msg.sender;

        //add to hisory
        setTimeAndOwner(asset.serialID);

        //selller is new owner
        asset.seller = msg.sender;

        // trigger the event for market ticker
        emit LogBuyAsset(
            _id,
            asset.seller,
            asset.buyer,
            asset.name,
            asset.price
        );

        //create new asset new asset inside the ownAsset mapping
        assetCounter++;
        assetsNotForSale[assetCounter] = Asset(
            assetCounter,
            asset.seller,
            address(0),
            asset.name,
            asset.serialID,
            asset.price
        );

        //delet Asset form Market
        delete (assetsForSale[_id]);
    }

    // fetch the number of articles in the contract
    function getNumberOfAssets() public view returns (uint256) {
        return assetCounter;
    }

    // fetch the number of articles in the contract
    function getNumberOfSellingAssets() public view returns (uint256) {
        return assetCounterAssetsForSale;
    }

    // fetch and returns all asset IDs available for sale
    function getAssetsForSale() public view returns (uint256[] memory) {
        // we check whether there is at least one asset
        if (assetCounterAssetsForSale == 0) {
            return new uint256[](0);
        }

        // prepare output arrays
        uint256[] memory assetIDs = new uint256[](assetCounterAssetsForSale);

        //initialize var
        uint256 numberOfAssetsForSale = 0;

        // iterate over assetsForSale
        for (uint256 i = 1; i <= assetCounterAssetsForSale; i++) {
            //keep only the ID for the asset id is 0 when deleted- so check it
            //assets only exist if not deleted while swapping
            if (assetsForSale[i].id != 0) {
                assetIDs[numberOfAssetsForSale] = assetsForSale[i].id;
                numberOfAssetsForSale++;
            }
        }

        // copy the assetIDs array into the smaller forSale array
        uint256[] memory forSale = new uint256[](numberOfAssetsForSale);
        for (uint256 j = 0; j < numberOfAssetsForSale; j++) {
            forSale[j] = assetIDs[j];
        }
        //Attention! changeed the return because not needed ?
        return forSale;
    }
}
