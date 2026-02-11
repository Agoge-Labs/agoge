// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReputationManager
 * @notice Tracks agent fulfillment history, computes reputation scores,
 *         and applies slashing penalties for failed fulfillments.
 * @dev    Only the designated IntentRouter contract may update stats.
 */
contract ReputationManager {
    // ----------------------------------------------------------------
    // Types
    // ----------------------------------------------------------------
    struct AgentStats {
        uint256 totalIntents;
        uint256 successfulFulfillments;
        uint256 totalExecutionTime;     // cumulative seconds
        uint256 stake;                  // current agent stake (wei)
        bool    isActive;
    }

    // ----------------------------------------------------------------
    // State
    // ----------------------------------------------------------------
    address public owner;
    address public intentRouter;        // only router may call updateReputation

    mapping(address => AgentStats) public agentStats;

    // ----------------------------------------------------------------
    // Events
    // ----------------------------------------------------------------
    event ReputationUpdated(
        address indexed agent,
        bool    success,
        uint256 executionTime,
        uint256 newScore
    );
    event StakeSlashed(address indexed agent, uint256 penalty, uint256 remaining);
    event IntentRouterSet(address indexed router);

    // ----------------------------------------------------------------
    // Modifiers
    // ----------------------------------------------------------------
    modifier onlyOwner() {
        require(msg.sender == owner, "ReputationManager: not owner");
        _;
    }

    modifier onlyRouter() {
        require(msg.sender == intentRouter, "ReputationManager: not router");
        _;
    }

    // ----------------------------------------------------------------
    // Constructor
    // ----------------------------------------------------------------
    constructor() {
        owner = msg.sender;
    }

    // ----------------------------------------------------------------
    // Admin
    // ----------------------------------------------------------------
    function setIntentRouter(address _router) external onlyOwner {
        require(_router != address(0), "ReputationManager: zero address");
        intentRouter = _router;
        emit IntentRouterSet(_router);
    }

    // ----------------------------------------------------------------
    // Core Logic
    // ----------------------------------------------------------------

    /**
     * @notice Initialize or increase an agent's stake. Called by
     *         AgentRegistry when an agent registers or tops up.
     */
    function initializeAgent(address agent, uint256 stakeAmount) external {
        AgentStats storage stats = agentStats[agent];
        stats.stake += stakeAmount;
        stats.isActive = true;
    }

    /**
     * @notice Record the outcome of an intent fulfillment attempt.
     * @param agent          The agent that attempted fulfillment
     * @param success        Whether the fulfillment succeeded
     * @param executionTime  Seconds taken to execute
     */
    function updateReputation(
        address agent,
        bool success,
        uint256 executionTime
    ) external onlyRouter {
        AgentStats storage stats = agentStats[agent];
        require(stats.isActive, "ReputationManager: agent not active");

        stats.totalIntents++;

        if (success) {
            stats.successfulFulfillments++;
            stats.totalExecutionTime += executionTime;
        } else {
            // Slash 1% of stake per failure
            uint256 penalty = stats.stake / 100;
            if (penalty > 0) {
                stats.stake -= penalty;
                emit StakeSlashed(agent, penalty, stats.stake);
            }
        }

        emit ReputationUpdated(
            agent,
            success,
            executionTime,
            getReputationScore(agent)
        );
    }

    // ----------------------------------------------------------------
    // View Helpers
    // ----------------------------------------------------------------

    /**
     * @notice Composite reputation score (0 to 110).
     *         fulfillmentRate (0..100) + speedBonus (0..10)
     */
    function getReputationScore(address agent) public view returns (uint256) {
        AgentStats memory s = agentStats[agent];
        if (s.totalIntents == 0) return 0;

        uint256 fulfillmentRate = (s.successfulFulfillments * 100) / s.totalIntents;

        // Speed bonus: average execution under 60s earns up to 10 points
        uint256 speedBonus = 0;
        if (s.successfulFulfillments > 0) {
            uint256 avgTime = s.totalExecutionTime / s.successfulFulfillments;
            if (avgTime < 30) {
                speedBonus = 10;
            } else if (avgTime < 60) {
                speedBonus = 5;
            }
        }

        return fulfillmentRate + speedBonus;
    }

    /**
     * @notice Average execution time in seconds (only successful fulfillments).
     */
    function getAvgExecutionTime(address agent) external view returns (uint256) {
        AgentStats memory s = agentStats[agent];
        if (s.successfulFulfillments == 0) return 0;
        return s.totalExecutionTime / s.successfulFulfillments;
    }

    /**
     * @notice Fulfillment rate as a percentage (0 to 100).
     */
    function getFulfillmentRate(address agent) external view returns (uint256) {
        AgentStats memory s = agentStats[agent];
        if (s.totalIntents == 0) return 0;
        return (s.successfulFulfillments * 100) / s.totalIntents;
    }
}
