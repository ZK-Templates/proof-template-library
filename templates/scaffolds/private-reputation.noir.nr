// Starter circuit for the Private Reputation Threshold template.
// Replace the commitment with your credential issuer's commitment/signature scheme.

global MAX_SCORE: u32 = 1_000_000;

fn score_commitment(score: u32, issuer_commitment: Field, credential_secret: Field) -> Field {
    // Placeholder only. Use a real credential commitment in production.
    (score as Field) * 101 + issuer_commitment * 17 + credential_secret
}

fn main(
    score: u32,
    credential_secret: Field,
    minimum_score: pub u32,
    issuer_commitment: pub Field,
    credential_commitment: pub Field
) {
    assert(score <= MAX_SCORE);
    assert(score >= minimum_score);
    assert(score_commitment(score, issuer_commitment, credential_secret) == credential_commitment);
}
