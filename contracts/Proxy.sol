//SPDX-License-Identifier:MIT

pragma solidity ^0.8.23;

contract proxy {

    uint256 public value;
    address public implementation;
    address public owner;

    constructor(address _implementation) {
        implementation = _implementation;
        owner = msg.sender;
    }

    event _upgrade(address newContract);

    function upgrade(address newImplementation) public {
        require(msg.sender == owner, "You are not Authorized");
        implementation = newImplementation;

        emit _upgrade(newImplementation);
    }

    fallback() external payable {
        (bool success, ) = implementation.delegatecall(msg.data);
        require(success, "Delegate Call Failed");
    }

    receive() external payable {}
}