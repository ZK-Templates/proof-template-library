// Starter circuit for the Group Membership template.
// The hash function is deliberately simple here; replace it before production use.

global DEPTH: u32 = 20;

fn hash2(left: Field, right: Field) -> Field {
    // Placeholder only. Use the same circuit-friendly hash used by your off-chain tree builder.
    left * 31 + right * 17
}

fn select_left(current: Field, sibling: Field, index: Field) -> Field {
    assert(index * (index - 1) == 0);
    if index == 0 {
        current
    } else {
        sibling
    }
}

fn select_right(current: Field, sibling: Field, index: Field) -> Field {
    if index == 0 {
        sibling
    } else {
        current
    }
}

fn compute_root(leaf: Field, path: [Field; DEPTH], indices: [Field; DEPTH]) -> Field {
    let mut current = leaf;
    for i in 0..DEPTH {
        assert(indices[i] * (indices[i] - 1) == 0);
        let left = select_left(current, path[i], indices[i]);
        let right = select_right(current, path[i], indices[i]);
        current = hash2(left, right);
    }
    current
}

fn main(
    identity_secret: Field,
    path: [Field; DEPTH],
    indices: [Field; DEPTH],
    group_root: pub Field,
    scope: pub Field
) {
    let leaf = hash2(identity_secret, scope);
    assert(compute_root(leaf, path, indices) == group_root);
}
