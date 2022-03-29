// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";

contract Voting {
  struct VotingStore {
    uint startDate;
    uint id;
    bool isActive;
    address winner;
    address[] voters;
    address[] candidates;
  }

  struct Candidate {
    address candidateAddress;
    uint votes;
    bool exist;
  }

  address private owner;
  uint private activeVotingId;
  uint private votingMaxTime = 10;
  mapping (address => Candidate) private candidates;
  VotingStore[] private votings;

  constructor() {
    owner = msg.sender;
    console.log(owner);
  }

  function getActiveVotingId() public view returns(int) {
    for(uint i = 0; i < votings.length; i++) {
      if(votings[i].isActive) {
        return int(i);
      }
    }

    return -1;
  }

  function addCandidate(address _candidate) external {
    require(msg.sender == owner, "Only for owner");
    if(votings.length == 0 || !votings[activeVotingId].isActive) {
      createVoting();
    }
    votings[activeVotingId].candidates.push(_candidate);
    candidates[_candidate] = Candidate(_candidate, 0, true);
  }

  function stopVoting() external {
    require(getActiveVotingId() >= 0, "Not active votings");
    require(isExpire(votings[activeVotingId]), "Voting time not expired");
    votings[activeVotingId].isActive = false;

    address winner;
    address[] memory candidatesList = votings[activeVotingId].candidates;
    uint max;

    for(uint i = 0; i < candidatesList.length; i++) {
      if(candidates[candidatesList[i]].votes >= max) {
        max = candidates[candidatesList[i]].votes;
        winner = candidatesList[i];
      }
    }
    votings[activeVotingId].winner = winner;
    sendRewardToWinner(winner);
  }

  function isOwner() external view returns(bool) {
    return owner == msg.sender;
  }

  function getCandidateByAddress(address _candidate) external view returns(Candidate memory) {
    return candidates[_candidate];
  }

  function sendFeeToOwner() external payable {
    require(msg.sender == owner, "Only for owner");
    payable(owner).transfer(address(this).balance);
  }

  function getBalance() external view returns(uint) {
    return address(this).balance;
  }

  function getVotings() external view returns(VotingStore[] memory) {
    return votings;
  }

  function vote(address _candidate) external payable {
    require(msg.value == 0.01 ether, "Pay 0.01 eth");
    require(getActiveVotingId() >= 0, "Not active votings");
    require(!isVoter(msg.sender), "Already voted");
    require(candidates[_candidate].exist, "Candidate do not exist");

    votings[activeVotingId].voters.push(msg.sender);
    votings[activeVotingId].candidates.push(_candidate);
    candidates[_candidate].votes++;
  }

  function isExpire(VotingStore memory voting) private view returns(bool) {
    return block.timestamp > voting.startDate  + votingMaxTime;
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

  function sendRewardToWinner(address winner) private {
    payable(winner).transfer(address(this).balance / 100 * 90);
  }

  function createVoting() private {
    address[] memory candidatesInt;
    address[] memory votersInt;
    uint votingCount = votings.length;

    votings.push(VotingStore({
    startDate: block.timestamp,
    id: votingCount,
    isActive: true,
    winner: address(0x0),
    candidates: candidatesInt,
    voters: votersInt
    }));

    activeVotingId = votingCount;
  }
}
