// contracts/TinyBank.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ManageAccess.sol";

interface IMyToken {
    function transfer(uint256 amount, address to) external;
    function transferFrom(address from, address to, uint256 amount) external;
    function mint(uint256 amount, address owner) external;
    function setMgr(address _manager) external;
}

contract TinyBank is ManageAccess {
    event Staked(address from, uint256 amount);
    event Withdraw(address to, uint256 amount);
    event RewardChanged(uint256 newReward);

    IMyToken public stakingToken;

    mapping(address => uint256) public lastClaimedBlock;
    uint256 defaultRewardPerBlock = 1 * 10**10;
    uint256 public rewardPerBlock;

    mapping(address => uint256) public staked;
    uint256 public totalStaked;

    /// @param _stakingToken  스테이킹 토큰 주소
    /// @param _mgrs          매니저 배열 (교수님 요구: 최소 3명)
    constructor(IMyToken _stakingToken, address[] memory _mgrs)
        ManageAccess(
            msg.sender,            // owner
            msg.sender,            // 기존 single manager
            _mgrs                  // multi-manager 리스트
        )
    {
        stakingToken   = _stakingToken;
        rewardPerBlock = defaultRewardPerBlock;
    }

    modifier updateReward(address to) {
        if (staked[to] > 0 && totalStaked > 0) {
            uint256 blocks = block.number - lastClaimedBlock[to];
            uint256 reward = (blocks * rewardPerBlock * staked[to]) / totalStaked;
            stakingToken.mint(reward, to);
        }
        lastClaimedBlock[to] = block.number;
        _;
    }

    function stake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, "cannot stake 0 amount");
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        staked[msg.sender]   += _amount;
        totalStaked          += _amount;
        emit Staked(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external updateReward(msg.sender) {
        require(staked[msg.sender] >= _amount, "insufficient staked token");
        stakingToken.transfer(_amount, msg.sender);
        staked[msg.sender]   -= _amount;
        totalStaked          -= _amount;
        emit Withdraw(msg.sender, _amount);
    }

    /// 모든 매니저가 confirmChange() 호출 후에만 실행
    function setRewardPerBlock(uint256 _amount)
        external
        onlyManager
        onlyAllConfirmed
    {
        rewardPerBlock = _amount;
        _resetConfirms();
        emit RewardChanged(_amount);
    }
}
