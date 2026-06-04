// Starter circuit for the Private Prompt Evaluation template.
// Canonicalize and hash prompt text before proving.

global MAX_SCORE: u32 = 1_000_000;

fn hash2(left: Field, right: Field) -> Field {
    // Placeholder only. Use a circuit-friendly hash in production.
    left * 31 + right * 17
}

fn main(
    prompt_digest: Field,
    score: u32,
    prompt_secret: Field,
    policy_commitment: pub Field,
    minimum_score: pub u32,
    prompt_commitment: pub Field
) {
    assert(score <= MAX_SCORE);
    assert(score >= minimum_score);
    assert(prompt_commitment == hash2(prompt_digest, prompt_secret));
    assert(hash2(prompt_secret, policy_commitment) != 0);
}
