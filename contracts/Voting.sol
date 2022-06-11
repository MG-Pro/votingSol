// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

contract Voting {
    address private owner;
    uint private constant votingPeriod = 259200;
    uint private constant votePayment = 0.01 ether;
    uint private availableFees; // Sum of fees from all finished votings
    uint public votingCounter; // Count of all votings regardless of them statuses

    // Using only for output view
    struct Candidate {
        address id;
        uint votes;
    }

    // Using only for output view
    struct VotingData {
        uint id; // order number of voting, starts with 1
        uint fund;
        uint startDate;
        bool isExpired; // false if time of voting expired in the moment of request
        bool isActive;
        address winner;
        Candidate[] candidates;
    }

    // Using for store voting data
    struct VotingItem {
        uint startDate;
        address winner;
        uint fund; // Sum of all voter's payments
        uint count; // Count of candidates
        uint winnerVotes; // Count of votes which took the winner
        bool isActive; // Status of voting. Will switch to false after user stops the voting
        mapping(uint => address) mapper;     // index => candidate
        mapping(address => uint) candidates; // candidate => votes
        mapping(address => bool) voters;     // voters => isVoted (voted status)
    }

    // store of votings
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

        for (uint i; i < _candidates.length; i++) {
            require(!isExist(votingCounter, _candidates[i]), "Candidate duplicated!");
            // Set 1 vote to candidate
            // The zero will mean candidate not exist yet
            votings[votingCounter].candidates[_candidates[i]] = 1;
            votings[votingCounter].mapper[votings[votingCounter].count] = _candidates[i];
            votings[votingCounter].count++;
        }
    }

    // It returns list of votings with corresponding candidates
    function getVotings() external view returns (VotingData[] memory votingItems) {
        if (votingCounter <= 0) {
            return votingItems;
        }

        votingItems = new VotingData[](votingCounter);
        for (uint i = 1; i <= votingCounter; i++) {
            votingItems[i - 1] = getVotingById(i);
        }
    }

    // It set the vote to candidate. Simultaneously it recalculate winner and votes of winner
    function vote(uint votingId, address _candidate) external payable onlyActive(votingId) {
        require(msg.value == votePayment, "Pay 0.01 eth");
        require(!isExpire(votingId), "Voting time expired!");
        require(isExist(votingId, _candidate), "Candidate do not exist!");
        require(!votings[votingId].voters[msg.sender], "Already voted!");

        // Accumulate voter's payments
        votings[votingId].fund += msg.value;
        // Set voter's status as voted
        votings[votingId].voters[msg.sender] = true;
        // Increment candidate's votes
        votings[votingId].candidates[_candidate]++;

        // Temp variable
        uint votes = votings[votingId].candidates[_candidate];

        // If count of candidates votes is equal, the previous winner stay winner
        if (votes > votings[votingId].winnerVotes) {
            // Set up new winner
            votings[votingId].winner = _candidate;
            votings[votingId].winnerVotes = votes;
        }
    }

    // It stops the voting and make transfer to winner if it exist
    function stopVoting(uint votingId) external onlyActive(votingId) {
        require(isExpire(votingId), "Voting time not expired");

        // Temp variable
        uint fund = votings[votingId].fund;
        // Switch to false voting active status
        votings[votingId].isActive = false;

        if (votings[votingId].winner != address(0)) {
            // Calculate reward of winner
            uint reward = fund / 100 * 90;
            // Set up fee available for withdraw by owner
            availableFees += fund - reward;
            payable(votings[votingId].winner).transfer(reward);
        }
    }

    // It check owner
    function isOwner() external view returns (bool) {
        return owner == msg.sender;
    }

    // It transfers full accumulated fees from all finished votings to owner
    function sendFeesToOwner() external onlyOwner {
        require(availableFees > 0, "Not available to withdraw");
        payable(owner).transfer(availableFees);
        // Set fund available for withdraw to 0 after transfer
        availableFees = 0;
    }

    // It returns contract balance and available fees
    function getBalances() external view returns (uint, uint) {
        return (address(this).balance, availableFees);
    }

    // It returns voting by id with corresponding candidates.
    // Max count of votings can get using public variable votingCounter
    function getVotingById(uint id) public view returns (VotingData memory) {
        require(id <= votingCounter && id > 0, "There is not voting");

        return VotingData(
            id,
            votings[id].fund,
            votings[id].startDate,
            isExpire(id),
            votings[id].isActive,
            votings[id].winner,
            toArray(id)
        );
    }

    // It returns status of voting expired in the moment of request
    function isExpire(uint id) private view returns (bool) {
        return block.timestamp > votings[id].startDate + votingPeriod;
    }

    // It check existing of candidate in the voting
    function isExist(uint votingId, address _candidate) private view returns (bool) {
        return votings[votingId].candidates[_candidate] > 0;
    }

    // It builds array of voting's candidates from mappings
    function toArray(uint id) private view returns (Candidate[] memory candidates) {
        candidates = new Candidate[](votings[id].count);
        for (uint i; i < votings[id].count; i++) {
            // Temp variable
            address cId = votings[id].mapper[i];
            // Subtract 1, because real count of votes less by 1
            candidates[i] = Candidate(cId, votings[id].candidates[cId] - 1);
        }
        return candidates;
    }
}
