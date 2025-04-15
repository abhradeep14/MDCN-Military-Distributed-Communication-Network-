// src/components/Navbar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ account, connectMetamask, isAdmin, userRole, logoutUser }) => {
  const navigate = useNavigate();

  // When the logo is clicked, go to home
  const handleLogoClick = () => {
    navigate("/");
  };

  const handleAdminClick = () => {
    if (isAdmin) {
      navigate("/admin/login");
    } else {
      alert("You don't have admin access.");
    }
  };

  const handleSubordinateClick = () => {
    if (userRole > 1) { // Only Operational (2) and Tactical (3) roles
      navigate("/subordinate/login");
    } else if (userRole === 1) {
      alert("As an admin, please use the Admin dashboard.");
    } else {
      alert("You don't have any assigned role in the system.");
    }
  };

  // New function to get full position title based on role
  const getPositionTitle = (role, acct) => {
    const shortID = acct ? `${acct.substring(0, 6)}...${acct.substring(acct.length - 4)}` : "";
    switch (role) {
      case 1: return `Strategic Commander (${shortID})`;
      case 2: return `Operational Officer (${shortID})`;
      case 3: return `Field Operative (${shortID})`;
      default: return `Unknown (${shortID})`;
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <div className="navbar-brand animate-logo">MDCN (Military Distributed Communication Network)
        </div>
      </div>
      <div className="navbar-right">
        {account ? (
          <>
            {/* Instead of showing the raw account, we show the position title */}
            <span className="position-info">
              {getPositionTitle(userRole, account)}
            </span>
            <button className="btn logout-btn" onClick={logoutUser}>
              Logout
            </button>
            {userRole > 1 && (
              <button className="btn field-btn" onClick={handleSubordinateClick}>
                Field Ops
              </button>
            )}
            {isAdmin && (
              <button className="btn admin-btn" onClick={handleAdminClick}>
                Admin
              </button>
            )}
          </>
        ) : (
          <button className="btn connect-btn" onClick={connectMetamask}>
            Connect MetaMask
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
