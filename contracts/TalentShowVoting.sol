// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

//Contract Deployed on Sepolia -> 0x2D338f3ebD1dC0B5456AAe71cdFAdF8Be3d3CfdC

// Custom errors
error NotOwner(address caller);
error InvalidAddress();
error VotingAlreadyStarted();
error VotingNotStarted();
error VotingAlreadyEnded();
error AlreadyVoted();
error InvalidFinalist();
error FinalistCannotBeJudge();
error WeightageNotSet();
error NoJudgesOrFinalists();
error VotingNotEnded();
error AlreadyFinalist();
error AlreadyJudge();

contract WorldGotTalent {
    address public immutable owner;

    uint256 public judgeVote;
    uint256 public audienceVote;
    bool public votingStarted;
    bool public ended;

    mapping(address => uint256) public finalistsPoints;
    mapping(address => bool) public isJudge;
    mapping(address => bool) public isFinalist;
    mapping(address => bool) public hasVoted;

    address[] public finalists;
    address[] public judges;
    address[] public winners;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if(msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }

    modifier beforeVoting() {
        if(votingStarted) revert VotingAlreadyStarted();
        if(ended) revert VotingAlreadyEnded();
        _;
    }

    modifier duringVoting() {
        if(!votingStarted) revert VotingNotStarted();
        if(ended) revert VotingAlreadyEnded();
        _;
    }

    event JudgesSelected(address[] judges);
    event FinalistsSelected(address[] finalists);
    event WeightageSet(uint256 judgeWeight, uint256 audienceWeight);
    event VotingStarted();
    event VoteCast(address indexed voter, address indexed finalist, uint256 weight);
    event VotingEnded(address[] winners);

    function selectJudges(address[] memory arrayOfAddresses) public onlyOwner beforeVoting {
        if(arrayOfAddresses.length == 0) revert InvalidAddress();
        for(uint256 i = 0; i < arrayOfAddresses.length; i++) {
            if(arrayOfAddresses[i] == address(0)) revert InvalidAddress();
            if(isFinalist[arrayOfAddresses[i]]) revert FinalistCannotBeJudge();
            if(!isJudge[arrayOfAddresses[i]]) {
                isJudge[arrayOfAddresses[i]] = true;
                judges.push(arrayOfAddresses[i]);
            }
        }
        emit JudgesSelected(arrayOfAddresses);
    }

    function selectFinalists(address[] memory arrayOfAddresses) public onlyOwner beforeVoting {
        if(arrayOfAddresses.length == 0) revert InvalidAddress();
        for(uint256 i = 0; i < arrayOfAddresses.length; i++) {
            if(arrayOfAddresses[i] == address(0)) revert InvalidAddress();
            if(isJudge[arrayOfAddresses[i]]) revert FinalistCannotBeJudge();
            if(!isFinalist[arrayOfAddresses[i]]) {
                isFinalist[arrayOfAddresses[i]] = true;
                finalists.push(arrayOfAddresses[i]);
            }
        }
        emit FinalistsSelected(arrayOfAddresses);
    }

    function inputWeightage(uint256 judgeWeightage, uint256 audienceWeightage) public onlyOwner beforeVoting {
        if(judgeWeightage == 0 || audienceWeightage == 0) revert InvalidAddress();
        judgeVote = judgeWeightage;
        audienceVote = audienceWeightage;
        emit WeightageSet(judgeWeightage, audienceWeightage);
    }

    function startVoting() public onlyOwner beforeVoting {
        if(judges.length == 0 || finalists.length == 0) revert NoJudgesOrFinalists();
        if(judgeVote == 0 || audienceVote == 0) revert WeightageNotSet();
        votingStarted = true;
        emit VotingStarted();
    }

    function castVote(address finalistAddress) public duringVoting {
        if(hasVoted[msg.sender]) revert AlreadyVoted();
        if(!isFinalist[finalistAddress]) revert InvalidFinalist();

        uint256 voteWeight = isJudge[msg.sender] ? judgeVote : audienceVote;

        finalistsPoints[finalistAddress] += voteWeight;
        hasVoted[msg.sender] = true;

        emit VoteCast(msg.sender, finalistAddress, voteWeight);
    }

    function endVoting() public onlyOwner duringVoting {
        ended = true;

        uint256 maxPoints = 0;
        for(uint256 i = 0; i < finalists.length; i++) {
            if(finalistsPoints[finalists[i]] > maxPoints) {
                maxPoints = finalistsPoints[finalists[i]];
            }
        }

        delete winners;
        for(uint256 i = 0; i < finalists.length; i++) {
            if(finalistsPoints[finalists[i]] == maxPoints) {
                winners.push(finalists[i]);
            }
        }

        emit VotingEnded(winners);
    }

    function showResult() public view returns (address[] memory) {
        if(!ended) revert VotingNotEnded();
        return winners;
    }
}