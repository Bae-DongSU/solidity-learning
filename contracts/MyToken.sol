// contracts/MyToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ManageAccess.sol";

contract MyToken is ManageAccess {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed spender, uint256 amount);

    string public name;
    string public symbol;
    uint8 public decimals;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    /// @param _name      토큰명
    /// @param _symbol    심볼
    /// @param _decimal   소수점 자리
    /// @param _amount    초기 발행량
    /// @param _mgrs      매니저 리스트 (테스트에서 [msg.sender] 전달)
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimal,
        uint256 _amount,
        address[] memory _mgrs
    )
        ManageAccess(
            msg.sender,   // owner
            msg.sender,   // (기존) single manager
            _mgrs         // (신규) multi-manager 리스트
        )
    {
        name     = _name;
        symbol   = _symbol;
        decimals = _decimal;
        _mint(_amount * 10**uint256(decimals), msg.sender);
    }

    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
        emit Approval(spender, amount);
    }

    function transfer(uint256 amount, address to) external {
        require(balanceOf[msg.sender] >= amount, "insufficient error!");
        balanceOf[msg.sender]   -= amount;
        balanceOf[to]           += amount;
        emit Transfer(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external {
        address spender = msg.sender;
        require(allowance[from][spender] >= amount, "insufficient allowance");
        allowance[from][spender] -= amount;
        balanceOf[from]          -= amount;
        balanceOf[to]            += amount;
        emit Transfer(from, to, amount);
    }

    function mint(uint256 amount, address to) external onlyManager {
        _mint(amount, to);
    }

    /// (선택) 매니저 추가가 필요할 때
    function setMgr(address _manager) external onlyOwner {
        require(!isManager[_manager], "already manager");
        isManager[_manager] = true;
        managers.push(_manager);
    }

    function _mint(uint256 amount, address to) internal {
        totalSupply          += amount;
        balanceOf[to]        += amount;
        emit Transfer(address(0), to, amount);
    }
}
