// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IExpandZKPolicyRegistry {
    struct PolicyRecord {
        bytes32 commitment;
        bytes32 versionHash;
        bool active;
        uint64 activatedAt;
    }

    function getPolicy(bytes32 policyId) external view returns (PolicyRecord memory);
}

interface IExpandZKRailVerifier {
    function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool);
}

/// @notice Routes a Proof Passport through registered rail verifiers before an action executes.
/// @dev Reference code only. Generated verifiers and public-input encodings require independent review.
contract ProofPassportRouter {
    struct RailProof {
        bytes32 verifierId;
        bytes32 nullifier;
        bytes32[] publicInputs;
        bytes proof;
    }

    struct Passport {
        bytes32 passportId;
        bytes32 policyId;
        bytes32 policyCommitment;
        bytes32 intentHash;
        address subject;
        address target;
        uint64 validAfter;
        uint64 validUntil;
        RailProof[] rails;
    }

    address public owner;
    IExpandZKPolicyRegistry public immutable policyRegistry;
    mapping(bytes32 => address) public verifierForId;
    mapping(bytes32 => bool) public usedPassports;
    mapping(bytes32 => bool) public usedNullifiers;

    event VerifierRegistered(bytes32 indexed verifierId, address indexed verifier);
    event PassportAccepted(
        bytes32 indexed passportId,
        bytes32 indexed policyId,
        bytes32 indexed intentHash,
        address subject,
        address target
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor(IExpandZKPolicyRegistry policyRegistry_, address owner_) {
        require(address(policyRegistry_) != address(0), "REGISTRY_REQUIRED");
        require(owner_ != address(0), "OWNER_REQUIRED");
        policyRegistry = policyRegistry_;
        owner = owner_;
    }

    function registerVerifier(bytes32 verifierId, address verifier) external onlyOwner {
        require(verifierId != bytes32(0), "VERIFIER_ID_REQUIRED");
        require(verifier != address(0), "VERIFIER_REQUIRED");
        verifierForId[verifierId] = verifier;
        emit VerifierRegistered(verifierId, verifier);
    }

    function verifyAndConsume(Passport calldata passport) external returns (bool) {
        require(passport.passportId != bytes32(0), "PASSPORT_ID_REQUIRED");
        require(!usedPassports[passport.passportId], "PASSPORT_USED");
        require(passport.validAfter <= block.timestamp, "PASSPORT_NOT_ACTIVE");
        require(passport.validUntil >= block.timestamp, "PASSPORT_EXPIRED");
        require(passport.validAfter <= passport.validUntil, "INVALID_WINDOW");
        require(passport.rails.length > 0, "RAILS_REQUIRED");

        IExpandZKPolicyRegistry.PolicyRecord memory policy = policyRegistry.getPolicy(passport.policyId);
        require(policy.active, "POLICY_INACTIVE");
        require(policy.commitment == passport.policyCommitment, "POLICY_MISMATCH");

        usedPassports[passport.passportId] = true;

        for (uint256 index = 0; index < passport.rails.length; index += 1) {
            RailProof calldata rail = passport.rails[index];
            address verifier = verifierForId[rail.verifierId];
            require(verifier != address(0), "VERIFIER_NOT_REGISTERED");
            require(rail.publicInputs.length >= 3, "BINDING_INPUTS_REQUIRED");
            require(rail.publicInputs[0] == passport.passportId, "PASSPORT_BINDING_FAILED");
            require(rail.publicInputs[1] == passport.policyCommitment, "POLICY_BINDING_FAILED");
            require(rail.publicInputs[2] == passport.intentHash, "INTENT_BINDING_FAILED");

            if (rail.nullifier != bytes32(0)) {
                require(!usedNullifiers[rail.nullifier], "NULLIFIER_USED");
                usedNullifiers[rail.nullifier] = true;
            }

            require(IExpandZKRailVerifier(verifier).verify(rail.proof, rail.publicInputs), "PROOF_INVALID");
        }

        emit PassportAccepted(
            passport.passportId,
            passport.policyId,
            passport.intentHash,
            passport.subject,
            passport.target
        );
        return true;
    }
}
