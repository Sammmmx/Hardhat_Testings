// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

//COntract Deployed on Sepolia -> 0xcA606d4184b148Ee7EEA89A74480Fc3001a36808

// Custom errors
error NotOwner(address caller);
error InvalidAddress();
error AlreadyMerchant();
error AlreadyStudent();
error NotStudent();
error NotMerchant();
error InvalidAmount();
error InsufficientCredits();
error OwnerCannotBeMerchant();
error OwnerCannotBeStudent();
error MerchantCannotBeStudent();
error StudentCannotBeMerchant();

contract ScholarshipCreditContract {
    address public immutable owner;
    uint256 public totalCredits = 1000000;

    constructor() {
        owner = msg.sender;
    }

    struct MerchantDetails {
        uint256 credits;
        bool registered;
    }

    struct StudentDetails {
        uint256 creditsAvailable;
        bool registered;
    }

    mapping(address => StudentDetails) public students;
    mapping(address => MerchantDetails) public merchants;

    modifier onlyOwner() {
        if(msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }

    modifier validAddress(address _address) {
        if(_address == address(0)) revert InvalidAddress();
        _;
    }

    event ScholarshipGranted(address indexed student, uint256 credits);
    event ScholarshipRevoked(address indexed student, uint256 credits);
    event MerchantRegistered(address indexed merchant);
    event MerchantDeregistered(address indexed merchant);
    event CreditsSpent(address indexed student, address indexed merchant, uint256 amount);

    function grantScholarship(address studentAddress, uint256 credits) public 
    onlyOwner 
    validAddress(studentAddress) {
        if(studentAddress == owner) revert OwnerCannotBeStudent();
        if(merchants[studentAddress].registered) revert MerchantCannotBeStudent();
        if(credits == 0 || credits > totalCredits) revert InvalidAmount();

        students[studentAddress].creditsAvailable += credits;
        students[studentAddress].registered = true;
        totalCredits -= credits;

        emit ScholarshipGranted(studentAddress, credits);
    }

    function registerMerchant(address merchantAddress) public 
    onlyOwner 
    validAddress(merchantAddress) {
        if(merchantAddress == owner) revert OwnerCannotBeMerchant();
        if(students[merchantAddress].registered) revert StudentCannotBeMerchant();
        if(merchants[merchantAddress].registered) revert AlreadyMerchant();

        merchants[merchantAddress].registered = true;

        emit MerchantRegistered(merchantAddress);
    }

    function deregisterMerchant(address merchantAddress) public 
    onlyOwner 
    validAddress(merchantAddress) {
        if(!merchants[merchantAddress].registered) revert NotMerchant();

        totalCredits += merchants[merchantAddress].credits;
        merchants[merchantAddress].credits = 0;
        merchants[merchantAddress].registered = false;

        emit MerchantDeregistered(merchantAddress);
    }

    function revokeScholarship(address studentAddress) public 
    onlyOwner 
    validAddress(studentAddress) {
        if(!students[studentAddress].registered) revert NotStudent();

        totalCredits += students[studentAddress].creditsAvailable;
        students[studentAddress].creditsAvailable = 0;
        students[studentAddress].registered = false;

        emit ScholarshipRevoked(studentAddress, students[studentAddress].creditsAvailable);
    }

    function spend(address merchantAddress, uint256 amount) public 
    validAddress(merchantAddress) {
        if(!students[msg.sender].registered) revert NotStudent();
        if(!merchants[merchantAddress].registered) revert NotMerchant();
        if(amount == 0 || amount > students[msg.sender].creditsAvailable) revert InsufficientCredits();

        students[msg.sender].creditsAvailable -= amount;
        merchants[merchantAddress].credits += amount;

        emit CreditsSpent(msg.sender, merchantAddress, amount);
    }

    function checkBalance() public view returns (uint256) {
        if(msg.sender == owner) return totalCredits;
        if(students[msg.sender].registered) return students[msg.sender].creditsAvailable;
        if(merchants[msg.sender].registered) return merchants[msg.sender].credits;
        revert InvalidAddress();
    }
}