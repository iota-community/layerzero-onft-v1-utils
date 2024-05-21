import { ethers } from "hardhat";
import { pack } from "@ethersproject/solidity";

const MyProxyONFT_CONTRACT_NAME = process.env.MyProxyONFT_CONTRACT_NAME || "MyProxyONFT721";
const MyONFT_CONTRACT_NAME = process.env.MyONFT_CONTRACT_NAME || "MyONFT721";

async function setTrustedRemote(
  isForProxy: boolean,
  proxyONFTContractAddress: string,
  onftContractAddress: string,
  lzEndpointIdOnRemoteChain: string,
) {
  console.log(
    `setTrustedRemote - isForProxy:${isForProxy}, proxyONFTContractAddress:${proxyONFTContractAddress}, onftContractAddress:${onftContractAddress}, lzEndpointIdOnRemoteChain:${lzEndpointIdOnRemoteChain}`,
  );

  const myProxyONFTContract = await ethers.getContractAt(
    MyProxyONFT_CONTRACT_NAME,
    proxyONFTContractAddress,
  );

  const myONFTContract = await ethers.getContractAt(MyONFT_CONTRACT_NAME, onftContractAddress);

  const myContract = isForProxy ? myProxyONFTContract : myONFTContract;
  const myRemote = isForProxy
    ? pack(["address", "address"], [onftContractAddress, proxyONFTContractAddress])
    : pack(["address", "address"], [proxyONFTContractAddress, onftContractAddress]);

  const tx = await myContract.setTrustedRemote(Number(lzEndpointIdOnRemoteChain), myRemote);
  const txReceipt = await tx.wait();
  console.log("setTrustedRemote tx:", txReceipt?.hash);
}

async function main() {
  const {
    isForProxy,
    proxyONFTContractAddress,
    onftContractAddress,
    lzEndpointIdOnSrcChain,
    lzEndpointIdOnDestChain,
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
  }

  await setTrustedRemote(
    isForProxy === "true" ? true : false,
    proxyONFTContractAddress,
    onftContractAddress,
    isForProxy === "true" ? lzEndpointIdOnDestChain : lzEndpointIdOnSrcChain,
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
