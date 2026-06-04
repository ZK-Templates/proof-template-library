// Starter circuit for the Private Classification Threshold template.
// Use generated model constraints when proving the full classifier, not just a signed score.

global MAX_SCORE: u32 = 1_000_000;

fn hash2(left: Field, right: Field) -> Field {
    // Placeholder only. Use a circuit-friendly hash in production.
    left * 31 + right * 17
}

fn main(
    score: u32,
    input_secret: Field,
    class_id: pub Field,
    minimum_score: pub u32,
    input_commitment: pub Field
) {
    assert(score <= MAX_SCORE);
    assert(score >= minimum_score);
    assert(input_commitment == hash2(class_id, input_secret));
}
