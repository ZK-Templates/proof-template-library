// Starter circuit for the Anonymous Rate Limit template.
// The application must reject duplicate rate_nullifier values outside the circuit.

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
    identity_secret: Field,
    path: [Field; DEPTH],
    indices: [Field; DEPTH],
    membership_root: pub Field,
    epoch: pub Field,
    rate_nullifier: pub Field
) {
    let member_leaf = hash2(identity_secret, 0);
    assert(compute_root(member_leaf, path, indices) == membership_root);
    assert(hash2(identity_secret, epoch) == rate_nullifier);
}
