import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

  export default buildModule("CounterModule", (m) => {
    // Initialize proposals in constructor
  const initialProposals = ["Proposal 1", "Proposal 2", "Proposal 3"];
  
  const voting = m.contract("Voting", [initialProposals]);

  // Optionally add more proposals after deployment
  // m.call(voting, "addProposal", ["Proposal 4"]);

  return { voting };
});

// npx hardhat ignition deploy --network sepolia ignition/modules/Voting.ts