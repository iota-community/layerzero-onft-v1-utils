// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import "@layerzerolabs/solidity-examples/contracts/token/onft721/ONFT721.sol";

contract MyONFT721 is ONFT721 {
    constructor(
        string memory _name,
        string memory _symbol,
        uint _minGasToTransfer,
        address _lzEndpoint
    ) ONFT721(_name, _symbol, _minGasToTransfer, _lzEndpoint) {}
}
