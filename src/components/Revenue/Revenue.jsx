import React, { useState } from 'react';
import './revenue.css';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function RevenueCalculator() {
  // Form states
  const [basePrice, setBasePrice] = useState('70000');
  const [floors, setFloors] = useState('10');
  const [viewPercentage, setViewPercentage] = useState(10); // percent
  const [viewBase, setViewBase] = useState(10);
  const [maxHeatPenaltyPercentage, setMaxHeatPenaltyPercentage] = useState(3); // percent
  const [heatExponent, setHeatExponent] = useState(3);
  const [elevatorPenaltyPercentage, setElevatorPenaltyPercentage] =
    useState(0.25); // percent
  const [validationError, setValidationError] = useState('');
  const [area, setArea] = useState(3560);
  const [isLoading, setIsLoading] = useState(false);

  // Results states
  const [revenueByFloorData, setRevenueByFloorData] = useState([]);
  const [breakdownByFloorData, setBreakdownByFloorData] = useState([]);
  const [totalBuildingRevenue, setTotalBuildingRevenue] = useState(null);
  const [buildingRevenuePerSqFeet, setBuildingRevenuePerSqFeet] =
    useState(null);

  // Main calculation
  const calculateRevenue = async () => {
    setValidationError('');
    setIsLoading(true);
    setTotalBuildingRevenue(null);
    setBuildingRevenuePerSqFeet(null); // Clear previous result

    const requestData = {
      basePrice: Number(basePrice),
      viewPercentage: Number(viewPercentage) / 100,
      viewBase: Number(viewBase),
      maxHeatPenaltyPercentage: Number(maxHeatPenaltyPercentage) / 100,
      heatExponent: Number(heatExponent),
      elevatorPenaltyPercentage: Number(elevatorPenaltyPercentage) / 100,
      area: Number(area),
    };

    try {
      // Fetch totalBuildingRevenue from the first floor's response
      const firstRes = await fetch('http://localhost:3000/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestData,
          totalNumber: Number(floors),
          floorNumber: 1,
        }),
      });
      const firstData = await firstRes.json();
      setTotalBuildingRevenue(firstData.buildingRevenue);
      setBuildingRevenuePerSqFeet(firstData.buildingRevenuePerSqFeet);

      // 1. Fetch Revenue by Floor
      const revenueArr = [];
      for (let i = 1; i <= Number(floors); i++) {
        const res = await fetch('http://localhost:3000/revenue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...requestData,
            totalNumber: Number(floors),
            floorNumber: i,
          }),
        });
        const data = await res.json();
        revenueArr.push({
          floor: i,
          revenue: data.floorRevenue,
        });
      }
      setRevenueByFloorData(revenueArr);

      // 2. Fetch Breakdown by Floor
      const breakdownArr = [];
      for (let i = 1; i <= Number(floors); i++) {
        const res = await fetch('http://localhost:3000/revenue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...requestData,
            totalNumber: Number(floors),
            floorNumber: i,
          }),
        });
        const data = await res.json();
        breakdownArr.push({
          floor: i,
          Base: data.floorBreakdown.basePrice,
          'View Premium': data.floorBreakdown.viewPremium,
          'Heat Penalty': data.floorBreakdown.heatPenalty,
          'Elevator Penalty': data.floorBreakdown.elevatorPenalty,
        });
      }
      setBreakdownByFloorData(breakdownArr);
    } catch (error) {
      setValidationError('Error calculating revenue. Please try again.');
      setRevenueByFloorData([]);
      setBreakdownByFloorData([]);
      setTotalBuildingRevenue(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Format chart data - convert negative values to positive for display
  const formatChartData = (data) => {
    return data.map((item) => ({
      ...item,
      'Heat Penalty': Math.abs(item['Heat Penalty']),
      'Elevator Penalty': Math.abs(item['Elevator Penalty']),
    }));
  };

  // Custom tooltip for the stacked bar chart to show correct values (negatives)
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className='custom-tooltip'>
          <div className='tooltip-title'>{`Floor ${label}`}</div>
          {payload.map((entry, index) => {
            // Show negative values for penalties in tooltip
            let value = entry.value;
            if (
              entry.name === 'Heat Penalty' ||
              entry.name === 'Elevator Penalty'
            ) {
              value = -value;
            }
            return (
              <div key={index}>
                {`${entry.name}: ${value.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`}
              </div>
            );
          })}
          <div className='tooltip-total'>
            {`Total: ${payload
              .reduce((acc, entry) => {
                // Calculate correct total accounting for negative values
                let value = entry.value;
                if (
                  entry.name === 'Heat Penalty' ||
                  entry.name === 'Elevator Penalty'
                ) {
                  value = -value;
                }
                return acc + value;
              }, 0)
              .toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className='calculator-page'>
      <div className='calc-title'>Building Revenue Calculator</div>
      <div className='calc-desc'>
        Estimate floor-wise and total building revenue with view premiums and
        penalties.
      </div>
      <div className='calc-card'>
        <div className='calc-section-title'>Revenue Parameters</div>
        <hr className='calc-divider' />
        <div className='calc-inputs-row'>
          <div className='calc-input-group'>
            <label className='calc-label'>Base Price per square feet (₹)</label>
            <input
              className='calc-input'
              type='number'
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </div>
          <div className='calc-input-group'>
            <label className='calc-label'>Floors</label>
            <input
              className='calc-input'
              type='number'
              value={floors}
              onChange={(e) => setFloors(e.target.value)}
            />
          </div>
          <div className='calc-input-group'>
            <label className='calc-label'>View Premium (%)</label>
            <input
              className='calc-input'
              type='number'
              value={viewPercentage}
              onChange={(e) => setViewPercentage(e.target.value)}
            />
          </div>
          <div className='calc-input-group'>
            <label className='calc-label'>View Base (floor)</label>
            <input
              className='calc-input'
              type='number'
              value={viewBase}
              onChange={(e) => setViewBase(e.target.value)}
            />
          </div>
          <div className='calc-input-group'>
            <label className='calc-label'>Max Heat Penalty (%)</label>
            <input
              className='calc-input'
              type='number'
              value={maxHeatPenaltyPercentage}
              onChange={(e) => setMaxHeatPenaltyPercentage(e.target.value)}
            />
          </div>
          <div className='calc-input-group'>
            <label className='calc-label'>Heat Exponent</label>
            <input
              className='calc-input'
              type='number'
              value={heatExponent}
              onChange={(e) => setHeatExponent(e.target.value)}
            />
          </div>
          <div className='calc-inputs-row'>
            <div className='calc-input-group'>
              <label className='calc-label'>Elevator Penalty (%)</label>
              <input
                className='calc-input'
                type='number'
                value={elevatorPenaltyPercentage}
                onChange={(e) => setElevatorPenaltyPercentage(e.target.value)}
              />
            </div>
          </div>
          <div className='calc-input-group'>
            <label className='calc-label'>Area (sq ft)</label>
            <input
              className='calc-input'
              type='number'
              value={area}
              min={1}
              onChange={(e) => setArea(e.target.value)}
              placeholder='Area (sq ft)'
            />
          </div>
        </div>

        {validationError && (
          <div className='validation-error'>{validationError}</div>
        )}
        <div className='calc-btn-center'>
          <button
            className='calc-btn'
            onClick={calculateRevenue}
            disabled={isLoading}
          >
            {isLoading ? 'Calculating...' : 'Calculate Revenue'}
          </button>
        </div>
      </div>

      <div className='results-container'>
        {totalBuildingRevenue !== null && (
          <div className='result-card summary-card revenue-summary-card'>
            <div className='revenue-label'>Total Building Revenue</div>
            <div className='revenue-value'>
              {Number(totalBuildingRevenue).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
            <div className='revenue-divider' />
            <div className='revenue-per-sqft'>
              <span>Total Revenue per sq ft:</span>
              <span className='per-sqft-value'>
                {buildingRevenuePerSqFeet?.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className='revenue-note'>All figures in INR</div>
          </div>
        )}

        {revenueByFloorData.length > 0 && (
          <div className='chart-card'>
            <div className='result-heading'>Revenue by Floor</div>
            <ResponsiveContainer width='100%' height={320}>
              <BarChart
                data={revenueByFloorData}
                margin={{ top: 30, right: 30, left: 20, bottom: 40 }}
                barCategoryGap='20%'
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='floor'
                  label={{
                    value: 'Floor',
                    position: 'insideBottom',
                    offset: -10,
                    fontSize: 16,
                    fontWeight: 600,
                    fill: '#23477a',
                  }}
                  tick={{ fontSize: 14, fill: '#22223b' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  label={{
                    value: 'Revenue (₹)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: -5,
                    fontSize: 16,
                    fontWeight: 600,
                    fill: '#23477a',
                  }}
                  tickFormatter={(value) =>
                    value >= 1e7
                      ? `${(value / 1e7).toFixed(1)}Cr`
                      : value >= 1e5
                      ? `${(value / 1e5).toFixed(1)}L`
                      : value >= 1e3
                      ? `${(value / 1e3).toFixed(1)}K`
                      : value
                  }
                  domain={[0, (dataMax) => Math.ceil(dataMax * 1.1)]}
                  tick={{ fontSize: 14, fill: '#22223b' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) =>
                    value.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })
                  }
                  labelFormatter={(label) => `Floor: ${label}`}
                  contentStyle={{ borderRadius: 8, fontSize: 14 }}
                />
                <Legend verticalAlign='top' height={36} />
                <Bar
                  dataKey='revenue'
                  fill='#23477a'
                  name='Floor Revenue'
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {breakdownByFloorData.length > 0 && (
          <div className='full-width-card'>
            <div className='result-heading'>
              Floor-wise Revenue Breakdown Per Square Feet
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className='params-table'>
                <thead>
                  <tr>
                    <th>Floor</th>
                    <th>Base</th>
                    <th>View Premium</th>
                    <th>Heat Penalty</th>
                    <th>Elevator Penalty</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdownByFloorData.map((row) => (
                    <tr key={row.floor}>
                      <td>{row.floor}</td>
                      <td>
                        {row.Base.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td>
                        {row['View Premium'].toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td>
                        {row['Heat Penalty'].toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td>
                        {row['Elevator Penalty'].toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
