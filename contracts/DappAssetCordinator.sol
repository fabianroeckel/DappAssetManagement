pragma solidity >0.4.99 <0.8.0;

contract DappAssetCordinator {
    struct Asset {
        uint256 id;
        string name;
        string description;
        address owner;
    }
    //no Asset with  0
    uint256 assetID = 0;
    //no Asset at 0
    Asset[] allAssets;
    uint256 totalNumberAssets;

    mapping(uint256 => uint256) assetIDToPosition;

    ///@dev Mapps all the asstets to their owners
    mapping(uint256 => address) assetIDToOwnerAddress;

    ///@dev Mapps all addresses to a number of assets thy own
    mapping(address => uint256) numberAssetsOfAddress;

    ///@dev Mapps for every Address the an Arry of Asset IDs owned by the Address
    mapping(address => uint256[]) assetIDsByAddress;

    mapping(uint256 => uint256) assetIDtoPositionInOwnerArray;

    //  -   -   -   -   -   - Market   -   -   -   -   -   -   -
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
    mapping(uint256 => uint256) idToSpotOnMarket;

    //  -   -   -   -^   -   -^ Market ^ -   -^   -   -   -   -   -

    //HistoryOfOwners
    mapping(uint256 => address[]) addToHistoryOfOwners;
    mapping(uint256 => uint256[]) addToDateOfTransfer;

    function createAsset(string memory _name, string memory _description)
        public
        returns (uint256)
    {
        //global count upgradet !
        assetID++;

        //ID Placing Strukture implemented
        totalNumberAssets++;

        //add element to totalAssetCount
        numberAssetsOfAddress[msg.sender] += 1;

        //spot to find Asset in allAsset Array
        assetIDToPosition[assetID] = allAssets.length - 1;

        //adding to allAssets
        allAssets.push(Asset(assetID, _name, _description, msg.sender));

        //setting owneraddress in Mapping for id of the asset
        assetIDToOwnerAddress[assetID] = msg.sender;

        //uint256 assetCount = numberAssetsOfAddress[msg.sender];

        //Problem! -check if length is effected by delets ?
        //set up Address to Assets structure
        assetIDsByAddress[msg.sender].push(assetID);
        assetIDtoPositionInOwnerArray[assetID] = assetIDsByAddress[msg.sender]
            .length;

        return assetID;
    }

    // Function for History here !!
    //returns the two arrays both same length with owners and a unixTimestamp
    //so the first owner with the unixtime he got that object is arryOfOwners[0], meunixTimeStamp[0]
    function showAssetHistory(uint256 _assetID)
        public
        view
        returns (
            address[] memory historyOwners,
            uint256[] memory meunixTimeStamp
        )
    {
        return (addToHistoryOfOwners[_assetID], addToDateOfTransfer[_assetID]);
    }

    function sellAssetOnMarket(uint256 _assetID, uint256 price)
        public
        onlyOwner(_assetID)
    {
        numberOfAssetsForSale++;
        //Problem! need to check if -1 is real spot at Market and with length give position
        idToSpotOnMarket[_assetID] = marketPlace.length - 1;
        marketPlace.push(
            MarktSell(_assetID, price, assetIDToOwnerAddress[_assetID])
        );

        emit NewAssetOnMarket(
            uint256(_assetID),
            uint256(price),
            string(allAssets[assetIDToPosition[_assetID]].name),
            string(allAssets[assetIDToPosition[_assetID]].description)
        );
    }

    //TODO! Delet from Market and delet from mapping add to owner and ownerMapping
    function buyAssetFromMarket(uint256 id) public payable safeBuying(id) {}

    //TODO! returns Arikel IDs available for sale need mapping to get real IDs
    function getAllAssetOnMarket() public view returns (uint256[] memory) {}

    //TODO! use Mapping to get the ID Array and convert with positionMapping and countofAssetsOwned by Account
    function getAllAssetsOwnedByAddress(address _addressOwner)
        public
        returns (uint256[] memory)
    {
        assetIDsByAddress[_addressOwner];

        return assetIDsByAddress[_addressOwner];
    }

    //TODO! use allAssets and use totallAccountofAssets
    function getAllAssetsExisting() public returns (uint256[] memory) {}

    //TODO!  delte Object by owner mapping and restructuring COMPLICATED! Problem!
    function deleteAssetByID(uint256 _assetID) public onlyOwner(_assetID) {
        //-   -   -   Deleting from allAssets
        //Set last element at new spot and delete last Spot of Array
        if (totalNumberAssets > 1) {
            allAssets[assetIDToPosition[_assetID]] = allAssets[assetIDToPosition[totalNumberAssets]];
            assetIDToPosition[_assetID] = assetIDToPosition[allAssets[assetIDToPosition[totalNumberAssets]]
                .id];

            delete (allAssets[assetIDToPosition[totalNumberAssets]]);
        } else {
            delete allAssets[assetIDToPosition[_assetID]];
        }

        //-   -   -   Deleting links to address
        //delete mapping to address
        address ownerAddress = assetIDToOwnerAddress[assetID];
        delete (assetIDToOwnerAddress[assetID]);
        //decease number of Assets owend by the Address
        numberAssetsOfAddress[ownerAddress] -= 1;

        uint256 spotOwnerArray = assetIDtoPositionInOwnerArray[_assetID];

        //-   -   -   Deleting from Assets of Address
        //rearrange assets in Owner Array if more than 1
        if (assetIDsByAddress[ownerAddress].length > 1) {
            uint256 spotLastElement = assetIDsByAddress[ownerAddress].length -
                1;
            //Up date mapping to Asset for last Element


                uint256 lastAssetIDInList
             = assetIDsByAddress[ownerAddress][spotLastElement];
            assetIDtoPositionInOwnerArray[lastAssetIDInList] = spotOwnerArray;

            //Take last Element of Addresses Asset IDs and place it on the spot of the deleted Asset
            assetIDsByAddress[ownerAddress][spotOwnerArray] = assetIDsByAddress[ownerAddress][spotLastElement];
            delete assetIDsByAddress[ownerAddress][spotLastElement];
        } else {
            //only one Element in List just delete it
            delete assetIDsByAddress[ownerAddress][spotOwnerArray];
        }
        //!Problem dont works! realy good
    }

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
            marketPlace[idToSpotOnMarket[id]].assetID != id,
            "Asset does not exist at Market Place "
        );
        require(
            marketPlace[idToSpotOnMarket[id]].owner != msg.sender,
            "Seller cannot buy his own article"
        );
        require(
            marketPlace[idToSpotOnMarket[id]].price == msg.value,
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
