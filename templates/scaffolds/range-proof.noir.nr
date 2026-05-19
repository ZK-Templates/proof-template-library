// Starter circuit for the Private Range Proof template.
// Use typed integers for comparisons and a real commitment before production.

fn commitment(value: u128, opening_secret: Field) -> Field {
    // Placeholder only. Use a collision-resistant circuit-friendly commitment.
    (value as Field) * 101 + opening_secret
}

fn main(
    value: u128,
    opening_secret: Field,
    min_value: pub u128,
    max_value: pub u128,
    value_commitment: pub Field
) {
    assert(min_value <= max_value);
    assert(value >= min_value);
    assert(value <= max_value);
    assert(commitment(value, opening_secret) == value_commitment);
}
