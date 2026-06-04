// Starter circuit for the AI Agent Action Receipt template.
// This proves a committed trace binding, not that external tools behaved honestly.

fn hash2(left: Field, right: Field) -> Field {
    // Placeholder only. Use a circuit-friendly hash in production.
    left * 31 + right * 17
}

fn main(
    trace_digest: Field,
    approval_secret: Field,
    workflow_commitment: pub Field,
    receipt_commitment: pub Field,
    agent_id: pub Field
) {
    assert(receipt_commitment == hash2(trace_digest, agent_id));
    assert(hash2(approval_secret, workflow_commitment) != 0);
}
