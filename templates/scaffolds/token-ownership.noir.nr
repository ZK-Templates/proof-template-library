// Starter circuit for the Private Token Ownership template.
// Replace hash2 with the hash used by your ownership snapshot tree.

global DEPTH: u32 = 20;

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
    wallet_secret: Field,
    token_id: Field,
    path: [Field; DEPTH],
    indices: [Field; DEPTH],
    collection_id: pub Field,
    ownership_root: pub Field,
    access_nullifier: pub Field
) {
    let owner_commitment = hash2(wallet_secret, token_id);
    let ownership_leaf = hash2(collection_id, owner_commitment);
    assert(compute_root(ownership_leaf, path, indices) == ownership_root);
    assert(hash2(wallet_secret, collection_id) == access_nullifier);
}
