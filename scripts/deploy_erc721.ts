import { ethers } from "hardhat";

const ERC721Mock_CONTRACT_NAME = process.env.ERC721Mock_CONTRACT_NAME || "ERC721Mock";

async function deployERC721Mock(
  nftCollectionName: string,
  nftCollectionSymbol: string,
  nftCollectionBaseTokenLink: string,
) {
  const erc721MockContract = await ethers.deployContract(ERC721Mock_CONTRACT_NAME, [
    nftCollectionName,
    nftCollectionSymbol,
    nftCollectionBaseTokenLink,
  ]);
  await erc721MockContract.waitForDeployment();

  console.log(
    `Deployed ${ERC721Mock_CONTRACT_NAME} contract address:${await erc721MockContract.getAddress()}`,
  );
}

async function main() {
  const { nftCollectionName, nftCollectionSymbol, nftCollectionBaseTokenLink } = process.env;

  if (!nftCollectionName) {
    throw new Error("Missing nftCollectionName");
  } else if (!nftCollectionSymbol) {
    throw new Error("Missing nftCollectionSymbol");
  } else if (!nftCollectionBaseTokenLink) {
    throw new Error("Missing nftCollectionBaseTokenLink");
  }

  await deployERC721Mock(nftCollectionName, nftCollectionSymbol, nftCollectionBaseTokenLink);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
