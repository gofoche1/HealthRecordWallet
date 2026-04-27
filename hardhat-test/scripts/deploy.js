import hre from "hardhat";

async function main() {
  const Contract = await hre.ethers.getContractFactory("HealthWalletConsent");
  const contract = await Contract.deploy();

  await contract.waitForDeployment();

  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


/* const hre = require("hardhat");

async function main() {
  const Contract = await hre.ethers.getContractFactory("HealthWalletConsent");
  const contract = await Contract.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("Contract deployed to:", address);
}

main();*/