import React from "react";

export default function LoginControls({ identity, principalText, role, login, logout }) {
  return (
    <div className="auth-section">
      {!identity ? (
        <div className="login-options">
          <p>Login to Daouniversity as:</p>
          <button onClick={() => login('Admin')} className="login-button admin">
            Login as Admin
          </button>
          <button onClick={() => login('Professor')} className="login-button professor">
            Login as Professor
          </button>
          <button onClick={() => login('Student')} className="login-button student">
            Login as Student
          </button>
        </div>
      ) : (
        <div className="logged-in">
          <p>
            Logged in as <strong>{principalText}</strong> (<em>Role: {role}</em>)
          </p>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      )}
    </div>
  );
}
