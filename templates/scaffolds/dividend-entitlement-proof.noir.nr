// Starter circuit for the Dividend Entitlement Proof template.
// Proves private snapshot eligibility and emits a one-claim nullifier.

fn bind3(a: Field, b: Field, c: Field) -> Field {
    // Placeholder only. Replace with a circuit-friendly Merkle hash.
    a * 131 + b * 37 + c * 19
}

fn main(
    holder_secret: Field,
    snapshot_balance: u128,
    path_digest: Field,
    snapshot_root: pub Field,
    distribution_id: pub Field,
    claim_nullifier: pub Field,
    minimum_balance: pub u128
) {
    assert(snapshot_balance >= minimum_balance);
    assert(claim_nullifier == bind3(holder_secret, distribution_id, 1));

    // Replace this digest binding with full Merkle path constraints for production.
    let leaf = bind3(holder_secret, snapshot_balance as Field, distribution_id);
    assert(bind3(leaf, path_digest, 0) == snapshot_root);
}
