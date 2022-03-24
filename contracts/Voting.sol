// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "hardhat/console.sol";

contract Voting {
  struct VotingStore {
    uint startDate;
    uint8 id;
    bool isOpen;
    address[] candidates;
  }

  struct Candidate {
    address candidateAddress;
    uint8 number;
  }

  struct User {
    address userAddress;
    address[] candidates;
  }

  address private owner;
  uint private balance;
  uint8 private votingCount = 1;
  uint8 private activeVotingId;
  uint private votingMaxTime = 129600000;

  VotingStore[] private votings;
  Candidate[] private candidates;
  User[] private users;

  // mapping (string => VotingStore) private votings;
  // mapping (address => Candidate) private candidates;
  // mapping (address => User) private users;

  event CVotings(VotingStore[] v);

  constructor() {
    owner = msg.sender;
    console.log(owner);
  }

  function createVoting(address _candidate) private {
    address[] memory list;
    list[0] = _candidate;

    votings.push(VotingStore({
    startDate: block.timestamp,
    id: votingCount,
    isOpen: true,
    candidates: list
    }));

    activeVotingId = votingCount;
    votingCount++;
  }

  function addCandidate() external {
    if(activeVotingId > 0 && votings[activeVotingId].startDate + votingMaxTime > block.timestamp) {

    }

  }

  function getActiveVoting() private returns(VotingStore memory) {

  }

  function isOwner() external view returns(bool) {
    return owner == msg.sender;
  }

  function getOwner() external view returns(address) {
    return owner;
  }

  function getVotings() external view returns(VotingStore[] memory) {
    return votings;
  }
  /*
    function callVotings() external {
      emit CVotings(votings);
    }


    function vote(string memory candidate) public payable {
      address candidate = address(candidate);
      if (users[msg.sender].addr == address(0)) {
        users[msg.sender] = User(msg.sender, [add]);
      } else {
        users[msg.sender].candidates.push(add);
      }
      balance += msg.value;
    }
    */
}
