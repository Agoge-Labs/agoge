// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ReputationManager.sol";

/**
 * @title AgentRegistry
 * @notice Manages AI agent registration, staking, and activation.
 *         Agents must stake ETH to participate in intent fulfillment.
 */
contract AgentRegistry {
    // ----------------------------------------------------------------
    // Types
    // ----------------------------------------------------------------
    struct Agent {
        string  name;
        string  specialization;   // e.g. "treasuries", "real-estate", "commodities"
        address agentAddress;
        uint256 stake;
        bool    isActive;
        uint256 registeredAt;
    }

    // ----------------------------------------------------------------
    // State
    // ----------------------------------------------------------------
    address public owner;
    ReputationManager public reputationManager;

    uint256 public minStake = 0.001 ether;  // Low for testnet
    uint256 public agentCount;

    mapping(address => Agent) public agents;
    address[] public agentList;

    // ----------------------------------------------------------------
    // Events
    // ----------------------------------------------------------------
    event AgentRegistered(
        address indexed agentAddress,
        string  name,
        string  specialization,
        uint256 stake
    );
    event AgentDeactivated(address indexed agentAddress);
    event AgentReactivated(address indexed agentAddress);
    event StakeAdded(address indexed agentAddress, uint256 amount, uint256 newTotal);
    event StakeWithdrawn(address indexed agentAddress, uint256 amount);

    // ----------------------------------------------------------------
    // Modifiers
    // ----------------------------------------------------------------
    modifier onlyOwner() {
        require(msg.sender == owner, "AgentRegistry: not owner");
        _;
    }

    modifier onlyRegistered() {
        require(agents[msg.sender].agentAddress != address(0), "AgentRegistry: not registered");
        _;
    }

    // ----------------------------------------------------------------
    // Constructor
    // ----------------------------------------------------------------
    constructor(address _reputationManager) {
        owner = msg.sender;
        reputationManager = ReputationManager(_reputationManager);
    }

    // ----------------------------------------------------------------
    // Registration
    // ----------------------------------------------------------------

    /**
     * @notice Register as an agent. Must send at least minStake ETH.
     * @param _name           Human-readable agent name
     * @param _specialization Comma-separated areas (e.g. "treasuries,bonds")
     */
    function registerAgent(
        string calldata _name,
        string calldata _specialization
    ) external payable {
        require(
            agents[msg.sender].agentAddress == address(0),
            "AgentRegistry: already registered"
        );
        require(msg.value >= minStake, "AgentRegistry: stake too low");

        agents[msg.sender] = Agent({
            name: _name,
            specialization: _specialization,
            agentAddress: msg.sender,
            stake: msg.value,
            isActive: true,
            registeredAt: block.timestamp
        });

        agentList.push(msg.sender);
        agentCount++;

        // Initialize reputation
        reputationManager.initializeAgent(msg.sender, msg.value);

        emit AgentRegistered(msg.sender, _name, _specialization, msg.value);
    }

    // ----------------------------------------------------------------
    // Stake Management
    // ----------------------------------------------------------------

    /**
     * @notice Add more stake to an existing registration.
     */
    function addStake() external payable onlyRegistered {
        require(msg.value > 0, "AgentRegistry: zero stake");
        agents[msg.sender].stake += msg.value;
        reputationManager.initializeAgent(msg.sender, msg.value);
        emit StakeAdded(msg.sender, msg.value, agents[msg.sender].stake);
    }

    /**
     * @notice Withdraw stake. Deactivates the agent if stake drops below min.
     * @param amount Wei to withdraw
     */
    function withdrawStake(uint256 amount) external onlyRegistered {
        Agent storage agent = agents[msg.sender];
        require(agent.stake >= amount, "AgentRegistry: insufficient stake");

        agent.stake -= amount;
        if (agent.stake < minStake) {
            agent.isActive = false;
            emit AgentDeactivated(msg.sender);
        }

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "AgentRegistry: ETH transfer failed");

        emit StakeWithdrawn(msg.sender, amount);
    }

    // ----------------------------------------------------------------
    // Activation
    // ----------------------------------------------------------------

    function deactivateAgent() external onlyRegistered {
        agents[msg.sender].isActive = false;
        emit AgentDeactivated(msg.sender);
    }

    function reactivateAgent() external onlyRegistered {
        require(
            agents[msg.sender].stake >= minStake,
            "AgentRegistry: stake below minimum"
        );
        agents[msg.sender].isActive = true;
        emit AgentReactivated(msg.sender);
    }

    // ----------------------------------------------------------------
    // View Helpers
    // ----------------------------------------------------------------

    function isActiveAgent(address _agent) external view returns (bool) {
        return agents[_agent].isActive;
    }

    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }

    function getAgentAtIndex(uint256 index) external view returns (address) {
        require(index < agentList.length, "AgentRegistry: index out of bounds");
        return agentList[index];
    }

    /**
     * @notice Return all registered agent addresses (use with care on large sets).
     */
    function getAllAgents() external view returns (address[] memory) {
        return agentList;
    }

    // ----------------------------------------------------------------
    // Admin
    // ----------------------------------------------------------------

    function setMinStake(uint256 _minStake) external onlyOwner {
        minStake = _minStake;
    }
}
