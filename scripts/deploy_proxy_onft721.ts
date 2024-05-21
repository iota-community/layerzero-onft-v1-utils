import { ethers } from "hardhat";

const MyProxyONFT_CONTRACT_NAME = process.env.MyProxyONFT_CONTRACT_NAME || "MyProxyONFT721";

async function deployProxyONFT721(
  minGasToTransferAndStore: string,
  lzEndpointOnSrcChain: string,
  nftTokenAddress: string,
) {
  const proxyONFTContract = await ethers.deployContract(MyProxyONFT_CONTRACT_NAME, [
    minGasToTransferAndStore,
    lzEndpointOnSrcChain,
    nftTokenAddress,
  ]);
  await proxyONFTContract.waitForDeployment();

  console.log(
    `Deployed ${MyProxyONFT_CONTRACT_NAME} contract address:${await proxyONFTContract.getAddress()}`,
  );
}

async function main() {
  const { minGasToTransferAndStore, lzEndpointOnSrcChain, nftTokenAddress } = process.env;

  if (!minGasToTransferAndStore) {
    throw new Error("Missing minGasToTransferAndStore");
  } else if (!lzEndpointOnSrcChain) {
    throw new Error("Missing lzEndpointOnSrcChain");
  } else if (!nftTokenAddress) {
    throw new Error("Missing nftTokenAddress");
  }

  await deployProxyONFT721(minGasToTransferAndStore, lzEndpointOnSrcChain, nftTokenAddress);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
