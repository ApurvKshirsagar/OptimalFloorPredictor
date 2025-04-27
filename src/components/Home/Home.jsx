import React from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import './Home.css';

export default function Home() {
  const navigate = useNavigate(); // 2. Initialize navigate

  return (
    <>
      <section className='hero-section'>
        <h1 className='hero-title'>
          Skyscraper & Building Construction Cost Estimator
        </h1>
        <p className='hero-subtitle'>
          An advanced tool designed to estimate the construction cost of
          skyscrapers and multi-story buildings
        </p>
        <button
          className='hero-button'
          onClick={() => navigate('/calculator')} // 3. Navigate on click
        >
          Start Estimating <span className='arrow'>&rarr;</span>
        </button>
      </section>

      <section className='about-section'>
        <h2 className='about-title'>About the Tool</h2>
        <p className='about-description'>
          SkyCost Dashboard is an advanced tool designed to estimate the
          construction cost of skyscrapers and multi-story buildings. By
          inputting the number of floors and the cost of building a single-story
          floor, the tool provides an accurate calculation of the total cost for
          high-rise projects, making it ideal for architects, developers, and
          construction planners.
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
              Learn how to use the SkyCost Dashboard effectively. Our
              comprehensive user manual will guide you through each feature and
              help you get the most accurate cost estimations.
              <ul>
                <li>Enter the cost of a basic floor in dollars</li>
                <li>Specify the number of floors for your building</li>
                <li>Adjust construction parameters as needed</li>
                <li>View detailed cost breakdown and visualizations</li>
                <li>Export and share your cost estimation reports</li>
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
                ⚗️
              </span>{' '}
              How It Works
            </div>
            <div className='info-card-text'>
              The SkyCost Dashboard uses industry-standard formulas and
              algorithms to calculate construction costs based on your inputs.
              The tool accounts for various factors affecting skyscraper
              construction.
              <ul>
                <li>
                  Takes basic floor cost and multiplies by the number of floors
                </li>
                <li>Applies height factors for taller buildings</li>
                <li>
                  Calculates structural component costs based on percentages
                </li>
                <li>Factors in MEP (Mechanical, Electrical, Plumbing) costs</li>
                <li>Provides comprehensive visualization of cost breakdown</li>
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
                ⚠️
              </span>{' '}
              Disclaimer & Assumptions
            </div>
            <div className='info-card-text'>
              The SkyCost Dashboard provides estimations based on standard
              industry data and assumptions. Actual construction costs may vary
              based on location, market conditions, and specific project
              requirements.
              <ul>
                <li>
                  All costs are in USD and based on typical US construction
                  rates
                </li>
                <li>Default percentages represent industry averages</li>
                <li>The tool assumes standard construction methods</li>
                <li>Land acquisition costs are not included</li>
                <li>Local taxes, permits, and fees are not included</li>
                <li>
                  Special architectural features may require additional costs
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className='info-cards-action'>
          <button
            className='hero-button'
            onClick={() => navigate('/calculator')}
          >
            Try the Calculator Now <span className='arrow'>&rarr;</span>
          </button>
        </div>
      </section>

      <section className='features-section'>
        <h2 className='features-title'>Key Features</h2>
        <div className='features-list'>
          <div className='feature-item'>
            <div className='feature-circle'>1</div>
            <div className='feature-label'>Accurate Estimation</div>
            <div className='feature-desc'>
              Get precise cost estimations based on industry standards and
              formulas
            </div>
          </div>
          <div className='feature-item'>
            <div className='feature-circle'>2</div>
            <div className='feature-label'>Visual Breakdown</div>
            <div className='feature-desc'>
              View detailed charts and graphs of cost components and
              distribution
            </div>
          </div>
          <div className='feature-item'>
            <div className='feature-circle'>3</div>
            <div className='feature-label'>Customizable Parameters</div>
            <div className='feature-desc'>
              Adjust construction parameters to match your specific project
              requirements
            </div>
          </div>
          <div className='feature-item'>
            <div className='feature-circle'>4</div>
            <div className='feature-label'>Professional Reports</div>
            <div className='feature-desc'>
              Generate comprehensive cost reports for project planning and
              presentations
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
