// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract InsuranceClaim {
    enum ClaimStatus {
        PENDING,
        UNDER_REVIEW,
        APPROVED,
        REJECTED
    }

    struct Claim {
        string claimId;
        string policyId;
        bytes32 claimDataHash;
        string claimantReference;
        uint256 amount;
        ClaimStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct ClaimHistoryEntry {
        ClaimStatus status;
        string action;
        address actor;
        uint256 timestamp;
    }

    address public owner;
    mapping(address => bool) public authorizedAdmins;
    mapping(string => Claim) private claims;
    mapping(string => bool) private claimExists;
    mapping(string => ClaimHistoryEntry[]) private claimHistory;

    event AdminAuthorizationUpdated(address indexed account, bool authorized);
    event ClaimCreated(
        string indexed claimId,
        string indexed policyId,
        bytes32 claimDataHash,
        uint256 amount,
        uint256 timestamp
    );
    event ClaimStatusUpdated(
        string indexed claimId,
        ClaimStatus status,
        string action,
        address indexed actor,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAuthorizedAdmin() {
        require(authorizedAdmins[msg.sender], "Not an authorized admin");
        _;
    }

    modifier existingClaim(string calldata claimId) {
        require(claimExists[claimId], "Claim does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedAdmins[msg.sender] = true;
        emit AdminAuthorizationUpdated(msg.sender, true);
    }

    function setAdminAuthorization(address account, bool authorized) external onlyOwner {
        require(account != address(0), "Invalid admin address");
        authorizedAdmins[account] = authorized;
        emit AdminAuthorizationUpdated(account, authorized);
    }

    function createClaim(
        string calldata claimId,
        string calldata policyId,
        bytes32 claimDataHash,
        string calldata claimantReference,
        uint256 amount
    ) external onlyAuthorizedAdmin {
        require(bytes(claimId).length > 0, "Claim ID is required");
        require(bytes(policyId).length > 0, "Policy ID is required");
        require(!claimExists[claimId], "Claim already exists");
        require(claimDataHash != bytes32(0), "Claim hash is required");

        uint256 timestamp = block.timestamp;
        claims[claimId] = Claim({
            claimId: claimId,
            policyId: policyId,
            claimDataHash: claimDataHash,
            claimantReference: claimantReference,
            amount: amount,
            status: ClaimStatus.PENDING,
            createdAt: timestamp,
            updatedAt: timestamp
        });
        claimExists[claimId] = true;
        claimHistory[claimId].push(
            ClaimHistoryEntry({
                status: ClaimStatus.PENDING,
                action: "CLAIM_CREATED",
                actor: msg.sender,
                timestamp: timestamp
            })
        );

        emit ClaimCreated(claimId, policyId, claimDataHash, amount, timestamp);
    }

    function updateClaimStatus(
        string calldata claimId,
        ClaimStatus newStatus,
        string calldata action
    ) external onlyAuthorizedAdmin existingClaim(claimId) {
        require(
            newStatus == ClaimStatus.UNDER_REVIEW ||
                newStatus == ClaimStatus.APPROVED ||
                newStatus == ClaimStatus.REJECTED,
            "Invalid status transition"
        );
        require(bytes(action).length > 0, "Action is required");

        uint256 timestamp = block.timestamp;
        claims[claimId].status = newStatus;
        claims[claimId].updatedAt = timestamp;
        claimHistory[claimId].push(
            ClaimHistoryEntry({
                status: newStatus,
                action: action,
                actor: msg.sender,
                timestamp: timestamp
            })
        );

        emit ClaimStatusUpdated(claimId, newStatus, action, msg.sender, timestamp);
    }

    function getClaim(string calldata claimId)
        external
        view
        existingClaim(claimId)
        returns (Claim memory)
    {
        return claims[claimId];
    }

    function getClaimHistory(string calldata claimId)
        external
        view
        existingClaim(claimId)
        returns (ClaimHistoryEntry[] memory)
    {
        return claimHistory[claimId];
    }

    function verifyClaimHash(string calldata claimId, bytes32 claimDataHash)
        external
        view
        existingClaim(claimId)
        returns (bool)
    {
        return claims[claimId].claimDataHash == claimDataHash;
    }
}
