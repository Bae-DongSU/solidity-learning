// contracts/ManageAccess.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ManageAccess {
    address public owner;
    address public manager;

    // 새로 추가된 멀티-매니저용 변수
    address[] public managers;
    mapping(address => bool) public isManager;
    mapping(address => bool) public confirmed;

    event ManagerConfirmed(address indexed who);
    event ManagersReset();

    /// @param _owner    컨트랙트 오너
    /// @param _manager  (기존) 단일 매니저
    /// @param _mgrs     (신규) 멀티 매니저 목록 (최소 1명 이상)
    constructor(
        address _owner,
        address _manager,
        address[] memory _mgrs
    ) {
        owner   = _owner;
        manager = _manager;

        require(_mgrs.length >= 1, "Need at least one manager");
        for (uint i = 0; i < _mgrs.length; i++) {
            address m = _mgrs[i];
            require(m != address(0), "zero address");
            require(!isManager[m], "dup manager");
            isManager[m] = true;
            managers.push(m);
        }
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not authorized");
        _;
    }

    modifier onlyManager() {
        require(isManager[msg.sender], "You are not a manager");
        _;
    }

    /// 모든 매니저가 confirmChange() 호출해야 다음 단계 실행 가능
    modifier onlyAllConfirmed() {
        for (uint i = 0; i < managers.length; i++) {
            require(confirmed[managers[i]], "Not all confirmed yet");
        }
        _;
    }

    /// 매니저 본인의 승인 표시
    function confirmChange() external onlyManager {
        confirmed[msg.sender] = true;
        emit ManagerConfirmed(msg.sender);
    }

    /// 승인 플래그 초기화
    function _resetConfirms() internal {
        for (uint i = 0; i < managers.length; i++) {
            confirmed[managers[i]] = false;
        }
        emit ManagersReset();
    }
}
