import artifact from "../artifacts/agent-risk-guard.json";

const scenarios = {
  "within-policy": { order: "1250000", loss: "420000", exposure: "1450" },
  "over-order-limit": { order: "3400000", loss: "420000", exposure: "1450" },
  "over-loss-limit": { order: "1250000", loss: "1200000", exposure: "1450" }
};

const form = document.querySelector("#proof-form");
const scenario = document.querySelector("#scenario");
const order = document.querySelector("#order-notional");
const loss = document.querySelector("#daily-loss");
const exposure = document.querySelector("#exposure");
const secret = document.querySelector("#agent-secret");
const button = document.querySelector("#prove-button");
const title = document.querySelector("#run-title");
const status = document.querySelector("#run-status");
const message = document.querySelector("#run-message");
const proofSize = document.querySelector("#proof-size");
const proofTime = document.querySelector("#proof-time");
const publicCount = document.querySelector("#public-count");
const commitment = document.querySelector("#action-commitment");
const stages = [...document.querySelectorAll("[data-stage]")];

scenario.addEventListener("change", hydrateScenario);
form.addEventListener("submit", runProof);
hydrateScenario();

function hydrateScenario() {
  const values = scenarios[scenario.value];
  order.value = values.order;
  loss.value = values.loss;
  exposure.value = values.exposure;
  secret.value = "123456789";
  resetOutput();
}

async function runProof(event) {
  event.preventDefault();
  button.disabled = true;
  button.textContent = "Preparing prover...";
  setRunState("running", "Preparing proof", "Loading the proving engine in this browser tab.");
  markStage("load", "active");

  try {
    const { proveAgentRiskGuard } = await import("../src/testnet-prover.js");
    markStage("load", "complete");
    markStage("witness", "active");
    button.textContent = "Generating proof...";
    message.textContent = "Building the witness, generating the UltraHonk proof, and checking it locally.";

    const result = await proveAgentRiskGuard(artifact, {
      agent_secret: secret.value,
      order_notional: order.value,
      daily_loss: loss.value,
      post_trade_exposure_bps: exposure.value,
      max_order_notional: "2500000",
      max_daily_loss: "1000000",
      max_exposure_bps: "1800",
      agent_id: "845239",
      policy_commitment: "991827",
      intent_hash: "771203"
    }, {
      wasmPath: "./assets/barretenberg.wasm.gz",
      skipSrsInit: false,
      srsSize: 131072
    });

    for (const stage of ["witness", "prove", "verify"]) {
      markStage(stage, "complete");
    }
    setRunState("verified", "Proof verified", "The private trade state satisfied every public policy limit.");
    proofSize.textContent = `${(result.proofBytes / 1024).toFixed(1)} KB`;
    proofTime.textContent = `${(result.timings.totalTimeMs / 1000).toFixed(2)} s`;
    publicCount.textContent = Object.keys(result.publicInputs).length;
    commitment.textContent = result.actionCommitment;
  } catch (error) {
    console.error("ExpandZK prover error", error);
    const policyFailure = /Assertion failed|Cannot satisfy constraint|Failed constraint/i.test(error.message);
    markStage("witness", "failed");
    setRunState(
      "rejected",
      policyFailure ? "Proof rejected" : "Run failed",
      policyFailure
        ? "The witness violates the public trading policy, so the circuit refused to produce a proof."
        : `The prover returned: ${error.message}`
    );
  } finally {
    button.disabled = false;
    button.textContent = "Generate and verify proof";
  }
}

function resetOutput() {
  for (const stage of stages) {
    stage.className = "";
  }
  setRunState("ready", "Ready to prove", "Choose a scenario and start a testnet run.");
  proofSize.textContent = "--";
  proofTime.textContent = "--";
  publicCount.textContent = "--";
  commitment.textContent = "No proof generated";
}

function markStage(name, state) {
  const stage = stages.find((candidate) => candidate.dataset.stage === name);
  stage.className = state;
  if (state === "active") {
    const index = stages.indexOf(stage);
    for (const earlier of stages.slice(0, index)) {
      earlier.className = "complete";
    }
  }
}

function setRunState(kind, heading, detail) {
  title.textContent = heading;
  message.textContent = detail;
  status.textContent = kind === "verified" ? "Verified" : kind === "rejected" ? "Rejected" : kind === "running" ? "Running" : "Ready";
  status.className = `status-${kind}`;
}
