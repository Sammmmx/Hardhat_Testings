//SPDX-License-Identifier:MIT

pragma solidity ^0.8.23;

contract Logic2 {

    uint256 value;

    function increment() public {
        value++;
    }

    function decrement() public {
        value--;
    }
    function getCount() public view returns(uint256) {
        return value;
    }
}
