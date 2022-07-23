// SPDX-License-Identifier: MIT
// 1. Pragma
pragma solidity ^0.8.9;

// 2. Imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// 3. Interfaces, Libraries, Contracts
error FundMe__NotOwner();

contract FundMe {

    // State Variables
    uint constant MINIMUM_USD = 50 * 10**18;
    address private immutable i_owner;
    address[] private s_funders;
    mapping(address => uint) private s_addressToAmountFunded;

    // Events

    // Modifiers
    modifier onlyOnwer() {
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    // Function Order:
    // 1. constructor
    // 2. receive
    // 3. fallback
    // 4. external
    // 5. public
    // 6. internal
    // 7. private
    // 8. view/pure

    constructor() {
        i_owner = msg.sender;
    }

// Funds our contracts with ETH
    function fund() payable public {
        require(msg.value >= MINIMUM_USD, "More ETH required");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

// Onwer can withdraw all funds from contracts
    function withdraw() public payable onlyOnwer {
        // This loop has to read thru storage everytime making it a bit pricy on GAS.
        for (uint256 funderIndex = 0; funderIndex < s_funders.length; funderIndex++) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, )= i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function cheaperWithdraw() public payable onlyOnwer {
        address[] memory funders = s_funders;
        // Reading from memory instead of storage
        for (uint256 funderIndex; funderIndex < s_funders.length; funderIndex++) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funderAddress) public view returns (uint256) {
        return s_addressToAmountFunded[funderAddress];
    }
}
