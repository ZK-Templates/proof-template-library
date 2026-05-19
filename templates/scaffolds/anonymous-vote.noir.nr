// Starter circuit for the Anonymous Vote template.
// Replace hash2 with the hash used by your tree and nullifier system.

global DEPTH: u32 = 20;
global MAX_VOTE_OPTION: u32 = 2;

fn hash2(left: Field, right: Field) -> Field {
    // Placeholder only. Use a circuit-friendly hash in production.
    left * 31 + right * 17
}

fn compute_root(leaf: Field, path: [Field; DEPTH], indices: [Field; DEPTH]) -> Field {
    let mut current = leaf;
    for i in 0..DEPTH {
        assert(indices[i] * (indices[i] - 1) == 0);
        let left = if indices[i] == 0 { current } else { path[i] };
        let right = if indices[i] == 0 { path[i] } else { current };
        current = hash2(left, right);
    }
    current
}

fn main(
    identity_secret: Field,
    vote: u32,
    path: [Field; DEPTH],
    indices: [Field; DEPTH],
    election_id: pub Field,
    voter_root: pub Field,
    nullifier: pub Field,
    vote_commitment: pub Field
) {
    assert(vote <= MAX_VOTE_OPTION);

    let voter_leaf = hash2(identity_secret, election_id);
    assert(compute_root(voter_leaf, path, indices) == voter_root);

    assert(hash2(identity_secret, election_id) == nullifier);
    assert(hash2(vote as Field, election_id) == vote_commitment);
}
