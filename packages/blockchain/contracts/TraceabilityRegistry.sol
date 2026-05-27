// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TraceabilityRegistry {
    address public immutable owner;

    mapping(string batchId => bytes32 batchHash) public batchHashes;

    event BatchHashWritten(
        string indexed batchId,
        bytes32 indexed batchHash,
        address indexed writer
    );

    error EmptyBatchId();
    error EmptyBatchHash();
    error Unauthorized();

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert Unauthorized();
        }
        _;
    }

    function writeHash(string calldata batchId, bytes32 batchHash) external onlyOwner {
        if (bytes(batchId).length == 0) {
            revert EmptyBatchId();
        }

        if (batchHash == bytes32(0)) {
            revert EmptyBatchHash();
        }

        batchHashes[batchId] = batchHash;

        emit BatchHashWritten(batchId, batchHash, msg.sender);
    }
}
