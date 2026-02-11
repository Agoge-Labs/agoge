// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PriceOracle
 * @notice Agent-submitted price feeds with weighted averaging and
 *         outlier detection. Agents report prices for RWA tokens;
 *         the oracle aggregates them into a reliable feed.
 */
contract PriceOracle {
    // ----------------------------------------------------------------
    // Types
    // ----------------------------------------------------------------
    struct PriceSubmission {
        address agent;
        uint256 price;      // price in USD with 8 decimals (like Chainlink)
        uint256 timestamp;
    }

    struct TokenFeed {
        uint256 latestPrice;
        uint256 lastUpdated;
        uint256 submissionCount;
    }

    // ----------------------------------------------------------------
    // State
    // ----------------------------------------------------------------
    address public owner;

    // tokenId (bytes32 hash of symbol) => latest aggregated feed
    mapping(bytes32 => TokenFeed) public feeds;

    // tokenId => array of recent submissions (rolling window)
    mapping(bytes32 => PriceSubmission[]) public submissions;

    // Maximum allowed deviation from median (20%)
    uint256 public maxDeviationBps = 2000;

    // Submission window (only submissions within this period count)
    uint256 public submissionWindow = 5 minutes;

    // ----------------------------------------------------------------
    // Events
    // ----------------------------------------------------------------
    event PriceSubmitted(
        bytes32 indexed tokenId,
        address indexed agent,
        uint256 price,
        uint256 timestamp
    );
    event PriceAggregated(
        bytes32 indexed tokenId,
        uint256 aggregatedPrice,
        uint256 submissionCount
    );
    event OutlierRejected(
        bytes32 indexed tokenId,
        address indexed agent,
        uint256 price,
        uint256 medianPrice
    );

    // ----------------------------------------------------------------
    // Constructor
    // ----------------------------------------------------------------
    constructor() {
        owner = msg.sender;
    }

    // ----------------------------------------------------------------
    // Core Logic
    // ----------------------------------------------------------------

    /**
     * @notice Submit a price for a token. Open to any agent.
     * @param _symbol  Token symbol string (e.g. "USDY")
     * @param _price   Price in USD with 8 decimals (e.g. 1_05000000 = $1.05)
     */
    function submitPrice(string calldata _symbol, uint256 _price) external {
        require(_price > 0, "PriceOracle: zero price");

        bytes32 tokenId = keccak256(abi.encodePacked(_symbol));

        // Store submission
        submissions[tokenId].push(PriceSubmission({
            agent: msg.sender,
            price: _price,
            timestamp: block.timestamp
        }));

        emit PriceSubmitted(tokenId, msg.sender, _price, block.timestamp);

        // Aggregate after each submission
        _aggregate(tokenId);
    }

    /**
     * @notice Aggregate recent submissions into a single price.
     *         Filters for submissions within the time window,
     *         rejects outliers, and computes an average.
     */
    function _aggregate(bytes32 tokenId) internal {
        PriceSubmission[] storage subs = submissions[tokenId];

        // Collect valid (within time window) submissions
        uint256 validCount = 0;
        uint256 sum = 0;
        uint256[] memory validPrices = new uint256[](subs.length);

        for (uint256 i = 0; i < subs.length; i++) {
            if (block.timestamp - subs[i].timestamp <= submissionWindow) {
                validPrices[validCount] = subs[i].price;
                sum += subs[i].price;
                validCount++;
            }
        }

        if (validCount == 0) return;

        // Simple average (no outlier rejection for small sets)
        uint256 avg = sum / validCount;

        // For 3+ submissions, reject outliers and re-average
        if (validCount >= 3) {
            uint256 filteredSum = 0;
            uint256 filteredCount = 0;

            for (uint256 i = 0; i < validCount; i++) {
                uint256 deviation;
                if (validPrices[i] > avg) {
                    deviation = ((validPrices[i] - avg) * 10000) / avg;
                } else {
                    deviation = ((avg - validPrices[i]) * 10000) / avg;
                }

                if (deviation <= maxDeviationBps) {
                    filteredSum += validPrices[i];
                    filteredCount++;
                }
            }

            if (filteredCount > 0) {
                avg = filteredSum / filteredCount;
                validCount = filteredCount;
            }
        }

        feeds[tokenId] = TokenFeed({
            latestPrice: avg,
            lastUpdated: block.timestamp,
            submissionCount: validCount
        });

        emit PriceAggregated(tokenId, avg, validCount);
    }

    // ----------------------------------------------------------------
    // View Helpers
    // ----------------------------------------------------------------

    /**
     * @notice Get the latest aggregated price for a token.
     * @param _symbol Token symbol string
     * @return price     USD price with 8 decimals
     * @return updatedAt Timestamp of last aggregation
     */
    function getPrice(string calldata _symbol)
        external
        view
        returns (uint256 price, uint256 updatedAt)
    {
        bytes32 tokenId = keccak256(abi.encodePacked(_symbol));
        TokenFeed memory feed = feeds[tokenId];
        return (feed.latestPrice, feed.lastUpdated);
    }

    /**
     * @notice Get the number of recent submissions for a token.
     */
    function getSubmissionCount(string calldata _symbol)
        external
        view
        returns (uint256)
    {
        bytes32 tokenId = keccak256(abi.encodePacked(_symbol));
        return feeds[tokenId].submissionCount;
    }

    // ----------------------------------------------------------------
    // Admin
    // ----------------------------------------------------------------

    function setMaxDeviation(uint256 _bps) external {
        require(msg.sender == owner, "PriceOracle: not owner");
        maxDeviationBps = _bps;
    }

    function setSubmissionWindow(uint256 _seconds) external {
        require(msg.sender == owner, "PriceOracle: not owner");
        submissionWindow = _seconds;
    }
}
