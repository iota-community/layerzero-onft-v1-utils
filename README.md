# Utilities for LayerZero ONFT V1

Implemented by IOTA Foundation.

## Introduction

Utilities for LayerZero ONFT V1 that facilitate cross-chain sending of erc721 tokens (erc1155 coming soon) between some source chain (e.g. ShimmerEVM testnet) and some destination chain (e.g. BNB testnet):

- Sample Solidity code for ProxyONFT721 and ONFT721 contracts
- Scripts for:
  - Deploy mock ERC721 contract (for test)
  - Deploy ProxyONFT721 and ONFT721 contracts
  - Set trusted remote
  - Set min destination gas
  - Set batch size limit
  - Send tokens from source chain to destinaion chain and vice versa

## ProxyONFT and ONFT contracts

**Use-case 1**

To enable the existing erc721 tokens for cross-chain sending, both ProxyONFT contract (on source chain) and ONFT contract (on destination chain) are needed.

The origin NFT token will be locked in the ProxyONFT so that the ONFT-wrapped tokens will be minted on the destination chain. If the NFT token already exists on the destination chain (this happens when the ONFT-wrapped token on destination chain is sent back to the source chain), no new token minting will happen. Instead, the NFT tokens will be transferred from the ONFT contract to the user wallet address. [Relevant code](https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/token/onft721/ONFT721.sol#L40)

**Use-case 2**

For new erc721 tokens to be launched, ONFT standard can be leveraged to enable cross-chain sending without the need of ProxyONFT. Similarly to the above: lock on source chain and mint or transfer on destination chain.

**Contracts:**

- [ProxyONFT721](https://docs.layerzero.network/v1/developers/evm-guides/contract-standards/721#proxyonft721sol)
- [ProxyONFT1155](https://docs.layerzero.network/v1/developers/evm-guides/contract-standards/1155#proxyonft1155sol)
- [ONFT721](https://docs.layerzero.network/v1/developers/evm-guides/contract-standards/721#onft721sol)
- [ONFT1155](https://docs.layerzero.network/v1/developers/evm-guides/contract-standards/1155#onft1155sol)

## Scripts

### Deploy ProxyONFT and ONFT contracts

#### For erc721

- MyProxyONFT721.sol:

  - CTOR:
    - [minGasToTransferAndStore](https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/token/onft721/ONFT721Core.sol#L169): The minimum gas needed to transfer and store your NFT, typically 100k for ERC721. This value would vary depending on your contract complexity, it's recommended to test. If this value is set too low, the destination tx will fail and a manual retry is needed
    - lzEndpoint: LayerZero Endpoint on the source chain
    - proxyToken: deployed contract address of the NFT tokens on source chain

- MyONFT721.sol:
  - CTOR:
    - name: name of the ONFT-wrapped tokens on the destination chain
    - symbol: symbol of the ONFT-wrapped tokens on the destination chain
    - [minGasToTransferAndStore](https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/token/onft721/ONFT721Core.sol#L169): same as above
    - lzEndpoint: - lzEndpoint: LayerZero Endpoint on the destination chain

### Set trusted remote

For existing erc721 tokens, both of the ProxyONFT and ONFT contract instances need to be paired with each other.

For the upcoming erc721 tokens that wanna leverage ONFT standard, the ONFT contract instance on the source chain needs to be paired with another ONFT contract instance on the destination chain.

This setting is done via the method [setTrustedRemote](https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/lzApp/LzApp.sol#L138)

### Set min destination gas

Both of the ProxyONFT contract instance and the ONFT contract instance need to be set for min gas on destination.

This setting is done via the method [setMinDstGas](https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/lzApp/LzApp.sol#L159)

Reference of [minGasLimit](https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/lzApp/LzApp.sol#L85C37-L85C48)

**Notice:**
It is required that `minDstGas` <= `providedGasLimit` which is to be set via `adapterParams` upon cross-chain sending on source chain.

### Set batch size limit

Both of the ProxyONFT contract instance and the ONFT contract instance need to be set for batch size limit on source chain to limit the number of tokens to be sent to other chain when using the method [sendBatchFrom](https://github.com/LayerZero-Labs/solidity-examples/blob/c04e7d211b1b610f84761df943e6a38b0a53d304/contracts/token/onft721/ONFT721Core.sol#L67).

This setting is done via the method [setDstChainIdToBatchLimit](https://github.com/LayerZero-Labs/solidity-examples/blob/c04e7d211b1b610f84761df943e6a38b0a53d304/contracts/token/onft721/ONFT721Core.sol#L194)

Reference of [dstChainIdToBatchLimit](https://github.com/LayerZero-Labs/solidity-examples/blob/c04e7d211b1b610f84761df943e6a38b0a53d304/contracts/token/onft721/ONFT721Core.sol#L90)

**Notice:**
Default value is 1

### Procedure to send tokens from source chain to destinaion chain and vice versa

For the existing erc721 tokens that involve with both ProxyONFT contract (on source chain) and ONFT contract (on destination chain), the token sending procedure is as follows:

1. The sender approves his erc721 tokens for the ProxyONFT contract
2. The sender calls the func `estimateSendFee()` of the ProxyONFT contract to estimate cross-chain fee to be paid in native on the source chain
3. The sender calls the func `sendFrom()` of the ProxyONFT contract to transfer tokens on source chain to destination chain
4. Optional: wait for the tx finalization on destination chain by using the lib [@layerzerolabs/scan-client](https://www.npmjs.com/package/@layerzerolabs/scan-client#example-usage)

To send back the ONFT-wrapped tokens on destination chain to source chain, the procedure is similar (approve step is also needed) but the operations will be on the ONFT contract.

**AdapterParams Notice**

- To set gas drop on destination in `adapterParams`, reference [this](https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/lzApp/libs/LzLib.sol#L44)

  - The provided gas drop must <= the config one. Otherwise, will get error [dstNativeAmt too large](https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/lzApp/mocks/LZEndpointMock.sol#L413)

- To set default `adapterParams` without gas drop need, reference [this](https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/lzApp/libs/LzLib.sol#L34)

**Appendix:**

- [function estimateSendFee()](https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/token/onft721/interfaces/IONFT721Core.sol#L70)
- [function sendFrom()](https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/token/onft721/interfaces/IONFT721Core.sol#L36)
- [@layerzerolabs/scan-client](https://www.npmjs.com/package/@layerzerolabs/scan-client#example-usage)
- [LayerZero Endpoint V1](https://docs.layerzero.network/v1/developers/evm/technical-reference/mainnet/mainnet-addresses)
- [LayerZero explorer](https://testnet.layerzeroscan.com/)

## Installation

`yarn`

## Compile contracts

`yarn compile`

## Configuration

The config is specified in the template file `.env.example` that needs to be copied to another file `.env`.

## Deploy contracts

### Deploy mock ERC721

`yarn deploy-erc721-mock-smr-testnet`

Log output:

```
$ npx hardhat run scripts/deploy_erc721.ts --network shimmerEvmTestnet
Deployed ERC721Mock contract address:0xFddbA8928a763679fb8C99d12541B7c6177e9c3c
Done in 4.49s.
```

### Deploy ProxyONFT721 on source chain (e.g. ShimmerEVM testnet)

`yarn deploy-proxy-onft-smr-testnet`

Log output:

```
$ npx hardhat run scripts/deploy_proxy_onft721.ts --network shimmerEvmTestnet
Deployed MyProxyONFT721 contract address:0x7B0D46219C915e7Ff503C7F83a805c0b2F4ab2F2
Done in 4.50s.
```

### Deploy ONFT on destination chain (e.g. BNB testnet)

`yarn deploy-onft-bnb-testnet`

Log output:

```
$ npx hardhat run scripts/deploy_onft721.ts --network bnbTestnet
Deployed MyONFT721 contract address:0xC617A0Bd9DC6093a304515d3dbFF4244333fDeBB
Done in 7.74s.
```

## Set min destination gas

### On ProxyONFT (source chain, e.g. ShimmerEVM testnet)

`yarn set-min-dest-gas-proxy-onft-smr-testnet`

Log output:

```
$ export isForProxy=true && npx hardhat run scripts/set_min_destination_gas.ts --network shimmerEvmTestnet
setMinDstGas - isForProxy:true, proxyONFTContractAddress:0x7B0D46219C915e7Ff503C7F83a805c0b2F4ab2F2, onftContractAddress:0xC617A0Bd9DC6093a304515d3dbFF4244333fDeBB, lzEndpointIdOnRemoteChain:10102, minDstGas:150000
setMinDstGas (packetType 0) tx: 0xcab06e9989448153a4bbc1bb166fc2d33467f3311d1851bf2ff719d982daa613
setMinDstGas (packetType 1) tx: 0xe78fd3f0bf668fafbc423decd2cf14a27d74543af3ac9daf031f0b278c22ea78
Done in 6.07s.
```

### On ONFT (destination chain, e.g. BNB testnet)

`yarn set-min-dest-gas-onft-bnb-testnet`

Log output:

```
$ export isForProxy=false && npx hardhat run scripts/set_min_destination_gas.ts --network bnbTestnet
setMinDstGas - isForProxy:false, proxyONFTContractAddress:0x7B0D46219C915e7Ff503C7F83a805c0b2F4ab2F2, onftContractAddress:0xC617A0Bd9DC6093a304515d3dbFF4244333fDeBB, lzEndpointIdOnRemoteChain:10230, minDstGas:150000
setMinDstGas (packetType 0) tx: 0xce044ded17daa77a8aefc3d39b99c5381216eb4057ddce6253affde6cda2091c
setMinDstGas (packetType 1) tx: 0x3a26ae40ac058099bfd8b85910009a5e5e8b03f16a5f032b572827d48be8f2b0
Done in 9.34s.
```

## Set batch size limit

### On ProxyONFT (source chain, e.g. ShimmerEVM testnet)

`yarn set-batch-size-limit-proxy-onft-smr-testnet`

Log output:

```
$ export isForProxy=true && npx hardhat run scripts/set_batch_size_limit.ts --network shimmerEvmTestnet
setBatchSizeLimit - isForProxy:true, proxyONFTContractAddress:0x7B0D46219C915e7Ff503C7F83a805c0b2F4ab2F2, onftContractAddress:0xC617A0Bd9DC6093a304515d3dbFF4244333fDeBB, lzEndpointIdOnRemoteChain:10102, batchSizeLimit:1
setBatchSizeLimit tx: 0x70c23b3d3d5e94ef82e50944f7eba93fa1fe8db3a5487ac371015e7a14482e75
Done in 4.28s.
```

### On ONFT (destination chain, e.g. BNB testnet)

`yarn set-batch-size-limit-onft-bnb-testnet`

Log output:

```
$ export isForProxy=false && npx hardhat run scripts/set_batch_size_limit.ts --network bnbTestnet
setBatchSizeLimit - isForProxy:false, proxyONFTContractAddress:0x7B0D46219C915e7Ff503C7F83a805c0b2F4ab2F2, onftContractAddress:0xC617A0Bd9DC6093a304515d3dbFF4244333fDeBB, lzEndpointIdOnRemoteChain:10230, batchSizeLimit:1
setBatchSizeLimit tx: 0x8cb44c2195ac93da552c646677e6585c95ab172df19463637541933ec70dc9b8
Done in 4.26s.
```

## Set trusted remote

### On ProxyONFT (source chain, e.g. ShimmerEVM testnet)

`yarn set-remote-proxy-onft-smr-testnet`

Log output:

```
$ export isForProxy=true && npx hardhat run scripts/set_trusted_remote.ts --network shimmerEvmTestnet
setTrustedRemote - isForProxy:true, proxyONFTContractAddress:0x7B0D46219C915e7Ff503C7F83a805c0b2F4ab2F2, onftContractAddress:0xC617A0Bd9DC6093a304515d3dbFF4244333fDeBB, lzEndpointIdOnRemoteChain:10102
setTrustedRemote tx: 0xce52c0f25090ef7c1668ef04ff2f6098551c9f56b3ce881d17181bf106457016
Done in 4.24s.
```

### On ONFT (destination chain, e.g. BNB testnet)

`yarn set-remote-onft-bnb-testnet`

Log output:

```
$ export isForProxy=false && npx hardhat run scripts/set_trusted_remote.ts --network bnbTestnet
setTrustedRemote - isForProxy:false, proxyONFTContractAddress:0x7B0D46219C915e7Ff503C7F83a805c0b2F4ab2F2, onftContractAddress:0xC617A0Bd9DC6093a304515d3dbFF4244333fDeBB, lzEndpointIdOnRemoteChain:10230
setTrustedRemote tx: 0x311a0568b5afce7d601df2613f8ff80428d8a4d2f2c91012e0e4a8cbc0aedf59
Done in 4.88s.
```

## Send origin tokens from source chain to destinaion chain

`yarn send-onft-from-smr-testnet`

Log output:

```
$ npx hardhat run scripts/send_onft.ts --network shimmerEvmTestnet
sendONFT - proxyONFTContractAddress:0x7B0D46219C915e7Ff503C7F83a805c0b2F4ab2F2, onftContractAddress:0xC617A0Bd9DC6093a304515d3dbFF4244333fDeBB, lzEndpointIdOnSrcChain:10230, lzEndpointIdOnDestChain:10102, gasDropInWeiOnDestChain:0, providedGasLimit:200000, receivingAccountAddress:0x5e812d3128D8fD7CEac08CEca1Cd879E76a6E028, sender: 0x57A4bD139Fb673D364A6f12Df9177A3f686625F3, nftTokenId:2, nftTokenAddress:0xFddbA8928a763679fb8C99d12541B7c6177e9c3c
sendONFT - approve tx: 0xa871bc79e45bf20f33c626044d6e208460c5745ab1f13d476dcbe04e1da7e592
sendONFT - estimated nativeFee: 158.319172348046094655
sendONFT - send tx on source chain: 0x72779c7549053194e42bcc78f78cf65e876867f0516dc91f28986c854e652596
Wait for cross-chain tx finalization by LayerZero ...
sendONFT - received tx on destination chain: 0x2700a9d35c139eb84ba07b75490e6627a30e00bde130e3cb7c1cbb81c0326138
Done in 53.50s.
```

## Send ONFT-wrapped tokens back from destinaion chain to origin chain

`yarn send-onft-back-from-bnb-testnet`

Log output:

```
$ npx hardhat run scripts/send_onft_back.ts --network bnbTestnet
sendONFTBack - proxyONFTContractAddress:0x7B0D46219C915e7Ff503C7F83a805c0b2F4ab2F2, onftContractAddress:0xC617A0Bd9DC6093a304515d3dbFF4244333fDeBB, lzEndpointIdOnSrcChain:10230, lzEndpointIdOnDestChain:10102, gasDropInWeiOnDestChain:0, providedGasLimit:200000, receivingAccountAddress:0x57A4bD139Fb673D364A6f12Df9177A3f686625F3, sender: 0x60917645A28258a75836aF63633850c5F3561C1b, nftTokenId:2, nftTokenAddress:0xFddbA8928a763679fb8C99d12541B7c6177e9c3c
sendONFTBack - approve tx: 0xe5bfff108528efdc67e72896845f0ad3e0186b4ed64835e7c5f3552eaab69d99
sendONFTBack - estimated nativeFee: 0.000498452810033053
sendONFTBack - send tx on source chain: 0xa43bb5547a5a35730fe183b4d554416a4ea34852e510d21f24d173db75db4e79
Wait for cross-chain tx finalization by LayerZero ...
sendONFTBack - received tx on destination chain: 0xb05fa2de194153819b26d17893278c485abbaf355fa24f26fbc7a4c759994cde
Done in 212.16s.
```
