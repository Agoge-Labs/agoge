// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockUSDC
 * @notice A mock ERC-20 token for testing on Base Sepolia.
 *         Anyone can mint tokens for demo purposes.
 */
contract MockUSDC {
    string public name = "Mock USDC";
    string public symbol = "mUSDC";
    uint8 public decimals = 6;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @notice Mint tokens to any address. Open for demo/testnet use.
     * @param to Recipient address
     * @param amount Amount to mint (6 decimals, e.g. 1000e6 = 1000 USDC)
     */
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "MockUSDC: allowance exceeded");
        allowance[from][msg.sender] = currentAllowance - amount;
        return _transfer(from, to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        require(from != address(0), "MockUSDC: transfer from zero");
        require(to != address(0), "MockUSDC: transfer to zero");
        require(balanceOf[from] >= amount, "MockUSDC: insufficient balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
