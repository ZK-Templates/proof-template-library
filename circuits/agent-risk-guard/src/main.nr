use std::hash::pedersen_hash;

fn main(
    agent_secret: Field,
    order_notional: u64,
    daily_loss: u64,
    post_trade_exposure_bps: u32,
    max_order_notional: pub u64,
    max_daily_loss: pub u64,
    max_exposure_bps: pub u32,
    agent_id: pub Field,
    policy_commitment: pub Field,
    intent_hash: pub Field,
    action_commitment: pub Field,
) {
    assert(agent_secret != 0);
    assert(order_notional <= max_order_notional);
    assert(daily_loss <= max_daily_loss);
    assert(post_trade_exposure_bps <= max_exposure_bps);
    assert(max_exposure_bps <= 10000);

    let expected_commitment = pedersen_hash([
        agent_secret,
        agent_id,
        order_notional as Field,
        daily_loss as Field,
        post_trade_exposure_bps as Field,
        policy_commitment,
        intent_hash,
    ]);

    assert(expected_commitment == action_commitment);
}
