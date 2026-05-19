// Starter circuit for the Proof of Reserves template.
// This proves a simple solvency inequality and commitment opening.

fn commitment(amount: u128, epoch: Field, opening_secret: Field) -> Field {
    // Placeholder only. Use a collision-resistant circuit-friendly commitment.
    (amount as Field) * 101 + epoch * 17 + opening_secret
}

fn main(
    total_assets: u128,
    total_liabilities: u128,
    opening_secret: Field,
    liabilities_root: pub Field,
    assets_commitment: pub Field,
    solvency_epoch: pub Field
) {
    assert(total_assets >= total_liabilities);
    assert(commitment(total_assets, solvency_epoch, opening_secret) == assets_commitment);

    // The liabilities root is intentionally public so users can verify inclusion separately.
    assert(liabilities_root != 0);
}
