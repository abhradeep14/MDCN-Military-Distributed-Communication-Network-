// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MDCNCoordination {
    struct IntelMessage {
        uint256 id;
        address sender;
        address recipient; // The intended receiver
        string intelData;
        uint256 timestamp;
        bool acknowledged;
        address acknowledgedBy;
        uint256 acknowledgedTimestamp;
    }
    uint256 public intelCount;
    mapping(uint256 => IntelMessage) public intelStore;

    event IntelligenceSynced(
        uint256 indexed id,
        address indexed sender,
        address indexed recipient,
        string data,
        uint256 timestamp
    );

    event IntelligenceAcknowledged(
        uint256 indexed id,
        address indexed acknowledgedBy,
        uint256 timestamp
    );

    /**
     * @notice Legacy function to sync intelligence via group and branch
     * @dev This function is provided for backward compatibility.
     * @param _recipientGroup The recipient group identifier.
     * @param _branch The branch identifier.
     * @param _data The intelligence data.
     */
    function syncIntelligenceLegacy(
        uint8 _recipientGroup,
        uint8 _branch,
        string memory _data
    ) public {
        intelCount++;
        // In legacy mode, we do not know the exact recipient – so we use a dummy address.
        address dummyRecipient = address(
            0x1234567890123456789012345678901234567890
        );
        intelStore[intelCount] = IntelMessage({
            id: intelCount,
            sender: msg.sender,
            recipient: dummyRecipient,
            intelData: _data,
            timestamp: block.timestamp,
            acknowledged: false,
            acknowledgedBy: address(0),
            acknowledgedTimestamp: 0
        });
        emit IntelligenceSynced(
            intelCount,
            msg.sender,
            dummyRecipient,
            _data,
            block.timestamp
        );
    }

    /**
     * @notice New function to sync intelligence using a specified recipient address.
     * @param _recipient The address of the intended recipient.
     * @param _data The intelligence data.
     */
    function syncIntelligence(address _recipient, string memory _data) public {
        intelCount++;
        intelStore[intelCount] = IntelMessage({
            id: intelCount,
            sender: msg.sender,
            recipient: _recipient,
            intelData: _data,
            timestamp: block.timestamp,
            acknowledged: false,
            acknowledgedBy: address(0),
            acknowledgedTimestamp: 0
        });
        emit IntelligenceSynced(
            intelCount,
            msg.sender,
            _recipient,
            _data,
            block.timestamp
        );
    }

    /**
     * @notice Acknowledge receipt of an intelligence message.
     * @param _intelId The identifier of the intelligence message.
     */
    function acknowledgeIntelligence(uint256 _intelId) public {
        IntelMessage storage intel = intelStore[_intelId];
        require(intel.id != 0, "Intel not found");
        require(!intel.acknowledged, "Already acknowledged");
        // For legacy entries, relax the requirement if we use the dummy address.
        if (
            intel.recipient !=
            address(0x1234567890123456789012345678901234567890)
        ) {
            require(msg.sender == intel.recipient, "Not the recipient");
        }
        intel.acknowledged = true;
        intel.acknowledgedBy = msg.sender;
        intel.acknowledgedTimestamp = block.timestamp;
        emit IntelligenceAcknowledged(_intelId, msg.sender, block.timestamp);
    }
}
