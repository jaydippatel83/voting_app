// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Voting
 * @dev A simple voting smart contract that allows users to vote on proposals
 */
contract Voting {
    // Struct to represent a proposal
    struct Proposal {
        string description;
        uint256 voteCount;
    }

    // Array to store all proposals
    Proposal[] public proposals;

    // Mapping to track if an address has voted
    mapping(address => bool) public hasVoted;

    // Address of the contract owner
    address public owner;

    // Events
    event ProposalCreated(uint256 indexed proposalId, string description);
    event Voted(address indexed voter, uint256 indexed proposalId);

    // Modifier to restrict functions to owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Modifier to check if user has not voted
    modifier hasNotVoted() {
        require(!hasVoted[msg.sender], "You have already voted");
        _;
    }

    /**
     * @dev Constructor - Initialize contract with initial proposals
     * @param proposalDescriptions Array of initial proposal descriptions
     */
    constructor(string[] memory proposalDescriptions) {
        owner = msg.sender;

        // Initialize proposals
        for (uint256 i = 0; i < proposalDescriptions.length; i++) {
            proposals.push(Proposal({
                description: proposalDescriptions[i],
                voteCount: 0
            }));
            emit ProposalCreated(i, proposalDescriptions[i]);
        }
    }

    /**
     * @dev Add a new proposal (only owner)
     * @param description The description of the new proposal
     */
    function addProposal(string memory description) public onlyOwner {
        uint256 proposalId = proposals.length;
        proposals.push(Proposal({
            description: description,
            voteCount: 0
        }));
        emit ProposalCreated(proposalId, description);
    }

    /**
     * @dev Vote for a proposal
     * @param proposalId The ID of the proposal to vote for
     */
    function vote(uint256 proposalId) public hasNotVoted {
        require(proposalId < proposals.length, "Invalid proposal ID");

        proposals[proposalId].voteCount += 1;
        hasVoted[msg.sender] = true;

        emit Voted(msg.sender, proposalId);
    }

    /**
     * @dev Get the total number of proposals
     * @return The number of proposals
     */
    function getProposalCount() public view returns (uint256) {
        return proposals.length;
    }

    /**
     * @dev Get all proposals
     * @return Array of all proposals
     */
    function getAllProposals() public view returns (Proposal[] memory) {
        return proposals;
    }

 
    function getProposal(uint256 proposalId) public view returns (string memory description, uint256 voteCount) {
        require(proposalId < proposals.length, "Invalid proposal ID");
        Proposal memory proposal = proposals[proposalId];
        return (proposal.description, proposal.voteCount);
    }

    /**
     * @dev Get the winning proposal
     * @return winningProposalId The ID of the winning proposal
     * @return winningProposalDescription The description of the winning proposal
     * @return winningVoteCount The vote count of the winning proposal
     */
    function getWinner() public view returns (
        uint256 winningProposalId,
        string memory winningProposalDescription,
        uint256 winningVoteCount
    ) {
        require(proposals.length > 0, "No proposals available");

        winningProposalId = 0;
        winningVoteCount = proposals[0].voteCount;

        for (uint256 i = 1; i < proposals.length; i++) {
            if (proposals[i].voteCount > winningVoteCount) {
                winningProposalId = i;
                winningVoteCount = proposals[i].voteCount;
            }
        }

        winningProposalDescription = proposals[winningProposalId].description;
    }

    /**
     * @dev Check if an address has voted
     * @param voter The address to check
     * @return Boolean indicating if the address has voted
     */
    function checkIfVoted(address voter) public view returns (bool) {
        return hasVoted[voter];
    }
}
