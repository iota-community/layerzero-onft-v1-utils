import { ethers } from "hardhat";

const MyProxyONFT_CONTRACT_NAME = process.env.MyProxyONFT_CONTRACT_NAME || "MyProxyONFT721";
const MyONFT_CONTRACT_NAME = process.env.MyONFT_CONTRACT_NAME || "MyONFT721";

async function setBatchSizeLimit(
  isForProxy: boolean,
  proxyONFTContractAddress: string,
  onftContractAddress: string,
  lzEndpointIdOnRemoteChain: string,
  batchSizeLimit: string,
) {
  console.log(
    `setBatchSizeLimit - isForProxy:${isForProxy}, proxyONFTContractAddress:${proxyONFTContractAddress}, onftContractAddress:${onftContractAddress}, lzEndpointIdOnRemoteChain:${lzEndpointIdOnRemoteChain}, batchSizeLimit:${batchSizeLimit}`,
  );

  const myProxyONFTContract = await ethers.getContractAt(
    MyProxyONFT_CONTRACT_NAME,
    proxyONFTContractAddress,
  );

  const myONFTContract = await ethers.getContractAt(MyONFT_CONTRACT_NAME, onftContractAddress);

  const myContract = isForProxy ? myProxyONFTContract : myONFTContract;

  const tx = await myContract.setDstChainIdToBatchLimit(
    Number(lzEndpointIdOnRemoteChain),
    batchSizeLimit,
  );
  const txReceipt = await tx.wait();
  console.log("setBatchSizeLimit tx:", txReceipt?.hash);
}

async function main() {
  const {
    isForProxy,
    proxyONFTContractAddress,
    onftContractAddress,
    lzEndpointIdOnSrcChain,
    lzEndpointIdOnDestChain,
    batchSizeLimit,
  } = process.env;

  if (!isForProxy) {
    throw new Error("Missing isForProxy");
  } else if (!proxyONFTContractAddress) {
    throw new Error("Missing proxyONFTContractAddress");
  } else if (!onftContractAddress) {
    throw new Error("Missing onftContractAddress");
  } else if (!lzEndpointIdOnSrcChain) {
    throw new Error("Missing lzEndpointIdOnSrcChain");
  } else if (!lzEndpointIdOnDestChain) {
    throw new Error("Missing lzEndpointIdOnDestChain");
  } else if (!batchSizeLimit) {
    throw new Error("Missing batchSizeLimit");
  }

  await setBatchSizeLimit(
    isForProxy === "true" ? true : false,
    proxyONFTContractAddress,
    onftContractAddress,
    isForProxy === "true" ? lzEndpointIdOnDestChain : lzEndpointIdOnSrcChain,
    batchSizeLimit,
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
