import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect("sepolia");

  const Contract = await ethers.getContractFactory("HealthWalletConsent");
  const contract = await Contract.deploy();

  await contract.waitForDeployment();

  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});