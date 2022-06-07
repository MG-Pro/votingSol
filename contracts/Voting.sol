// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";

contract Voting {
  uint private constant votingPeriod = 259200;
  uint private constant votePayment = 0.01 ether;
  uint private votingCounter;
  uint private availableFees;
  address private owner;

  // Using only for output
  struct Candidate {
    address id;
    uint votes;
  }

  // Using only for output
  struct VotingData {
    uint id;
    uint fund;
    uint startDate;
    bool isExpired;
    bool isActive;
    address winner;
    Candidate[] candidates;
  }

  struct VotingItem {
    uint startDate;
    address winner;
    uint fund;
    uint count; // count of candidates
    uint winnerVotes;
    bool isActive;
    mapping(uint => address) mapper;     // index => candidate
    mapping(address => uint) candidates; // candidate => votes
    mapping(address => bool) voters;     // voters => isVoted
  }

  mapping(uint => VotingItem) private votings;

  modifier onlyOwner {
    require(msg.sender == owner, "Only for owner");
    _;
  }

  modifier onlyActive(uint id) {
    require(votings[id].isActive, "Voting does not active!");
    _;
  }

  constructor() {
    owner = msg.sender;
  }

  function createVoting(address[] memory _candidates) external onlyOwner {
    votingCounter++;
    votings[votingCounter].startDate = block.timestamp;
    votings[votingCounter].isActive = true;

    for(uint i; i < _candidates.length; i++) {
      require(!isExist(votingCounter, _candidates[i]), "Candidate duplicated!");
      // set 1 vote, 0 is candidate not exist yet
      votings[votingCounter].candidates[_candidates[i]] = 1;
      votings[votingCounter].mapper[votings[votingCounter].count] = _candidates[i];
      votings[votingCounter].count++;
    }
  }

  function getVotings() external view returns (VotingData[] memory votingItems) {
    if (votingCounter <= 0) {
      return votingItems;
    }

    votingItems = new VotingData[](votingCounter);
    for (uint i = 1; i <= votingCounter; i++) {
      votingItems[i-1] = VotingData(
        i,
        votings[i].fund,
        votings[i].startDate,
        isExpire(i),
        votings[i].isActive,
        votings[i].winner,
        toArray(i)
      );
    }
    return votingItems;
  }

  function vote(uint votingId, address _candidate) external payable onlyActive(votingId) {
    require(msg.value == votePayment, "Pay 0.01 eth");
    require(!isExpire(votingId), "Voting time expired!");
    require(isExist(votingId, _candidate), "Candidate do not exist!");
    require(!votings[votingId].voters[msg.sender], "Already voted!");

    votings[votingId].fund += msg.value;
    votings[votingId].voters[msg.sender] = true;
    votings[votingId].candidates[_candidate]++;

    uint votes = votings[votingId].candidates[_candidate];

    if(votes > votings[votingId].winnerVotes) {
      votings[votingId].winner = _candidate;
      votings[votingId].winnerVotes = votes;
    }
  }

  function stopVoting(uint votingId) external onlyActive(votingId) {
    require(isExpire(votingId), "Voting time not expired");

    uint fund = votings[votingId].fund;
    votings[votingId].isActive = false;

    if(votings[votingId].winner != address(0)) {
      uint reward  = fund / 100 * 90;
      availableFees += fund - reward ;
      payable(votings[votingId].winner).transfer(reward);
    }
  }

  function isExpire(uint id) private view returns (bool) {
    return block.timestamp > votings[id].startDate + votingPeriod;
  }

  function isOwner() external view returns (bool) {
    return owner == msg.sender;
  }

  function isExist(uint votingId, address _candidate) private view returns (bool) {
    return votings[votingId].candidates[_candidate] > 0;
  }

  function sendFeesToOwner() external onlyOwner  {
    require(availableFees > 0, "Not available to withdraw");
    payable(owner).transfer(availableFees);
    availableFees = 0;
  }

  function getBalances() external view returns (uint, uint) {
    return (address(this).balance, availableFees);
  }

  function toArray(uint id) private view returns(Candidate[] memory candidates) {
    candidates = new Candidate[](votings[id].count);
    for(uint i; i < votings[id].count; i++) {
      address cId = votings[id].mapper[i];
      candidates[i] = Candidate(cId, votings[id].candidates[cId] - 1); // subtract 1, becouse real value of votes less by 1
    }

    return candidates;
  }
}
