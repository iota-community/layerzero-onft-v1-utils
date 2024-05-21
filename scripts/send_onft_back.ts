import { waitForMessageReceived } from "@layerzerolabs/scan-client";
import { ethers } from "hardhat";
import { pack } from "@ethersproject/solidity";

// Via the ONFT721 contract, send ONFT-wrapped tokens on the destination chain (e.g. BNB testnet) to the source chain (e.g. ShimmerEVM testnet)
async function sendONFTBack(
  proxyONFTContractAddress: string,
  onftContractAddress: string,
  lzEndpointIdOnSrcChain: string,
  lzEndpointIdOnDestChain: string,
  providedGasLimit: string,
  gasDropInWeiOnDestChain: string,
  sendingAccountPrivKey: string,
  receivingAccountAddress: string,
  nftTokenId: string,
  nftTokenAddress: string,
) {
  const sender = new ethers.Wallet(sendingAccountPrivKey, ethers.provider);

  console.log(
    `sendONFTBack - proxyONFTContractAddress:${proxyONFTContractAddress}, onftContractAddress:${onftContractAddress}, lzEndpointIdOnSrcChain:${lzEndpointIdOnSrcChain}, lzEndpointIdOnDestChain:${lzEndpointIdOnDestChain}, gasDropInWeiOnDestChain:${gasDropInWeiOnDestChain}, providedGasLimit:${providedGasLimit}, receivingAccountAddress:${receivingAccountAddress}, sender: ${sender.address}, nftTokenId:${nftTokenId}, nftTokenAddress:${nftTokenAddress}`,
  );

  // It is the ONFT721 contract whose sendFrom() func is to be called to transfer back the tokens
  const myONFT721Contract = await ethers.getContractAt("MyONFT721", onftContractAddress, sender);

  // Step 1: the sender approves his erc721 tokens for the ONFT721 contract
  const approveTx = await myONFT721Contract.approve(onftContractAddress, nftTokenId);
  const approveTxReceipt = await approveTx.wait();
  console.log("sendONFTBack - approve tx:", approveTxReceipt?.hash);

  // Set adapterParams with gas drop on destination
  // https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/lzApp/libs/LzLib.sol#L44
  // txType 2
  // bytes  [2       32        32            bytes[]         ]
  // fields [txType  extraGas  dstNativeAmt  dstNativeAddress]
  const defaultAdapterParams = pack(
    ["uint16", "uint256", "uint256", "bytes"],
    [2, Number(providedGasLimit), Number(gasDropInWeiOnDestChain), receivingAccountAddress],
  );

  // Step 2: call the func estimateSendFee() to estimate cross-chain fee to be paid in native on the source chain
  // https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/token/onft721/interfaces/IONFT721Core.sol#L70
  // false is set for _payInLzToken Flag indicating whether the caller is paying in the LZ token
  const [nativeFee] = await myONFT721Contract.estimateSendFee(
    lzEndpointIdOnSrcChain,
    receivingAccountAddress,
    nftTokenId,
    false,
    defaultAdapterParams,
  );
  console.log("sendONFTBack - estimated nativeFee:", ethers.formatEther(nativeFee));

  const senderAddress = await sender.getAddress();

  // Step 3: call the func sendFrom() to transfer tokens on source chain to destination chain
  // https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/token/onft721/interfaces/IONFT721Core.sol#L36
  const sendTx = await myONFT721Contract.sendFrom(
    senderAddress, // from
    lzEndpointIdOnSrcChain,
    receivingAccountAddress,
    nftTokenId,
    senderAddress, // refundAddress
    "0x0000000000000000000000000000000000000000", // _zroPaymentAddress
    defaultAdapterParams,
    {
      value: nativeFee,
    },
  );
  const sendTxReceipt = await sendTx.wait();
  console.log("sendONFTBack - send tx on source chain:", sendTxReceipt?.hash);

  // Wait for cross-chain tx finalization by LayerZero
  console.log("Wait for cross-chain tx finalization by LayerZero ...");
  const deliveredMsg = await waitForMessageReceived(
    Number(lzEndpointIdOnDestChain),
    sendTxReceipt?.hash as string,
  );
  console.log("sendONFTBack - received tx on destination chain:", deliveredMsg?.dstTxHash);
}

async function main() {
  const {
    proxyONFTContractAddress,
    onftContractAddress,
    lzEndpointIdOnSrcChain,
    lzEndpointIdOnDestChain,
    providedGasLimit,
    gasDropInWeiOnDestChain,
    SENDER_BACK_ACCOUNT_PRIV_KEY,
    RECEIVER_BACK_ACCOUNT_ADDRESS,
    nftTokenId,
    nftTokenAddress,
  } = process.env;

  // Check input params
  if (!proxyONFTContractAddress) {
    throw new Error("Missing proxyONFTContractAddress");
  } else if (!onftContractAddress) {
    throw new Error("Missing onftContractAddress");
  } else if (!lzEndpointIdOnSrcChain) {
    throw new Error("Missing lzEndpointIdOnSrcChain");
  } else if (!lzEndpointIdOnDestChain) {
    throw new Error("Missing lzEndpointIdOnDestChain");
  } else if (!providedGasLimit) {
    throw new Error("Missing providedGasLimit");
  } else if (!gasDropInWeiOnDestChain) {
    throw new Error("Missing gasDropInWeiOnDestChain");
  } else if (!SENDER_BACK_ACCOUNT_PRIV_KEY) {
    throw new Error("Missing SENDER_BACK_ACCOUNT_PRIV_KEY");
  } else if (!RECEIVER_BACK_ACCOUNT_ADDRESS) {
    throw new Error("Missing RECEIVER_BACK_ACCOUNT_ADDRESS");
  } else if (!nftTokenId) {
    throw new Error("Missing nftTokenId");
  } else if (!nftTokenAddress) {
    throw new Error("Missing nftTokenAddress");
  }

  await sendONFTBack(
    proxyONFTContractAddress,
    onftContractAddress,
    lzEndpointIdOnSrcChain,
    lzEndpointIdOnDestChain,
    providedGasLimit,
    gasDropInWeiOnDestChain,
    SENDER_BACK_ACCOUNT_PRIV_KEY,
    RECEIVER_BACK_ACCOUNT_ADDRESS,
    nftTokenId,
    nftTokenAddress,
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
