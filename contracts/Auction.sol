// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

//Deployed in Sepolia -> contract Address :0x0051aa77359c6662F2F62354814754b70fa1ef43
// Custom errors
error NotOwner(address caller);
error ItemAlreadyExists();
error ItemDoesNotExist();
error InvalidValues();
error AuctionNotActive();
error BidTooLow();
error IncorrectPayment();
error AuctionEnded();

contract Auction {

    address public immutable owner;
    
    constructor() {
        owner = msg.sender;
    }

    struct details {
        uint256 _startingPrice;
        uint256 _duration;
        uint256 high;
        address highbid;
        bool status;
    }
    mapping(uint256 => details) itemlist;

    modifier onlyOwner() {
        if(msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }

    modifier itemCheck(uint256 itemNumber) {
        if(itemlist[itemNumber]._duration == 0) revert ItemDoesNotExist();
        _;
    }

    modifier checkActive(uint256 itemNumber) {
        if(itemlist[itemNumber]._duration <= block.timestamp || itemlist[itemNumber].status == false) revert AuctionNotActive();
        _;
    }

    function createAuction(uint256 itemNumber, uint256 startingPrice, uint256 duration) public onlyOwner {
        if(itemlist[itemNumber]._duration != 0) revert ItemAlreadyExists();
        if(startingPrice == 0 || duration == 0) revert InvalidValues();

        itemlist[itemNumber]._startingPrice = startingPrice;
        itemlist[itemNumber]._duration = block.timestamp + duration;
        itemlist[itemNumber].high = startingPrice;
        itemlist[itemNumber].status = true;
    }

    function bid(uint256 itemNumber, uint256 bidAmount) public payable 
    itemCheck(itemNumber) 
    checkActive(itemNumber) {
        if(bidAmount <= itemlist[itemNumber].high) revert BidTooLow();
        if(msg.value != bidAmount) revert IncorrectPayment();

        itemlist[itemNumber].high = bidAmount;
        itemlist[itemNumber].highbid = msg.sender;
    }

    function cancelAuction(uint256 itemNumber) public 
    onlyOwner 
    itemCheck(itemNumber) 
    checkActive(itemNumber) {
        itemlist[itemNumber].status = false;
    }

    function checkAuctionActive(uint256 itemNumber) public view returns (bool) {
        return itemlist[itemNumber]._duration > block.timestamp && itemlist[itemNumber].status == true;
    }

    function timeLeft(uint256 itemNumber) public view 
    itemCheck(itemNumber) 
    returns (uint256) {
        if(itemlist[itemNumber]._duration <= block.timestamp) revert AuctionEnded();
        return itemlist[itemNumber]._duration - block.timestamp;
    }

    function checkHighestBidder(uint256 itemNumber) public view returns (address) {
        if(itemlist[itemNumber]._duration == 0 || itemlist[itemNumber].status == false) {
            return address(0);
        }
        return itemlist[itemNumber].highbid;
    }

    function checkActiveBidPrice(uint256 itemNumber) public view 
    itemCheck(itemNumber) 
    checkActive(itemNumber) 
    returns (uint256) {
        return itemlist[itemNumber].high;
    }
}