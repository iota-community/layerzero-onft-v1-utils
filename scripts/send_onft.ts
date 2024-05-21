import { waitForMessageReceived } from "@layerzerolabs/scan-client";
import { ethers } from "hardhat";
import { pack } from "@ethersproject/solidity";

const ERC721_TOKEN_APPROVE_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Via the ProxyONFT721 contract, send erc721 tokens on the source chain (e.g. ShimmerEVM testnet) to the destination chain (e.g. BNB testnet)
async function sendONFT(
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
    `sendONFT - proxyONFTContractAddress:${proxyONFTContractAddress}, onftContractAddress:${onftContractAddress}, lzEndpointIdOnSrcChain:${lzEndpointIdOnSrcChain}, lzEndpointIdOnDestChain:${lzEndpointIdOnDestChain}, gasDropInWeiOnDestChain:${gasDropInWeiOnDestChain}, providedGasLimit:${providedGasLimit}, receivingAccountAddress:${receivingAccountAddress}, sender: ${sender.address}, nftTokenId:${nftTokenId}, nftTokenAddress:${nftTokenAddress}`,
  );

  // It is the ProxyONFT721 contract whose sendFrom() func is to be called to transfer tokens cross-chain
  const myProxyONFT721Contract = await ethers.getContractAt(
    "MyProxyONFT721",
    proxyONFTContractAddress,
    sender,
  );

  const erc721TokenContract = await ethers.getContractAt(
    ERC721_TOKEN_APPROVE_ABI,
    nftTokenAddress,
    sender,
  );

  // Step 1: the sender approves his erc721 tokens for the ProxyONFT721 contract
  const approveTx = await erc721TokenContract.approve(proxyONFTContractAddress, nftTokenId);
  const approveTxReceipt = await approveTx.wait();
  console.log("sendONFT - approve tx:", approveTxReceipt?.hash);

  // const receivingAccountAddressInBytes = zeroPad(receivingAccountAddress, 32);

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
  const [nativeFee] = await myProxyONFT721Contract.estimateSendFee(
    lzEndpointIdOnDestChain,
    receivingAccountAddress,
    nftTokenId,
    false,
    defaultAdapterParams,
  );
  console.log("sendONFT - estimated nativeFee:", ethers.formatEther(nativeFee));

  const senderAddress = await sender.getAddress();

  // Step 3: call the func sendFrom() to transfer tokens on source chain to destination chain
  // https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/token/onft721/interfaces/IONFT721Core.sol#L36
  const sendTx = await myProxyONFT721Contract.sendFrom(
    senderAddress, // from
    lzEndpointIdOnDestChain,
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
  console.log("sendONFT - send tx on source chain:", sendTxReceipt?.hash);

  // Wait for cross-chain tx finalization by LayerZero
  console.log("Wait for cross-chain tx finalization by LayerZero ...");
  const deliveredMsg = await waitForMessageReceived(
    Number(lzEndpointIdOnDestChain),
    sendTxReceipt?.hash as string,
  );
  console.log("sendONFT - received tx on destination chain:", deliveredMsg?.dstTxHash);
}

async function main() {
  const {
    proxyONFTContractAddress,
    onftContractAddress,
    lzEndpointIdOnSrcChain,
    lzEndpointIdOnDestChain,
    providedGasLimit,
    gasDropInWeiOnDestChain,
    SENDER_ACCOUNT_PRIV_KEY,
    RECEIVER_ACCOUNT_ADDRESS,
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
  } else if (!SENDER_ACCOUNT_PRIV_KEY) {
    throw new Error("Missing SENDER_ACCOUNT_PRIV_KEY");
  } else if (!RECEIVER_ACCOUNT_ADDRESS) {
    throw new Error("Missing RECEIVER_ACCOUNT_ADDRESS");
  } else if (!nftTokenId) {
    throw new Error("Missing nftTokenId");
  } else if (!nftTokenAddress) {
    throw new Error("Missing nftTokenAddress");
  }

  await sendONFT(
    proxyONFTContractAddress,
    onftContractAddress,
    lzEndpointIdOnSrcChain,
    lzEndpointIdOnDestChain,
    providedGasLimit,
    gasDropInWeiOnDestChain,
    SENDER_ACCOUNT_PRIV_KEY,
    RECEIVER_ACCOUNT_ADDRESS,
    nftTokenId,
    nftTokenAddress,
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
