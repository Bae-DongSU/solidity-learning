//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MyToken {
    string public name;
    string public symbol;
    uint8 public decimals; 

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    constructor(string memory _name, string memory _symbol, uint8 _decimal, uint256 _amount) {
        name = _name;
        symbol = _symbol;
        decimals = _decimal;
        
        _mint(_amount*10**18, msg.sender); //1MT
        
    }

    function _mint(uint256 amount, address owner) internal {
        totalSupply = totalSupply + amount;
        balanceOf[owner] = balanceOf[owner] + amount;
    }

    function transfer(uint256 amount, address to) external {
        require(balanceOf[msg.sender] >= amount, "insufficient error!");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
    }
}
