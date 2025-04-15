// src/pages/SubordinateLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SubordinateLogin = ({ account, userRole }) => {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    // Simple passcode for demonstration - in a real app, this would be more secure
    const correctPasscode = "soldier123";
    
    if (userRole < 1) {
      setError("Your wallet is not authorized in the system.");
    } else if (userRole === 1) {
      // Strategic/Admin users should use the admin login
      setError("As an admin, please use the Admin login page.");
    } else if (passcode === correctPasscode) {
      navigate("/subordinate/dashboard");
    } else {
      setError("Incorrect passcode.");
    }
  };

  // Get role name based on role ID
  const getRoleName = (role) => {
    switch (role) {
      case 2: return "Operational";
      case 3: return "Tactical";
      default: return "Unknown";
    }
  };

  return (
    <div className="subordinate-login card">
      <h2>Field Operations Login</h2>
      <p>Wallet: {account}</p>
      <p>Role: {getRoleName(userRole)}</p>
      <div className="form-control">
        <label>Enter Field Operations Passcode:</label>
        <input
          type="password"
          value={passcode}
          onChange={e => setPasscode(e.target.value)}
          placeholder="Enter passcode..."
        />
      </div>
      <button className="btn" onClick={handleLogin}>Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default SubordinateLogin;