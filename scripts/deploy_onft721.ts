import { ethers } from "hardhat";

const MyONFT_CONTRACT_NAME = process.env.MyONFT_CONTRACT_NAME || "MyONFT721";

async function deployONFT721(
  nftCollectionName: string,
  nftCollectionSymbol: string,
  minGasToTransferAndStore: string,
  lzEndpointOnDestChain: string,
) {
  const ONFTContract = await ethers.deployContract(MyONFT_CONTRACT_NAME, [
    nftCollectionName,
    nftCollectionSymbol,
    minGasToTransferAndStore,
    lzEndpointOnDestChain,
  ]);
  await ONFTContract.waitForDeployment();

  console.log(
    `Deployed ${MyONFT_CONTRACT_NAME} contract address:${await ONFTContract.getAddress()}`,
  );
}

async function main() {
  const {
    minGasToTransferAndStore,
    lzEndpointOnDestChain,
    nftCollectionName,
    nftCollectionSymbol,
  } = process.env;

  if (!minGasToTransferAndStore) {
    throw new Error("Missing minGasToTransferAndStore");
  } else if (!lzEndpointOnDestChain) {
    throw new Error("Missing lzEndpointOnDestChain");
  } else if (!nftCollectionName) {
    throw new Error("Missing nftCollectionName");
  } else if (!nftCollectionSymbol) {
    throw new Error("Missing nftCollectionSymbol");
  }

  await deployONFT721(
    nftCollectionName,
    nftCollectionSymbol,
    minGasToTransferAndStore,
    lzEndpointOnDestChain,
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
