// Starter circuit for the Email Domain Credential template.
// Parse and canonicalize email data before issuing the credential.

fn hash2(left: Field, right: Field) -> Field {
    // Placeholder only. Use a circuit-friendly hash in production.
    left * 31 + right * 17
}

fn main(
    domain_hash: Field,
    email_secret: Field,
    allowed_domain_hash: pub Field,
    credential_issuer: pub Field,
    subject_nullifier: pub Field
) {
    assert(domain_hash == allowed_domain_hash);
    assert(credential_issuer != 0);
    assert(hash2(email_secret, credential_issuer) == subject_nullifier);
}
