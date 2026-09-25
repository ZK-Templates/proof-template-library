// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Reference registry for versioned ExpandZK policy commitments.
/// @dev This contract is unaudited and intentionally keeps policy documents offchain.
contract ExpandZKPolicyRegistry {
    struct PolicyRecord {
        bytes32 commitment;
        bytes32 versionHash;
        bool active;
        uint64 activatedAt;
    }

    address public owner;
    mapping(bytes32 => PolicyRecord) private policies;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event PolicyRegistered(bytes32 indexed policyId, bytes32 indexed commitment, bytes32 versionHash);
    event PolicyStatusChanged(bytes32 indexed policyId, bool active);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor(address owner_) {
        require(owner_ != address(0), "OWNER_REQUIRED");
        owner = owner_;
        emit OwnershipTransferred(address(0), owner_);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "OWNER_REQUIRED");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function registerPolicy(
        bytes32 policyId,
        bytes32 commitment,
        bytes32 versionHash
    ) external onlyOwner {
        require(policyId != bytes32(0), "POLICY_ID_REQUIRED");
        require(commitment != bytes32(0), "COMMITMENT_REQUIRED");

        policies[policyId] = PolicyRecord({
            commitment: commitment,
            versionHash: versionHash,
            active: true,
            activatedAt: uint64(block.timestamp)
        });
        emit PolicyRegistered(policyId, commitment, versionHash);
    }

    function setPolicyActive(bytes32 policyId, bool active) external onlyOwner {
        require(policies[policyId].commitment != bytes32(0), "POLICY_NOT_FOUND");
        policies[policyId].active = active;
        emit PolicyStatusChanged(policyId, active);
    }

    function getPolicy(bytes32 policyId) external view returns (PolicyRecord memory) {
        return policies[policyId];
    }
}
