const hre = require("hardhat");

async function main() {
  const InsuranceClaim = await hre.ethers.getContractFactory("InsuranceClaim");
  const insuranceClaim = await InsuranceClaim.deploy();
  await insuranceClaim.waitForDeployment();

  console.log(`InsuranceClaim deployed to: ${await insuranceClaim.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
