// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

contract Voting {
  uint private constant votingPeriod = 259200;

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
    VotingData data;
    mapping(address => uint) voters;
  }

  address private owner;
  uint private activeVotingId;
  uint private nextVotingId = 1;
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
    require(findIndex(_candidate) < 0, "Candidate exist!");
    if (activeVotingId == 0) {
      activeVotingId = nextVotingId;
      nextVotingId++;

      VotingItem storage voting = votings[activeVotingId];
      voting.data.startDate = block.timestamp;
      voting.data.isActive = true;
    }

    votings[activeVotingId].data.candidates.push(Candidate({
    id : _candidate,
    votes : 0
    }));
  }

  function getVotings() external view returns (VotingData[] memory) {
    VotingData[] memory votingItems = new VotingData[](nextVotingId - 1);
    for (uint i; i < nextVotingId - 1; i++) {
      votingItems[i] = VotingData({
      startDate: votings[i+1].data.startDate,
      winner: votings[i+1].data.winner,
      candidates: votings[i+1].data.candidates,
      isActive: votings[i+1].data.isActive
      });
    }
    return votingItems;
  }

  function vote(address _candidate) external payable hasActiveVoting {
    require(!isExpire(), "Voting time expired!");
    require(msg.value == 0.01 ether, "Pay 0.01 eth");
    require(!isVoter(msg.sender), "Already voted!");

    int indexCandidate = findIndex(_candidate);
    if (indexCandidate < 0) {
      revert("Candidate do not exist!");
    }

    votings[activeVotingId].voters[msg.sender]++;
    votings[activeVotingId].data.candidates[uint(indexCandidate)].votes++;
  }

  function getActiveVotingId() public view returns (uint) {
    return activeVotingId;
  }

  function stopVoting() external hasActiveVoting {
    require(isExpire(), "Voting time not expired");

    address winner;
    uint max;

    for (uint i = 0; i < votings[activeVotingId].data.candidates.length; i++) {
      if (votings[activeVotingId].data.candidates[i].votes != 0 && votings[activeVotingId].data.candidates[i].votes >= max) {
        max = votings[activeVotingId].data.candidates[i].votes;
        winner = votings[activeVotingId].data.candidates[i].id;
      }
    }
    votings[activeVotingId].data.winner = winner;
    votings[activeVotingId].data.isActive = false;
    activeVotingId = 0;
    sendRewardToWinner(winner);
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

  function sendRewardToWinner(address _winner) private {
    payable(_winner).transfer(address(this).balance / 100 * 90);
  }

  function isExpire() private view returns (bool) {
    return block.timestamp > votings[activeVotingId].data.startDate + votingPeriod;
  }

  function isVoter(address _voter) private view returns (bool) {
    return votings[activeVotingId].voters[_voter] > 0;
  }

  function findIndex(address _candidate) private view returns (int) {
    for (uint i; i < votings[activeVotingId].data.candidates.length; i++) {
      if (votings[activeVotingId].data.candidates[i].id == _candidate) {
        return int(i);
      }
    }
    return - 1;
  }
}
