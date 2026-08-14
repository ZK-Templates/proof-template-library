// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ProofRailsVerifier.sol";

/// @notice Minimal hook/router gate showing where proof rails fit before tokenized-market execution.
/// @dev This intentionally avoids depending on a specific AMM interface.
contract ProofRailsHookExample {
    ProofRailsVerifier public immutable proofRails;

    event IntentAuthorized(bytes32 indexed intentHash, address indexed caller);

    constructor(ProofRailsVerifier proofRails_) {
        proofRails = proofRails_;
    }

    function beforeExecute(bytes32 intentHash, ProofRailsVerifier.ProofRail[] calldata rails) external returns (bytes4) {
        require(intentHash != bytes32(0), "INTENT_REQUIRED");

        for (uint256 index = 0; index < rails.length; index += 1) {
            require(rails[index].intentHash == intentHash, "INTENT_MISMATCH");
        }

        proofRails.checkRails(rails);
        emit IntentAuthorized(intentHash, msg.sender);

        return this.beforeExecute.selector;
    }
}
