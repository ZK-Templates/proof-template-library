pragma circom 2.1.6;

// Starter circuit for the Private Allowlist Claim template.
// This file expects circomlib to be installed and uses Poseidon for commitments.

include "circomlib/circuits/poseidon.circom";

template PrivateAllowlistClaim(DEPTH) {
    signal input accountSecret;
    signal input siblings[DEPTH];
    signal input pathIndices[DEPTH];

    signal input allowlistRoot;
    signal input claimScope;

    signal output claimNullifier;

    component leafHasher = Poseidon(1);
    leafHasher.inputs[0] <== accountSecret;

    signal current[DEPTH + 1];
    current[0] <== leafHasher.out;

    component hashers[DEPTH];

    for (var i = 0; i < DEPTH; i++) {
        pathIndices[i] * (pathIndices[i] - 1) === 0;

        signal left;
        signal right;

        left <== current[i] * (1 - pathIndices[i]) + siblings[i] * pathIndices[i];
        right <== siblings[i] * (1 - pathIndices[i]) + current[i] * pathIndices[i];

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== left;
        hashers[i].inputs[1] <== right;
        current[i + 1] <== hashers[i].out;
    }

    current[DEPTH] === allowlistRoot;

    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== accountSecret;
    nullifierHasher.inputs[1] <== claimScope;
    claimNullifier <== nullifierHasher.out;
}

component main { public [allowlistRoot, claimScope] } = PrivateAllowlistClaim(20);
