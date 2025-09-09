// SPDX-License-Identifier: Ecosystem
pragma solidity 0.8.27;

import "./types/Types.sol";
import "./EncryptedERC.sol";

contract TimeLockNest {

    error OwnerEmpty();
    error RequiredZero();
    error UnlockTimeInThePast();
    error NestAlreadyWithdrawn();
    error UnlockTimeNotReached();
    error NotOwnerInNest();

    // ============ State Variables ============
    address private encryptedERC;

    struct Nest {
        uint256 unlockTime;
        mapping(address => bool) isOwner;
        address[] owners;
        uint256 required;
        uint256 confirmations;
        bool withdrawn;
    }

    mapping(uint256 => Nest) private nests;
    mapping(address => uint256) private userNest;
    uint256 private nestCounter;

    // ============ Events ============
    event UserInNest(address indexed user, uint256 indexed NestId);
    event NestCreated(
        uint256 indexed NestId,
        uint256 indexed unlockTime,
        uint256 indexed required
    );
    event NestWithdrawn(uint256 indexed NestId);

    // ============ Constructor ============
    constructor(address _encryptedERC) {
        encryptedERC = _encryptedERC;
    }

    /**
     * @notice Validates if a user has encrypted token balance
     * @param user Address of the user to check
     * @param tokenId ID of the token to check balance for
     * @return hasBalance True if user has encrypted balance, false otherwise
     * @dev This function checks if the user has any encrypted balance by examining
     *      the EGCT (ElGamal ciphertext) components. If all components are zero,
     *      the user has no encrypted balance.
     */
    function hasEncryptedBalance(
        address user,
        uint256 tokenId
    ) external view returns (bool hasBalance) {
        // Call the EncryptedERC contract to get the user's encrypted balance
        (EGCT memory eGCT, , , , ) = EncryptedERC(encryptedERC).balanceOf(
            user,
            tokenId
        );

        // Check if the EGCT is empty (all components are zero)
        // If any component is non-zero, the user has some encrypted balance
        hasBalance = (eGCT.c1.x != 0 ||
            eGCT.c1.y != 0 ||
            eGCT.c2.x != 0 ||
            eGCT.c2.y != 0);
    }

    /**
     * @notice Validates if a user has encrypted token balance for a specific token address
     * @param user Address of the user to check
     * @param tokenAddress Address of the token to check balance for
     * @return hasBalance True if user has encrypted balance, false otherwise
     * @dev This is a convenience function that uses the token address instead of tokenId
     */
    function hasEncryptedBalanceByAddress(
        address user,
        address tokenAddress
    ) external view returns (bool hasBalance) {
        // Call the EncryptedERC contract to get the user's encrypted balance using token address
        (EGCT memory eGCT, , , , ) = EncryptedERC(encryptedERC)
            .getBalanceFromTokenAddress(user, tokenAddress);

        // Check if the EGCT is empty (all components are zero)
        hasBalance = (eGCT.c1.x != 0 ||
            eGCT.c1.y != 0 ||
            eGCT.c2.x != 0 ||
            eGCT.c2.y != 0);
    }

    // ============ Functions (to implement) ============

    function createNest(
        address[] memory _owners,
        uint256 _unlockTime,
        uint256 _required
    ) external returns (uint256) {
        
        if(_owners.length == 0) revert OwnerEmpty();
        if(_required == 0) revert RequiredZero();
        if(_unlockTime < block.timestamp) revert UnlockTimeInThePast();

        nestCounter++;

        Nest storage n = nests[nestCounter];
        n.unlockTime = _unlockTime;
        n.required = _required;
        n.confirmations = 0;
        n.withdrawn = false;

        for(uint16 i = 0; i < _owners.length; i++) {
            n.isOwner[_owners[i]] = true;
            userNest[_owners[i]] = nestCounter;
            emit UserInNest(_owners[i], nestCounter);
        }

        emit NestCreated(nestCounter, _unlockTime, _required);
        return nestCounter;

    }


    function withdraw(uint256 _NestId) external {

        Nest storage n = nests[_NestId];
        
        if(!n.isOwner[msg.sender]) revert NotOwnerInNest();
        if(n.withdrawn) revert NestAlreadyWithdrawn();
        if(block.timestamp < n.unlockTime) revert UnlockTimeNotReached();

        n.confirmations++;

        if(n.confirmations >= n.required){
            nests[_NestId].withdrawn = true;
            emit NestWithdrawn(_NestId);
        }

    }

    function getInfoNest(
        uint256 _NestId
    ) external view returns (
        uint256 unlockTime,
        uint256 required,
        uint256 confirmations,
        address[] memory owners,
        bool withdrawn
    ) {
        Nest storage n = nests[_NestId];
        unlockTime = n.unlockTime;
        required = n.required;
        confirmations = n.confirmations;
        owners = n.owners;
        withdrawn = n.withdrawn;
    }

    function getUserNest(
        address user
    ) external view returns (uint256) {
        return userNest[user];
    }


}