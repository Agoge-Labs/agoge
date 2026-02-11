// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AgentRegistry.sol";
import "./ReputationManager.sol";

/**
 * @title  IntentRouter
 * @notice ERC-7683 compliant cross-chain intent submission and settlement.
 *         Users submit intents to purchase RWA tokens; registered AI agents
 *         compete to fulfill them. The best proposal is selected, the agent
 *         executes the trade, and reputation is updated accordingly.
 *
 * @dev    Designed for deployment on Base Sepolia via Remix IDE.
 *         Uses EIP-1153 transient storage for gas-optimized reentrancy guard.
 */
contract IntentRouter {
    // ================================================================
    //                           TYPES
    // ================================================================

    enum IntentStatus {
        Pending,       // 0 - Submitted, waiting for agent proposals
        Active,        // 1 - Agents are competing
        Assigned,      // 2 - An agent has been assigned
        Fulfilled,     // 3 - Successfully executed
        Cancelled,     // 4 - User cancelled
        Expired,       // 5 - Deadline passed
        Failed         // 6 - Agent failed to fulfill
    }

    struct CrossChainIntent {
        bytes32  intentId;
        address  user;
        address  inputToken;
        uint256  inputAmount;
        uint32   destinationChainId;
        address  outputToken;          // target RWA token
        uint256  minOutputAmount;
        uint256  deadline;
        IntentStatus status;
        address  assignedAgent;
        uint256  createdAt;
    }

    struct Proposal {
        bytes32 intentId;
        address agent;
        uint256 expectedOutput;
        uint256 estimatedTime;        // seconds
        uint256 confidence;           // 0 to 100
        string  route;                // description of execution path
        uint256 submittedAt;
    }

    // ================================================================
    //                           STATE
    // ================================================================

    address public owner;
    AgentRegistry public agentRegistry;
    ReputationManager public reputationManager;

    uint256 public intentCount;
    uint256 public proposalCount;

    // Intent storage
    mapping(bytes32 => CrossChainIntent) public intents;
    bytes32[] public intentIds;

    // Proposals per intent
    mapping(bytes32 => Proposal[]) public proposals;

    // User intent history
    mapping(address => bytes32[]) public userIntents;

    // IERC20 minimal interface used inline
    // (avoids external import for Remix simplicity)

    // ================================================================
    //                           EVENTS
    // ================================================================

    event IntentSubmitted(
        bytes32 indexed intentId,
        address indexed user,
        address inputToken,
        uint256 inputAmount,
        uint32  destinationChainId,
        address outputToken,
        uint256 minOutputAmount,
        uint256 deadline
    );

    event ProposalSubmitted(
        bytes32 indexed intentId,
        address indexed agent,
        uint256 expectedOutput,
        uint256 estimatedTime,
        uint256 confidence
    );

    event AgentAssigned(
        bytes32 indexed intentId,
        address indexed agent
    );

    event IntentFulfilled(
        bytes32 indexed intentId,
        address indexed agent,
        uint256 actualOutput,
        uint256 executionTime
    );

    event IntentCancelled(bytes32 indexed intentId);
    event IntentExpired(bytes32 indexed intentId);
    event IntentFailed(bytes32 indexed intentId, address indexed agent);

    // ================================================================
    //                         MODIFIERS
    // ================================================================

    // EIP-1153 transient storage reentrancy guard
    uint256 private constant _REENTRANCY_SLOT = 0;

    modifier nonReentrant() {
        assembly {
            if tload(_REENTRANCY_SLOT) { revert(0, 0) }
            tstore(_REENTRANCY_SLOT, 1)
        }
        _;
        assembly {
            tstore(_REENTRANCY_SLOT, 0)
        }
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "IntentRouter: not owner");
        _;
    }

    // ================================================================
    //                        CONSTRUCTOR
    // ================================================================

    constructor(address _agentRegistry, address _reputationManager) {
        owner = msg.sender;
        agentRegistry = AgentRegistry(_agentRegistry);
        reputationManager = ReputationManager(_reputationManager);
    }

    // ================================================================
    //                  INTENT LIFECYCLE (USER)
    // ================================================================

    /**
     * @notice Submit a cross-chain RWA purchase intent.
     *         The user's input tokens are escrowed in this contract
     *         until the intent is fulfilled or cancelled.
     *
     * @param _inputToken         ERC-20 token to spend (e.g. USDC)
     * @param _inputAmount        Amount of input token (in token decimals)
     * @param _destinationChainId Target chain for the output token
     * @param _outputToken        Address of desired RWA token
     * @param _minOutputAmount    Minimum acceptable output
     * @param _deadline           Unix timestamp deadline
     */
    function submitIntent(
        address _inputToken,
        uint256 _inputAmount,
        uint32  _destinationChainId,
        address _outputToken,
        uint256 _minOutputAmount,
        uint256 _deadline
    ) external nonReentrant returns (bytes32) {
        require(_deadline > block.timestamp, "IntentRouter: expired deadline");
        require(_inputAmount > 0, "IntentRouter: zero amount");

        // Transfer input tokens to escrow
        (bool success, bytes memory data) = _inputToken.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender,
                address(this),
                _inputAmount
            )
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "IntentRouter: transfer failed"
        );

        // Generate unique intent ID
        bytes32 intentId = keccak256(
            abi.encodePacked(
                msg.sender,
                _inputToken,
                _inputAmount,
                _destinationChainId,
                block.timestamp,
                intentCount
            )
        );

        intents[intentId] = CrossChainIntent({
            intentId: intentId,
            user: msg.sender,
            inputToken: _inputToken,
            inputAmount: _inputAmount,
            destinationChainId: _destinationChainId,
            outputToken: _outputToken,
            minOutputAmount: _minOutputAmount,
            deadline: _deadline,
            status: IntentStatus.Pending,
            assignedAgent: address(0),
            createdAt: block.timestamp
        });

        intentIds.push(intentId);
        userIntents[msg.sender].push(intentId);
        intentCount++;

        emit IntentSubmitted(
            intentId,
            msg.sender,
            _inputToken,
            _inputAmount,
            _destinationChainId,
            _outputToken,
            _minOutputAmount,
            _deadline
        );

        return intentId;
    }

    /**
     * @notice Cancel a pending intent and refund escrowed tokens.
     *         Only the intent creator can cancel, and only before assignment.
     */
    function cancelIntent(bytes32 _intentId) external nonReentrant {
        CrossChainIntent storage intent = intents[_intentId];
        require(intent.user == msg.sender, "IntentRouter: not intent owner");
        require(
            intent.status == IntentStatus.Pending ||
            intent.status == IntentStatus.Active,
            "IntentRouter: cannot cancel"
        );

        intent.status = IntentStatus.Cancelled;

        // Refund escrowed tokens
        (bool success, ) = intent.inputToken.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                msg.sender,
                intent.inputAmount
            )
        );
        require(success, "IntentRouter: refund failed");

        emit IntentCancelled(_intentId);
    }

    // ================================================================
    //                  PROPOSAL LIFECYCLE (AGENT)
    // ================================================================

    /**
     * @notice Submit a fulfillment proposal for a pending intent.
     *         Only registered, active agents may submit proposals.
     */
    function submitProposal(
        bytes32 _intentId,
        uint256 _expectedOutput,
        uint256 _estimatedTime,
        uint256 _confidence,
        string calldata _route
    ) external {
        CrossChainIntent storage intent = intents[_intentId];
        require(
            intent.status == IntentStatus.Pending ||
            intent.status == IntentStatus.Active,
            "IntentRouter: not accepting proposals"
        );
        require(intent.deadline > block.timestamp, "IntentRouter: expired");
        require(
            agentRegistry.isActiveAgent(msg.sender),
            "IntentRouter: agent not active"
        );
        require(_confidence <= 100, "IntentRouter: invalid confidence");

        // Mark intent as active once first proposal arrives
        if (intent.status == IntentStatus.Pending) {
            intent.status = IntentStatus.Active;
        }

        proposals[_intentId].push(Proposal({
            intentId: _intentId,
            agent: msg.sender,
            expectedOutput: _expectedOutput,
            estimatedTime: _estimatedTime,
            confidence: _confidence,
            route: _route,
            submittedAt: block.timestamp
        }));

        proposalCount++;

        emit ProposalSubmitted(
            _intentId,
            msg.sender,
            _expectedOutput,
            _estimatedTime,
            _confidence
        );
    }

    // ================================================================
    //                  SELECTION & FULFILLMENT
    // ================================================================

    /**
     * @notice User selects a winning proposal and assigns the agent.
     * @param _intentId      The intent to assign
     * @param _proposalIndex Index of chosen proposal in the proposals array
     */
    function selectProposal(
        bytes32 _intentId,
        uint256 _proposalIndex
    ) external {
        CrossChainIntent storage intent = intents[_intentId];
        require(intent.user == msg.sender, "IntentRouter: not intent owner");
        require(intent.status == IntentStatus.Active, "IntentRouter: not active");

        Proposal[] storage props = proposals[_intentId];
        require(_proposalIndex < props.length, "IntentRouter: invalid proposal");

        intent.assignedAgent = props[_proposalIndex].agent;
        intent.status = IntentStatus.Assigned;

        emit AgentAssigned(_intentId, intent.assignedAgent);
    }

    /**
     * @notice The assigned agent reports successful fulfillment.
     *         In production, this would verify cross-chain proofs.
     *         For the hackathon demo, the agent self-reports.
     *
     * @param _intentId     The fulfilled intent
     * @param _actualOutput Actual tokens delivered
     */
    function reportFulfillment(
        bytes32 _intentId,
        uint256 _actualOutput
    ) external nonReentrant {
        CrossChainIntent storage intent = intents[_intentId];
        require(
            intent.assignedAgent == msg.sender,
            "IntentRouter: not assigned agent"
        );
        require(
            intent.status == IntentStatus.Assigned,
            "IntentRouter: not assigned"
        );

        uint256 executionTime = block.timestamp - intent.createdAt;

        intent.status = IntentStatus.Fulfilled;

        // Update agent reputation (success)
        reputationManager.updateReputation(msg.sender, true, executionTime);

        // Transfer escrowed input tokens to the agent (payment)
        (bool success, ) = intent.inputToken.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                msg.sender,
                intent.inputAmount
            )
        );
        require(success, "IntentRouter: payment failed");

        emit IntentFulfilled(_intentId, msg.sender, _actualOutput, executionTime);
    }

    /**
     * @notice Report a failed fulfillment. Refunds user, slashes agent.
     */
    function reportFailure(bytes32 _intentId) external nonReentrant {
        CrossChainIntent storage intent = intents[_intentId];
        require(
            intent.assignedAgent == msg.sender || msg.sender == owner,
            "IntentRouter: unauthorized"
        );
        require(
            intent.status == IntentStatus.Assigned,
            "IntentRouter: not assigned"
        );

        intent.status = IntentStatus.Failed;

        // Slash agent reputation
        reputationManager.updateReputation(intent.assignedAgent, false, 0);

        // Refund user
        (bool success, ) = intent.inputToken.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                intent.user,
                intent.inputAmount
            )
        );
        require(success, "IntentRouter: refund failed");

        emit IntentFailed(_intentId, intent.assignedAgent);
    }

    // ================================================================
    //                      VIEW HELPERS
    // ================================================================

    function getIntent(bytes32 _intentId)
        external view returns (CrossChainIntent memory)
    {
        return intents[_intentId];
    }

    function getProposals(bytes32 _intentId)
        external view returns (Proposal[] memory)
    {
        return proposals[_intentId];
    }

    function getUserIntents(address _user)
        external view returns (bytes32[] memory)
    {
        return userIntents[_user];
    }

    function getIntentCount() external view returns (uint256) {
        return intentIds.length;
    }

    /**
     * @notice Get all pending/active intents (for agent monitoring).
     *         Returns up to `limit` intent IDs starting from `offset`.
     */
    function getPendingIntents(uint256 offset, uint256 limit)
        external view returns (bytes32[] memory result)
    {
        uint256 total = intentIds.length;
        if (offset >= total) return new bytes32[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;

        uint256 count = 0;
        bytes32[] memory temp = new bytes32[](end - offset);

        for (uint256 i = offset; i < end; i++) {
            IntentStatus s = intents[intentIds[i]].status;
            if (s == IntentStatus.Pending || s == IntentStatus.Active) {
                temp[count] = intentIds[i];
                count++;
            }
        }

        result = new bytes32[](count);
        for (uint256 j = 0; j < count; j++) {
            result[j] = temp[j];
        }
    }
}
