// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./implementations/HelloWorld_V1.sol";

contract AnyflowFactory {
    address public implementation;

    event CloneCreated(address clone);

    constructor(address _implementation) {
        implementation = _implementation;
    }

    function createClone(
        address _initialOwner,
        string memory _helloMessage
    ) external returns (address) {
        address clone = Clones.clone(implementation);
        // Initialize the clone
        AnyflowHelloWorld_V1(clone).initialize(_initialOwner, _helloMessage);
        emit CloneCreated(clone);
        return clone;
    }
}
