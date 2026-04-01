//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Custom errors
error InvalidAddress();
error InvalidAmount();
error InsufficientBalance();
error NotOwner(address caller);
error NotAllowed();

contract ERC20Permit {
    string public constant name = "JobToken";     
    string public constant symbol = "JBT";       
    uint8 public constant decimals = 18;         
    uint256 public immutable totalSupply;         
    address public immutable owner;               

    mapping(address => uint256) public Members;
    mapping(address => mapping(address => uint256)) public Allowances;

    constructor() {
        owner = msg.sender;
        totalSupply = 1000000 * 10 ** decimals;
        Members[owner] = totalSupply;
    }

    modifier checkAddress(address any) {
        require(any != address(0), InvalidAddress());
        _;
    }

    modifier checkBalance(address any, uint256 amount) {
        require(amount > 0, InvalidAmount());
        require(Members[any] >= amount, InsufficientBalance());
        _;
    }

    event _transfer(address _sender, address receiver, uint256 _amount);
    event _transferFrom(address _sender, address receiver, uint256 _amount);
    event _approve(address approver, address receiver, uint256 _amount);

    function Register(address member, uint256 amount) public 
    checkAddress(member)
    checkBalance(owner, amount) {
        require(msg.sender == owner, NotOwner(msg.sender));
        Members[owner] -= amount;
        Members[member] += amount;
    }

    function transfer(address _recepient, uint256 amount) public
    checkAddress(_recepient)
    checkBalance(msg.sender, amount) {
        Members[msg.sender] -= amount;
        Members[_recepient] += amount;
        emit _transfer(msg.sender, _recepient, amount);
    }

    function transferFrom(address sender, address _recepient, uint256 amount) public
    checkAddress(sender)
    checkAddress(_recepient)
    checkBalance(sender, amount) {
        require(Allowances[sender][msg.sender] >= amount, NotAllowed());
        Members[sender] -= amount;
        Members[_recepient] += amount;
        Allowances[sender][msg.sender] -= amount;
        emit _transferFrom(sender, _recepient, amount);
    }

    function approve(address _recepient, uint256 amount) public
    checkAddress(_recepient)
    checkBalance(msg.sender, amount) {
        Allowances[msg.sender][_recepient] = amount;
        emit _approve(msg.sender, _recepient, amount);
    }
}