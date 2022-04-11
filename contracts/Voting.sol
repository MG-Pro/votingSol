// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";

contract Voting {
  uint private constant votingPeriod = 60 * 60 * 24 * 3;

  struct Candidate {
    address id;
    uint votes;
  }

  struct VotingItem {
    uint startDate;
    bool isActive;
    address winner;
    address[] voters;
    Candidate[] candidates;
  }

  address private owner;
  uint private activeVotingId;
  mapping (uint => VotingItem) private votings;
  bool private canSendFee;

  constructor() {
    owner = msg.sender;
    console.log(owner);
  }

  function addCandidate(address _candidate) external {
    require(msg.sender == owner, "Only for owner");

    if(!votings[activeVotingId].isActive) {
      activeVotingId++;

      VotingItem storage voting = votings[activeVotingId];
      voting.startDate = block.timestamp;
      voting.isActive = true;
      canSendFee = false;
    }

    votings[activeVotingId].candidates.push(Candidate({
    id: _candidate,
    votes: 0
    }));
  }

  function getVotings() external view returns(VotingItem[] memory) {
    VotingItem[] memory votingItems = new VotingItem[](activeVotingId);
    for(uint i; i< activeVotingId; i++) {
      votingItems[i] = votings[i + 1];
    }
    return votingItems;
  }

  function vote(address _candidate) external payable {
    require(msg.value == 0.01 ether, "Pay 0.01 eth");
    require(getActiveVotingId() >= 0, "Not active votings!");
    require(!isExpire(votings[activeVotingId]), "Voting expired!");
    require(!isVoter(msg.sender), "Already voted!");

    int indexCandidate = findCandidateIndex(_candidate);
    if (indexCandidate < 0) {
      revert("Candidate do not exist!");
    }

    votings[activeVotingId].voters.push(msg.sender);
    votings[activeVotingId].candidates[uint(indexCandidate)].votes++;
  }

  function getActiveVotingId() public view returns(int) {
    for(uint i = 0; i < activeVotingId; i++) {
      if(votings[i + 1].isActive) {
        return int(activeVotingId);
      }
    }
    return -1;
  }

  function stopVoting() external {
    require(getActiveVotingId() >= 0, "Not active votings");
    require(isExpire(votings[activeVotingId]), "Voting time not expired");
    votings[activeVotingId].isActive = false;

    address winner;
    uint max;
    Candidate[] memory candidates = votings[activeVotingId].candidates;

    for(uint i = 0; i < candidates.length; i++) {
      if(candidates[i].votes >= max) {
        max = candidates[i].votes;
        winner = candidates[i].id;
      }
    }
    votings[activeVotingId].winner = winner;
    sendRewardToWinner(winner);
    canSendFee = true;
  }

  function isOwner() external view returns(bool) {
    return owner == msg.sender;
  }

  function sendFeeToOwner() external {
    require(msg.sender == owner, "Only for owner");
    require(canSendFee, "Voting is active. Wait!");
    payable(owner).transfer(address(this).balance);
  }

  function getBalance() external view returns(uint) {
    return address(this).balance;
  }

  function sendRewardToWinner(address _winner) private {
    payable(_winner).transfer(address(this).balance / 100 * 90);
  }

  function isExpire(VotingItem memory _voting) private view returns(bool) {
    return block.timestamp > _voting.startDate  + votingPeriod;
  }

  function isVoter(address _voter) private view returns(bool) {
    address[] memory voters = votings[activeVotingId].voters;
    for(uint i = 0; i < voters.length; i++) {
      if(voters[i] == _voter) {
        return true;
      }
    }
    return false;
  }

  function findCandidateIndex(address _candidate) private view returns(int) {
    for(uint i; i < votings[activeVotingId].candidates.length; i++) {
      if(votings[activeVotingId].candidates[i].id == _candidate) {
        return int(i);
      }
    }
    return -1;
  }
}
