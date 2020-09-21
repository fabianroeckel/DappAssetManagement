pragma solidity >0.4.99 <0.8.0;

contract DappAssetCordinator {
    struct Asset {
        uint256 id;
        string name;
        string description;
    }
    uint256 assetID = 0;
    //no Asset at 0
    Asset[] allAssets;

    mapping(uint256 => uint256) positionToAssetIDMapping;

    mapping(uint256 => uint256) assetIDToPositionMap;

    ///@dev Mapps all the asstets to their owners
    mapping(uint256 => address) assetIDToOwnerAddress;

    ///@dev Mapps all addresses to a number of assets thy own
    mapping(address => uint256) totalAssetsOfAddress;

    ///@dev Mapps for every Address the an Arry of Asset IDs owned by the Address
    mapping(address => uint256[]) ownedAssetsOfAddress;

    mapping(uint256 => uint256) assetIDtoPositionOwnerArry;

    // MARKET AREA
    //Idee für dne Markt
    struct MarktSell {
        uint256 assetID;
        uint256 price;
        address owner;
    }
    // markt
    MarktSell[] marketPlace;
    uint256 numberOfAssetsForSale = 0;

    //Mapping Id to spot in Marketplace
    mapping(uint256 => uint256) findSpotMarketPlace;

    //History implemented
    mapping(uint256 => address[]) idToHistoryOfOwners;
    mapping(uint256 => uint256[]) idToDateOfTransfer;

    function createAsset(string memory _name, string memory _description)
        public
        returns (uint256)
    {
        assetID++;
        //ID Placing Strukture implemented
        uint256 lengthArray = allAssets.length - 1;
        positionToAssetIDMapping[lengthArray] = assetID;
        assetIDToPositionMap[assetID] = lengthArray;

        allAssets.push(Asset(assetID, _name, _description));
        assetIDToOwnerAddress[assetID] = msg.sender;

        //total address Counter‚
        address senderAddress = msg.sender;
        uint256 assetCount = totalAssetsOfAddress[senderAddress];
        totalAssetsOfAddress[senderAddress] = assetCount + 1;

        //Problem! -check if push is effected by delets ?   -all the other owned asses
        ownedAssetsOfAddress[senderAddress].push(assetID);

        return assetID;
    }

    // Function for History here !!
    //returns the two arrays both same length with owners and a unixTimestamp
    //so the first owner with the unixtime he got that object is arryOfOwners[0], meunixTimeStamp[0]
    function showAssetHistory(uint256 assetID)
        public
        view
        returns (
            address[] memory arryOfOwners,
            uint256[] memory meunixTimeStamp
        )
    {}

    function sellAssetOnMarket(uint256 _assetID, uint256 price)
        public
        onlyOwner(_assetID)
    {
        numberOfAssetsForSale++;
        //Problem! need to check if -1 is real spot at Market and with length give position
        findSpotMarketPlace[_assetID] = marketPlace.length - 1;
        marketPlace.push(
            MarktSell(_assetID, price, assetIDToOwnerAddress[_assetID])
        );

        emit NewAssetOnMarket(
            uint256(_assetID),
            uint256(price),
            string(allAssets[assetIDToPositionMap[_assetID]].name),
            string(allAssets[assetIDToPositionMap[_assetID]].description)
        );
    }

    //TODO! Delet from Market and delet from mapping add to owner and ownerMapping
    function buyAssetFromMarket(uint256 id) public payable safeBuying(id) {}

    //TODO! returns Arikel IDs available for sale need mapping to get real IDs
    function getAllAssetOnMarket() public view returns (uint256[] memory) {}

    //TODO! use Mapping to get the ID Array and convert with positionMapping and countofAssetsOwned by Account
    function getAllAssetsOwnedByAddress(address _addressOwner)
        public
        returns (uint256)
    {}

    //TODO! use allAssets and use totallAccountofAssets
    function getAllAssetsExisting() public returns (uint256[] memory) {}

    //TODO!  delte Object by owner mapping and restructuring COMPLICATED! Problem!
    function deleteAssetByID(uint256 _assetID) public {}

    //Problem! check if the returns of ID is good idea
    function sellDirectToTheMarket(
        string memory _name,
        string memory _description,
        uint256 _price
    ) public returns (uint256) {
        uint256 _assetID = createAsset(_name, _description);
        sellAssetOnMarket(_assetID, _price);
        return _assetID;
    }

    function getNumberOfAssetsForSale() public view returns (uint256) {
        return numberOfAssetsForSale;
    }

    event NewAssetOnMarket(
        uint256 assetID,
        uint256 pirceOfAsset,
        string nameOfAsset,
        string descripition
    );

    event AssetSoldOnMarket(
        uint256 assetID,
        uint256 nameOfAsset,
        address soldByAddress,
        address boughtByAddress
    );

    event NewAssetCrated(
        uint256 assetID,
        string nameOfAsset,
        address assetOwner,
        string description
    );

    event AssetSoldOnMarket(uint256 assetID);
    //checks if the asset id is really for sell
    modifier safeBuying(uint256 id) {
        require(
            marketPlace[findSpotMarketPlace[id]].assetID != id,
            "Asset does not exist at Market Place "
        );
        require(
            marketPlace[findSpotMarketPlace[id]].owner != msg.sender,
            "Seller cannot buy his own article"
        );
        require(
            marketPlace[findSpotMarketPlace[id]].price == msg.value,
            "Value provided does not match price of article"
        );
        _;
    }

    //makes sure only the owner of the asstet can use this functions
    //Problem! use position Mapping
    modifier onlyOwner(uint256 id) {
        require(msg.sender == assetIDToOwnerAddress[id]);
        _;
    }
}
