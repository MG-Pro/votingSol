# VotingSol v.3

## UI
For UI building was used Angular Framework.

## Contract

### Contract includes next public methods:

* `createVoting` - Takes list of candidate's addresses and save them in new voting.
* `getVotings` - Returns list of votings with corresponding candidates.

* `vote` - Takes voting's ID and candidate's address. Sets the vote to candidate. Simultaneously, it recalculates winner and votes of winner.

* `stopVoting` - Takes voting's ID  and stops the voting and make transfer to winner if it exists. If count of candidates votes is equal, the previous winner stay winner.

* `isOwner` - Checks owner.

* `sendFeesToOwner` - Transfers full accumulated fees from all finished votings to owner.

* `getBalances` - Returns contract balance and fund available for withdraw by owner.

* `getVotingById` - Takes voting's ID and returns voting by ID with corresponding candidates. Max count of votings can get using public variable votingCounter.

* `votingCounter` - Public variable. Shows count of all votings regardless of them statuses.

### Contract includes data structures:

* `Candidate` - Using only for output view

    ```
    struct Candidate {
        address id;
        uint votes;
    }
    ```

* `VotingData` - Using only for output Voting view. Order number of voting, starts with 1. Field `isExpired` switch to false if time of voting was expired in the moment of request

    ```    
    struct VotingData {
        uint id; 
        uint fund;
        uint startDate;
        bool isExpired; 
        bool isActive;
        address winner;
        Candidate[] candidates;
    }
    ```

* `VotingItem` - Using for store voting data in storage. Fields:

   ```
    struct VotingItem {
        uint startDate;
        address winner;
        uint fund; 
        uint count;
        uint winnerVotes;
        bool isActive; 
        mapping(uint => address) mapper;    
        mapping(address => uint) candidates;
        mapping(address => bool) voters;    
    }
   ```

    - `startDate`   - Timestamp of creating voting,
    - `winner`      - Address of winner,
    - `fund`        - Sum of all voter's payments,
    - `count`       - Count of candidates,
    - `winnerVotes` - Count of votes which took the winner,
    - `isActive`    - Status of voting. Will switch to false after user stops the voting,
    - `mapper`      - Mapping, keeps map of candidate's indexes  (index => candidate),
    - `candidates`  - Mapping, keeps map of candidate's votes (candidate => votes),
    - `voters`      - Mapping, keeps map of voter's statuses (voters => isVoted (voted status)).
