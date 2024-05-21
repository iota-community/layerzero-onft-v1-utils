// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import "@layerzerolabs/solidity-examples/contracts/token/onft721/ProxyONFT721.sol";

contract MyProxyONFT721 is ProxyONFT721 {
    constructor(
        uint _minGasToTransfer,
        address _lzEndpoint,
        address _proxyToken
    ) ProxyONFT721(_minGasToTransfer, _lzEndpoint, _proxyToken) {}
}
