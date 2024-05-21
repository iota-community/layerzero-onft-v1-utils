import { ethers } from "hardhat";

const MyProxyONFT_CONTRACT_NAME = process.env.MyProxyONFT_CONTRACT_NAME || "MyProxyONFT721";
const MyONFT_CONTRACT_NAME = process.env.MyONFT_CONTRACT_NAME || "MyONFT721";

async function setMinDstGas(
  isForProxy: boolean,
  proxyONFTContractAddress: string,
  onftContractAddress: string,
  lzEndpointIdOnRemoteChain: string,
  minDstGas: string,
) {
  console.log(
    `setMinDstGas - isForProxy:${isForProxy}, proxyONFTContractAddress:${proxyONFTContractAddress}, onftContractAddress:${onftContractAddress}, lzEndpointIdOnRemoteChain:${lzEndpointIdOnRemoteChain}, minDstGas:${minDstGas}`,
  );

  const myProxyONFTContract = await ethers.getContractAt(
    MyProxyONFT_CONTRACT_NAME,
    proxyONFTContractAddress,
  );

  const myONFTContract = await ethers.getContractAt(MyONFT_CONTRACT_NAME, onftContractAddress);

  const myContract = isForProxy ? myProxyONFTContract : myONFTContract;

  let tx = await myContract.setMinDstGas(Number(lzEndpointIdOnRemoteChain), 0, minDstGas);
  let txReceipt = await tx.wait();
  console.log("setMinDstGas (packetType 0) tx:", txReceipt?.hash);

  tx = await myContract.setMinDstGas(Number(lzEndpointIdOnRemoteChain), 1, minDstGas);
  txReceipt = await tx.wait();
  console.log("setMinDstGas (packetType 1) tx:", txReceipt?.hash);
}

async function main() {
  const {
    isForProxy,
    proxyONFTContractAddress,
    onftContractAddress,
    lzEndpointIdOnSrcChain,
    lzEndpointIdOnDestChain,
    minDstGas,
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
  } else if (!minDstGas) {
    throw new Error("Missing minDstGas");
  }

  await setMinDstGas(
    isForProxy === "true" ? true : false,
    proxyONFTContractAddress,
    onftContractAddress,
    isForProxy === "true" ? lzEndpointIdOnDestChain : lzEndpointIdOnSrcChain,
    minDstGas,
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
