// src/components/TacticalSection.js
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const TacticalSection = ({ contracts, account, userRole, adminAddresses }) => {
  const [recipientGroup, setRecipientGroup] = useState("2"); // Default: Tactical Command
  const [branch, setBranch] = useState("1"); // Default: Army
  const [fieldData, setFieldData] = useState("");
  const [output, setOutput] = useState("");
  const [userBranch, setUserBranch] = useState("1"); // Default branch for this user
  const [contractInfo, setContractInfo] = useState({ ready: false, message: "Initializing..." });
  const [sendMode, setSendMode] = useState('group'); // 'group', 'admin', 'peer'
  const [selectedAdminIndex, setSelectedAdminIndex] = useState(0);
  const [subordinates, setSubordinates] = useState([]);
  const [selectedSubordinateIndex, setSelectedSubordinateIndex] = useState(0);

  const ROLES = {
    NONE: 0,
    STRATEGIC: 1,
    OPERATIONAL: 2,
    TACTICAL: 3,
  };

  // Tactical Contract Fragment ABI for direct method calling
  const tacticalABIFragment = [
    "function logFieldData(uint8 _recipientGroup, uint8 _branch, string memory _data) public",
    "function logFieldData(address _recipient, string memory _data) public"
  ];

  useEffect(() => {
    if (account) {
      const lastChar = account.slice(-1);
      const lastDigit = parseInt(lastChar, 16) % 3;
      setUserBranch((lastDigit + 1).toString());
      setBranch((lastDigit + 1).toString());
    }
  }, [account]);

  // Check contract connection and set contract info
  useEffect(() => {
    if (!contracts || !contracts.tacticalContract) {
      setContractInfo({ ready: false, message: "Contract not connected. Please connect your wallet." });
      return;
    }
    try {
      console.log("Tactical contract address:", contracts.tacticalContract.address);
      console.log("Methods:", Object.keys(contracts.tacticalContract.functions || {}));
      setContractInfo({ ready: true, message: "Contract connected." });
      setOutput("Connected to tactical contract at " + contracts.tacticalContract.address);
    } catch (error) {
      console.error("Error examining contract:", error);
      setContractInfo({ ready: false, message: "Error connecting to contract: " + error.message });
    }
    findSubordinates();
  }, [contracts]);

  // Find subordinates for peer messaging
  const findSubordinates = async () => {
    if (!contracts.commandContract) return;
    try {
      const filter = contracts.commandContract.filters.RoleAssigned();
      const events = await contracts.commandContract.queryFilter(filter);
      const subordinateList = [];
      for (const event of events) {
        const { account: addr, role } = event.args;
        const roleNum = Number(role);
        if (roleNum > 0 && roleNum !== 1 && addr.toLowerCase() !== account.toLowerCase()) {
          const lastChar = addr.slice(-1);
          const lastDigit = parseInt(lastChar, 16) % 3;
          const subBranch = (lastDigit + 1).toString();
          subordinateList.push({
            address: addr,
            role: roleNum,
            branch: subBranch,
            roleName: roleNum === ROLES.OPERATIONAL ? "Operational" : "Tactical",
            shortAddress: `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
          });
        }
      }
      setSubordinates(subordinateList);
    } catch (error) {
      console.error("Error finding subordinates:", error);
    }
  };

  const getBranchName = (branchId) => {
    switch (parseInt(branchId)) {
      case 1: return "Army";
      case 2: return "Navy";
      case 3: return "Air Force";
      default: return "Unknown";
    }
  };

  const getRecipientGroupName = (groupId) => {
    switch (parseInt(groupId)) {
      case 1: return "Command Center";
      case 2: return "Tactical Command";
      case 3: return "Coordination Command";
      case 4: return "Intelligence Command";
      default: return "Unknown";
    }
  };

  // Log field data using different sending modes
  const logFieldData = async () => {
    if (!fieldData) {
      alert("Please enter field data.");
      return;
    }
    if (!contractInfo.ready) {
      setOutput("Error: Contract not connected.");
      return;
    }
    try {
      setOutput("Preparing to send field data...");
      const metadataPrefix = `[Branch: ${userBranch}, Group: ${recipientGroup}] `;
      const fullMessage = metadataPrefix + fieldData;
      if (sendMode === 'admin') {
        if (!adminAddresses || selectedAdminIndex >= adminAddresses.length) {
          setOutput("Selected admin address is not available.");
          return;
        }
        const adminAddress = adminAddresses[selectedAdminIndex];
        setOutput(`Sending field data to admin ${selectedAdminIndex + 1}: ${adminAddress.substring(0, 6)}...${adminAddress.substring(adminAddress.length - 4)}...`);
        const tx = await contracts.tacticalContract.logFieldData(adminAddress, fullMessage);
        setOutput(prev => `${prev}\nTransaction sent: ${tx.hash}`);
        await tx.wait();
        setOutput(prev => `${prev}\nField data sent successfully to admin.`);
      } else if (sendMode === 'peer') {
        if (subordinates.length === 0 || selectedSubordinateIndex >= subordinates.length) {
          setOutput("Selected subordinate is not available.");
          return;
        }
        const subordinate = subordinates[selectedSubordinateIndex];
        setOutput(`Sending field data to ${subordinate.roleName} (${subordinate.shortAddress})...`);
        const tx = await contracts.tacticalContract.logFieldData(subordinate.address, fullMessage);
        setOutput(prev => `${prev}\nTransaction sent: ${tx.hash}`);
        await tx.wait();
        setOutput(prev => `${prev}\nField data sent successfully to peer.`);
      } else {
        const _recipientGroup = parseInt(recipientGroup);
        const _branch = parseInt(branch);
        console.log("Sending field data with:", { recipientGroup: _recipientGroup, branch: _branch, data: fullMessage });
        const tx = await contracts.tacticalContract.logFieldData(_recipientGroup, _branch, fullMessage);
        setOutput(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        setOutput(prev => prev + "\nField data logged successfully.");
      }
    } catch (error) {
      console.error("Error sending field data:", error);
      setOutput(`Error: ${error.message}`);
      // Optionally, implement fallback here
    }
  };

  // ---------------------------
  // Compose New Field Data Section
  // ---------------------------
  const renderComposeFieldData = () => {
    return (
      <div className="new-message-section">
        <h2>Log Field Data</h2>
        <div className="compose-row">
          <div className="form-control">
            <label>Send To:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="group"
                  checked={sendMode === 'group'}
                  onChange={() => setSendMode('group')}
                />
                Group (to recipient group)
              </label>
              {adminAddresses && adminAddresses.length > 0 && (
                <label>
                  <input
                    type="radio"
                    value="admin"
                    checked={sendMode === 'admin'}
                    onChange={() => setSendMode('admin')}
                  />
                  Admin (direct)
                </label>
              )}
              {subordinates.length > 0 && (
                <label>
                  <input
                    type="radio"
                    value="peer"
                    checked={sendMode === 'peer'}
                    onChange={() => setSendMode('peer')}
                  />
                  Peer (direct)
                </label>
              )}
            </div>
          </div>
        </div>

        {sendMode === 'admin' && adminAddresses && (
          <div className="compose-row">
            <div className="form-control">
              <label>Select Admin Commander:</label>
              <select
                value={selectedAdminIndex}
                onChange={(e) => setSelectedAdminIndex(parseInt(e.target.value))}
              >
                {adminAddresses.map((addr, index) => (
                  <option key={index} value={index}>
                    Admin {index + 1} - {addr.substring(0, 6)}...{addr.substring(addr.length - 4)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {sendMode === 'peer' && subordinates && (
          <div className="compose-row">
            <div className="form-control">
              <label>Select Field Unit:</label>
              <select
                value={selectedSubordinateIndex}
                onChange={(e) => setSelectedSubordinateIndex(parseInt(e.target.value))}
              >
                {subordinates.map((sub, index) => (
                  <option key={index} value={index}>
                    {sub.roleName} - {getBranchName(sub.branch)} - {sub.shortAddress}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {sendMode === 'group' && (
          <div className="compose-row">
            <div className="form-control">
              <label>Select Recipient Group:</label>
              <select value={recipientGroup} onChange={e => setRecipientGroup(e.target.value)}>
                <option value="1">Command Center</option>
                <option value="2">Tactical Command</option>
                <option value="3">Coordination Command</option>
                <option value="4">Intelligence Command</option>
              </select>
            </div>
            <div className="form-control">
              <label>Select Branch:</label>
              <select value={branch} onChange={e => setBranch(e.target.value)}>
                <option value="1">Army</option>
                <option value="2">Navy</option>
                <option value="3">Air Force</option>
              </select>
            </div>
          </div>
        )}

        <div className="compose-row">
          <div className="form-control">
            <label>Field Data:</label>
            <textarea
              rows={6}
              placeholder="Enter detailed field data here..."
              value={fieldData}
              onChange={e => setFieldData(e.target.value)}
            ></textarea>
          </div>
        </div>

        <div className="compose-actions">
          <button className="btn submit-btn" onClick={logFieldData}>
            Log Field Data
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="card">
      <h2>Tactical & Field Operations</h2>
      <p><strong>Your Branch:</strong> {getBranchName(userBranch)}</p>
      <p><strong>Your Role:</strong> {userRole === ROLES.STRATEGIC ? "Strategic Command" : userRole === ROLES.OPERATIONAL ? "Operational Command" : "Tactical Unit"}</p>
      
      {renderComposeFieldData()}
      
      <div className="field-data-summary">
        {sendMode === 'admin' && adminAddresses && selectedAdminIndex < adminAddresses.length ? (
          <p>This field data will be sent directly to <strong>Commander {selectedAdminIndex + 1}</strong>.</p>
        ) : sendMode === 'peer' && subordinates && selectedSubordinateIndex < subordinates.length ? (
          <p>This field data will be sent directly to <strong>{subordinates[selectedSubordinateIndex].roleName}</strong> in <strong>{getBranchName(subordinates[selectedSubordinateIndex].branch)}</strong>.</p>
        ) : (
          <p>This field data will be sent to <strong>{getRecipientGroupName(recipientGroup)}</strong> in <strong>{getBranchName(branch)}</strong> branch.</p>
        )}
      </div>
      
      <pre className="output">{output}</pre>
    </section>
  );
};

export default TacticalSection;
