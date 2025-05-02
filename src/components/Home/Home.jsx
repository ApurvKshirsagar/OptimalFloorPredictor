import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <section className='hero-section'>
        <h1 className='hero-title'>Skyscraper & Building Project Estimator</h1>
        <p className='hero-subtitle'>
          Analyze construction cost, floor-wise revenue, and cashflow for
          skyscrapers and multi-story buildings. Model your project’s financials
          and optimize the number of floors for maximum profitability.
        </p>
        <div className='hero-navlinks'>
          <button
            className='hero-button'
            onClick={() => navigate('/calculator')}
          >
            Cost Estimation
          </button>
          <button className='hero-button' onClick={() => navigate('/revenue')}>
            Revenue Analysis
          </button>
          <button className='hero-button' onClick={() => navigate('/cashflow')}>
            Cashflow & Optimization
          </button>
        </div>
      </section>

      <section className='about-section'>
        <h2 className='about-title'>About the Tool</h2>
        <p className='about-description'>
          The SkyCost Dashboard empowers architects, developers, and planners to
          make data-driven decisions for high-rise projects. By inputting your
          project parameters, you get detailed calculations for construction
          cost, projected revenue by floor, and cumulative cashflow. This
          enables comprehensive evaluation of project feasibility and
          profitability.
        </p>
      </section>

      <section className='info-cards-section'>
        <div className='info-cards-container'>
          <div className='info-card'>
            <div className='info-card-title'>
              <span role='img' aria-label='manual' className='info-card-icon'>
                📖
              </span>{' '}
              User Manual
            </div>
            <div className='info-card-text'>
              Learn how to use the SkyCost Dashboard for complete project
              analysis:
              <ul>
                <li>
                  Enter the base cost of a single floor and the total number of
                  floors
                </li>
                <li>
                  Set revenue parameters including base price, view premium, and
                  penalty factors
                </li>
                <li>Adjust construction and financial parameters as needed</li>
                <li>
                  View detailed breakdowns of cost, revenue, and cashflow for
                  every floor
                </li>
                <li>
                  Visualize trends and identify the optimal number of floors for
                  your project
                </li>
                <li>Export and share comprehensive project reports</li>
              </ul>
            </div>
          </div>
          <div className='info-card'>
            <div className='info-card-title'>
              <span
                role='img'
                aria-label='how it works'
                className='info-card-icon'
              >
                ⚗
              </span>{' '}
              How It Works
            </div>
            <div className='info-card-text'>
              The SkyCost Dashboard uses engineering and real estate models to
              simulate your project’s financials:
              <ul>
                <li>
                  Calculates construction cost for each floor, including beams,
                  columns, foundation, envelope, and MEP
                </li>
                <li>
                  Estimates revenue for every floor, factoring in view premiums,
                  heat penalties, and elevator penalties
                </li>
                <li>
                  Generates cumulative cashflow curves and identifies the most
                  profitable building height
                </li>
                <li>
                  Provides interactive charts and tables for cost, revenue, and
                  cashflow analysis
                </li>
              </ul>
            </div>
          </div>
          <div className='info-card'>
            <div className='info-card-title'>
              <span
                role='img'
                aria-label='disclaimer'
                className='info-card-icon'
              >
                ⚠
              </span>{' '}
              Disclaimer & Assumptions
            </div>
            <div className='info-card-text'>
              SkyCost Dashboard provides estimates based on industry data and
              academic models. Actual results may vary depending on:
              <ul>
                <li>
                  Location, market conditions, and project-specific requirements
                </li>
                <li>Input parameters and construction standards</li>
                <li>
                  Land acquisition costs, taxes, and special features (which may
                  need to be added separately)
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className='info-cards-action'>
          <button className='hero-button' onClick={() => navigate('/cashflow')}>
            Try the Calculator Now <span className='arrow'>&rarr;</span>
          </button>
        </div>
      </section>

      <section className='features-section'>
        <h2 className='features-title'>Key Features</h2>
        <div className='features-list'>
          <div className='feature-item'>
            <div className='feature-circle'>1</div>
            <div className='feature-label'>Comprehensive Estimation</div>
            <div className='feature-desc'>
              Model construction cost, revenue, and cashflow for any building
              height.
            </div>
          </div>
          <div className='feature-item'>
            <div className='feature-circle'>2</div>
            <div className='feature-label'>Visual Analysis</div>
            <div className='feature-desc'>
              Explore detailed charts and graphs showing cost, revenue, and
              cashflow distribution by floor.
            </div>
          </div>
          <div className='feature-item'>
            <div className='feature-circle'>3</div>
            <div className='feature-label'>Customizable Parameters</div>
            <div className='feature-desc'>
              Adjust all key inputs to reflect your unique project requirements
              and scenarios.
            </div>
          </div>
          <div className='feature-item'>
            <div className='feature-circle'>4</div>
            <div className='feature-label'>Professional Reporting</div>
            <div className='feature-desc'>
              Generate and export detailed reports for project documentation,
              planning, and presentations.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}