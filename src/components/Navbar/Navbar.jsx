import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className='navbar'>
      <div className='navbar-left'>
        <NavLink to='/' className='navbar-home-link'>
          <span className='navbar-icon'>🏙️</span>
          <span className='navbar-title'>SkyDashboard</span>
        </NavLink>
      </div>
      <ul className='navbar-links'>
        <li>
          <NavLink
            to='/'
            className={({ isActive }) =>
              isActive ? 'navbar-link active-link' : 'navbar-link'
            }
          >
            Home
          </NavLink>
        </li>
        <li>
          <NavLink
            to='/calculator'
            className={({ isActive }) =>
              isActive ? 'navbar-link active-link' : 'navbar-link'
            }
          >
            Calculate Cost
          </NavLink>
        </li>
        <li>
          <NavLink
            to='/revenue'
            className={({ isActive }) =>
              isActive ? 'navbar-link active-link' : 'navbar-link'
            }
          >
            Calculate Revenue
          </NavLink>
        </li>
        <li>
          <NavLink
            to='/cashflow'
            className={({ isActive }) =>
              isActive ? 'navbar-link active-link' : 'navbar-link'
            }
          >
            Cash Flow
          </NavLink>
        </li>
        <li>
          <NavLink
            to='/about'
            className={({ isActive }) =>
              isActive ? 'navbar-link active-link' : 'navbar-link'
            }
          >
            About Us
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
