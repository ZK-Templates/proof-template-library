// Starter circuit for the Age Gate template.
// Replace placeholder commitment logic with the issuer/credential scheme you use.

fn assert_reasonable_birth_year(birth_year: u32, current_year: u32) {
    assert(birth_year >= 1900);
    assert(birth_year <= current_year);
}

fn credential_commitment(birth_year: u32, credential_secret: Field) -> Field {
    // Placeholder only. Use a circuit-friendly hash such as Poseidon in production.
    (birth_year as Field) + credential_secret
}

fn main(
    birth_year: u32,
    credential_secret: Field,
    current_year: pub u32,
    minimum_age: pub u32,
    identity_commitment: pub Field
) {
    assert_reasonable_birth_year(birth_year, current_year);
    assert(current_year - birth_year >= minimum_age);
    assert(credential_commitment(birth_year, credential_secret) == identity_commitment);
}
