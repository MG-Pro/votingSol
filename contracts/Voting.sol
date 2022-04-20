// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

contract Voting {
  uint private constant votingPeriod = 259200;
  uint private activeVotingId;
  uint private nextVotingId = 1;
  address private owner;

  struct Candidate {
    address id;
    uint votes;
  }

  struct VotingData {
    uint startDate;
    bool isActive;
    address winner;
    Candidate[] candidates;
  }

  struct VotingItem {
    uint startDate;
    bool isActive;
    address winner;
    uint count;
    mapping(uint => address) mapper; // index => candidate
    mapping(address => uint) candidates; // candidate => votes
    mapping(address => bool) voters; // voters => isVoted
  }

  mapping(uint => VotingItem) private votings;

  modifier onlyOwner {
    require(msg.sender == owner, "Only for owner");
    _;
  }

  modifier hasActiveVoting {
    require(activeVotingId != 0, "Not active votings!");
    _;
  }

  constructor() {
    owner = msg.sender;
  }

  function addCandidate(address _candidate) external onlyOwner {
    require(!isExist(_candidate), "Candidate exist!");
    if (activeVotingId == 0) {
      activeVotingId = nextVotingId;
      nextVotingId++;

      votings[activeVotingId].startDate = block.timestamp;
      votings[activeVotingId].isActive = true;
    }

    votings[activeVotingId].candidates[_candidate];
    votings[activeVotingId].mapper[votings[activeVotingId].count] = _candidate;
    votings[activeVotingId].count++;
  }

  function getVotings() external view returns (VotingData[] memory votingItems) {
    votingItems = new VotingData[](nextVotingId - 1);
    for (uint i; i < nextVotingId - 1; i++) {
      votingItems[i] = VotingData(votings[i+1].startDate, votings[i+1].isActive, votings[i+1].winner, toArray(i+1));
    }
    return votingItems;
  }

  function vote(address _candidate) external payable hasActiveVoting {
    require(msg.value == 0.01 ether, "Pay 0.01 eth");
    require(!isExpire(), "Voting time expired!");
    require(isExist(_candidate), "Candidate do not exist!");
    require(!votings[activeVotingId].voters[msg.sender], "Already voted!");

    votings[activeVotingId].voters[msg.sender] = true;
    votings[activeVotingId].candidates[_candidate]++;
  }

  function getActiveVotingId() external view returns (uint) {
    return activeVotingId;
  }

  function stopVoting() external hasActiveVoting {
    require(isExpire(), "Voting time not expired");

    address winner;
    uint max;
    bool hasWinner;

    for (uint i = 0; i < votings[activeVotingId].count; i++) {
      address id = votings[activeVotingId].mapper[i];
      uint vt = votings[activeVotingId].candidates[id];

      if (vt != 0 && vt >= max) {
        max = vt;
        winner = id;
        hasWinner = true;
      }
    }
    votings[activeVotingId].winner = winner;
    votings[activeVotingId].isActive = false;
    activeVotingId = 0;

    if(winner != address(0)) {
      payable(winner).transfer(address(this).balance / 100 * 90);
    }
  }

  function isOwner() external view returns (bool) {
    return owner == msg.sender;
  }

  function sendFeeToOwner() external onlyOwner  {
    require(activeVotingId == 0, "Voting is active. Wait!");
    payable(owner).transfer(address(this).balance);
  }

  function getBalance() external view returns (uint) {
    return address(this).balance;
  }

  function isExpire() private view returns (bool) {
    return block.timestamp > votings[activeVotingId].startDate + votingPeriod;
  }

  function toArray(uint id) private view returns(Candidate[] memory candidates) {
    candidates = new Candidate[](votings[id].count);
    for(uint i; i < votings[id].count; i++) {
      address cId = votings[id].mapper[i];
      candidates[i] = Candidate(cId, votings[id].candidates[cId]);
    }
    return candidates;
  }

  function isExist(address _candidate) private view returns (bool) {
    for(uint i; i < votings[activeVotingId].count; i++) {
      if (votings[activeVotingId].mapper[i] == _candidate) {
        return true;
      }
    }
    return false;
  }
}
