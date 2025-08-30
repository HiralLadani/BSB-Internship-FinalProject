import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.scss';
import bgImage from './assets/bg.jpg'; // Make sure bg.jpg is inside src/assets/

function Landing({ onLogin }) {
  return (
    <div
      className="landing"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        color: '#e0e0e0',
      }}
    >
      <div className="header">
  <button className="ii-login-btn" onClick={onLogin}>
    Login with Internet Identity
  </button>
</div>
      <h1>DECENTRALIZED AUTONOMOUS UNIVERSITY</h1>
      <p>Your Blockchain‑Powered University</p>
      <p>Propose courses. Track learning. Earn verifiable on-chain credentials on ICP</p>
      {/* <p>Learn. Suggest. Vote. Track habits. Earn on-chain credentials.</p> */}

      <section className="how-it-works">
        <h2>How It Works?</h2>
        <div className="steps">
          <div className="step">
            <div className="icon">💡</div>
            <h3>1. Suggest & Vote</h3>
            <p>Students propose new courses → peers vote → admin approves top picks.</p>
          </div>
          <div className="step">
            <div className="icon">📈</div>
            <h3>2. Habit Tracker</h3>
            <p>Track daily engagement—promote learning consistency & habits.</p>
          </div>
          <div className="step">
            <div className="icon">🏅</div>
            <h3>3. Earn Certificate</h3>
            <p>Complete your course consistently → receive on-chain certificate with habit graph.</p>
          </div>
        </div>
      </section>
   

<section className="how-it-works">
            <h2>Why Learn With DAU</h2>
                <div className="steps">                  
                    <div className="step">
                      <div className="icon">🌍 </div>
                        <h3> Global & Remote</h3>
                      <p>Learn from anywhere—100% online, built for a borderless world.</p>
                    </div>
                    <div className="step"> 
                      <div className="icon">⚙️</div>
                      <h3> Expandable & Evolving</h3>
                      <p>Start with online courses & scale into full university programs.</p>
                    </div> 
                    <div className="step"> 
                      <div className="icon">👩‍🏫</div>
                      <h3> High‑Quality Instructors</h3>
                      <p>Collaborate with top educators and researchers.</p>
                    </div> 
                </div>
      </section>
<section className="how-it-works">
            
                <div className="steps">                  
                    <div className="step">
                      <div className="icon">💸 </div>
                        <h3> Cost‑Effective Learning</h3>
                      <p>Designed to be one of the most affordable higher‑ed solutions.</p>
                    </div>
                    <div className="step"> 
                      <div className="icon">🔗</div>
                      <h3> Decentralized & Secure</h3>
                      <p>Powered by blockchain—your work and credentials are tamper‑proof.</p>
                    </div> 
                    <div className="step"> 
                      <div className="icon">🔧</div>
                      <h3> Innovative Tech Stack</h3>
                      <p>Built with decentralized‑internet SDKs, CloutContracts, BitBadges, and on‑chain credential hashes.</p>
                    </div> 
                </div>
      </section>

     

      

    </div>
  );
}

function Main() {
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = () => {
    setLoggedIn(true);
  };

  return loggedIn ? <App /> : <Landing onLogin={handleLogin} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<Main />);
