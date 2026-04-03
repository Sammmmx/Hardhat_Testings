//SPDX-License-Identifier:MIT

pragma solidity ^0.8.26;

// Custom errors
error NotOwner(address caller);
error EmptyTransaction();
error InvalidAmount();
error StakeEmpty();
error TransactionFailed();

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external;
    function transfer(address to, uint256 amount) external ;
}

contract Staking {

    uint256 Token_storage;
    uint256 ETH_storage;
    address public immutable owner;
    IERC20 public immutable stakingToken;

    constructor(address _tokenAddress) {
        owner = msg.sender;
        stakingToken = IERC20(_tokenAddress);
    }

    struct details{
        uint256 Total_Stake;
        uint256 Time_Deposited;
        uint256 Total_Rewards;
    } 
    mapping(address => details) Stakers;

    modifier checkStake() {
        require(Stakers[msg.sender].Total_Stake > 0, StakeEmpty());
        _;
    }

    function deposit() public payable {
        require(msg.sender == owner, NotOwner(msg.sender));
        require(msg.value > 0, EmptyTransaction());
        ETH_storage += msg.value;
    }

    function stake(uint256 amount) public {
        require(amount > 0, InvalidAmount());
        uint256 _stake = Stakers[msg.sender].Total_Stake;
        uint256 current_time = block.timestamp;
        if(_stake > 0) {
            Stakers[msg.sender].Total_Rewards = CalculateRewards(Stakers[msg.sender].Total_Rewards, Stakers[msg.sender].Time_Deposited, _stake);
            Stakers[msg.sender].Time_Deposited = current_time;
        } else {
            Stakers[msg.sender].Time_Deposited = current_time;
        }
        Token_storage += amount;
        Stakers[msg.sender].Total_Stake += amount;
        stakingToken.transferFrom(msg.sender, address(this), amount);
    }

    function unstake(uint256 amount) public checkStake() {
        uint256 _stake = Stakers[msg.sender].Total_Stake;
        Stakers[msg.sender].Total_Rewards = CalculateRewards(Stakers[msg.sender].Total_Rewards, Stakers[msg.sender].Time_Deposited, _stake);
        Stakers[msg.sender].Time_Deposited = _stake == amount ? 0 : block.timestamp;
        Stakers[msg.sender].Total_Stake -= amount;
        Token_storage -= amount;
        stakingToken.transfer(msg.sender, amount);
    }

    function claimRewards() public checkStake() {
        uint256 rewards = CalculateRewards(Stakers[msg.sender].Total_Rewards, Stakers[msg.sender].Time_Deposited, Stakers[msg.sender].Total_Stake);
        Stakers[msg.sender].Total_Rewards = 0;
        Stakers[msg.sender].Time_Deposited = block.timestamp;
        ETH_storage -= rewards;
        (bool success, ) = (msg.sender).call{value:rewards}("");
        require(success, TransactionFailed());
    }

    function CalculateRewards(uint256 current, uint256 time, uint256 _stake) internal view returns(uint256) {
        return current + ((block.timestamp - time) * _stake / 1e18 / 1000);
    }
}