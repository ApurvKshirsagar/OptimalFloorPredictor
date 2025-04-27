import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className='footer'>
      <div className='footer-left'>
        <div className='footer-title'>SkyCost Dashboard</div>
        <div className='footer-subtitle'>
          Professional Skyscraper Cost Estimation
        </div>
      </div>
      <div className='footer-right'>
        <div className='footer-copyright'>
          © 2025 SkyCost Dashboard. All rights reserved.
        </div>
        <div className='footer-helper'>
          Helping builders estimate with precision
        </div>
      </div>
    </footer>
  );
}
