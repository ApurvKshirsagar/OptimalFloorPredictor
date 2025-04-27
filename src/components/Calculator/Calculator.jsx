import React, { useState } from 'react';
import './Calculator.css';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

// Pie chart colors
const PIE_COLORS = ['#2196F3', '#4CAF50', '#FFC107', '#FF9800', '#9C27B0'];
const COMPONENT_KEYS = [
  { key: 'totalBeamsSlabCost', label: 'Beams & Slab' },
  { key: 'totalColumnCost', label: 'Column' },
  { key: 'totalFoundationCost', label: 'Foundation' },
  { key: 'totalEnvelopeCost', label: 'Envelope' },
  { key: 'totalMEPCost', label: 'MEP' },
];

export default function Calculator() {
  // Form states
  const [basicCost, setBasicCost] = useState('7000000');
  const [floors, setFloors] = useState('10');
  const [isGroundParking, setIsGroundParking] = useState(false);
  const [parkingPercent, setParkingPercent] = useState(25);
  const [validationError, setValidationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Parameter states
  const [params, setParams] = useState([
    { id: 'civil', label: 'Civil', sn: '1', percent: 60, depth: 0 },
    {
      id: 'structural',
      label: 'Structural',
      sn: '1.1',
      percent: 60,
      depth: 1,
      parentId: 'civil',
    },
    {
      id: 'beams',
      label: 'Beams & Slab',
      sn: '1.1.1',
      percent: 40,
      depth: 2,
      parentId: 'structural',
    },
    {
      id: 'column',
      label: 'Column',
      sn: '1.1.2',
      percent: 30,
      depth: 2,
      parentId: 'structural',
    },
    {
      id: 'foundation',
      label: 'Foundation',
      sn: '1.1.3',
      percent: 30,
      depth: 2,
      parentId: 'structural',
    },
    {
      id: 'envelope',
      label: 'Envelope',
      sn: '1.2',
      percent: 40,
      depth: 1,
      parentId: 'civil',
    },
    { id: 'mep', label: 'MEP', sn: '2', percent: 40, depth: 0 },
  ]);

  // Results states
  const [calculationResult, setCalculationResult] = useState(null);
  const [componentPieData, setComponentPieData] = useState([]);
  const [costByFloorData, setCostByFloorData] = useState([]);
  const [breakdownByFloorData, setBreakdownByFloorData] = useState([]);

  // Slider logic for Civil/MEP and Structural/Envelope
  const handleSliderChange = (id, newValue) => {
    const updatedParams = [...params];
    const paramIndex = updatedParams.findIndex((p) => p.id === id);
    if (paramIndex === -1) return;
    const newPercent = Number(newValue);
    updatedParams[paramIndex].percent = newPercent;

    if (id === 'civil') {
      const mepIndex = updatedParams.findIndex((p) => p.id === 'mep');
      updatedParams[mepIndex].percent = 100 - newPercent;
    } else if (id === 'mep') {
      const civilIndex = updatedParams.findIndex((p) => p.id === 'civil');
      updatedParams[civilIndex].percent = 100 - newPercent;
    } else if (id === 'structural') {
      const envelopeIndex = updatedParams.findIndex((p) => p.id === 'envelope');
      updatedParams[envelopeIndex].percent = 100 - newPercent;
    } else if (id === 'envelope') {
      const structuralIndex = updatedParams.findIndex(
        (p) => p.id === 'structural'
      );
      updatedParams[structuralIndex].percent = 100 - newPercent;
    }
    setValidationError('');
    setParams(updatedParams);
  };

  // Validation for Beams+Column+Foundation
  const validateStructuralComponents = () => {
    const beams = params.find((p) => p.id === 'beams')?.percent || 0;
    const column = params.find((p) => p.id === 'column')?.percent || 0;
    const foundation = params.find((p) => p.id === 'foundation')?.percent || 0;
    const sum = beams + column + foundation;
    return Math.abs(sum - 100) < 0.5;
  };

  const getStructuralComponentsSum = () => {
    const beams = params.find((p) => p.id === 'beams')?.percent || 0;
    const column = params.find((p) => p.id === 'column')?.percent || 0;
    const foundation = params.find((p) => p.id === 'foundation')?.percent || 0;
    return beams + column + foundation;
  };

  // Main calculation and chart data fetching
  const calculateCost = async () => {
    if (!validateStructuralComponents()) {
      setValidationError(
        'Beams & Slab + Column + Foundation must sum to 100%. Please adjust your values.'
      );
      return;
    }
    setValidationError('');
    setIsLoading(true);

    // Prepare data for API
    const requestData = {
      totalNumber: Number(floors),
      floorCost: Number(basicCost),
      isParkingFloor: isGroundParking,
      parkingCostPercentage: parkingPercent / 100,
      civilPercentage: params.find((p) => p.id === 'civil').percent / 100,
      structuralPercentage:
        params.find((p) => p.id === 'structural').percent / 100,
      beamsSlabPercentage: params.find((p) => p.id === 'beams').percent / 100,
      columnPercentage: params.find((p) => p.id === 'column').percent / 100,
      foundationPercentage:
        params.find((p) => p.id === 'foundation').percent / 100,
      envelopePercentage: params.find((p) => p.id === 'envelope').percent / 100,
      MEPPercentage: params.find((p) => p.id === 'mep').percent / 100,
    };

    try {
      // 1. Fetch total cost and component breakdown
      const mainRes = await fetch('http://localhost:3000/totalcost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      if (!mainRes.ok) throw new Error('Failed to calculate cost');
      const mainData = await mainRes.json();
      setCalculationResult(mainData);

      // 2. Prepare pie chart data
      const pieData = COMPONENT_KEYS.map((comp, idx) => ({
        name: comp.label,
        value: mainData.breakdown[comp.key],
        color: PIE_COLORS[idx],
      }));
      setComponentPieData(pieData);

      // 3. Fetch Cost by Floor Number (cumulative, using /totalcost)
      const costByFloorArr = [];
      for (let i = 1; i <= Number(floors); i++) {
        const res = await fetch('http://localhost:3000/totalcost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...requestData, totalNumber: i }),
        });
        const data = await res.json();
        costByFloorArr.push({ floor: i, cost: data.finalBuildingCost });
      }
      setCostByFloorData(costByFloorArr);

      // 4. Fetch Cost Breakdown by Floor (using /floorcost)
      const breakdownArr = [];
      for (let i = 1; i <= Number(floors); i++) {
        const res = await fetch('http://localhost:3000/floorcost', {
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
          'Beams & Slab': data.floorBreakdown.beamsSlabCost,
          Column: data.floorBreakdown.columnCost,
          Foundation: data.floorBreakdown.foundationCost,
          Envelope: data.floorBreakdown.envelopeCost,
          MEP: data.floorBreakdown.MEPCost,
        });
      }
      setBreakdownByFloorData(breakdownArr);
    } catch (error) {
      setValidationError('Error calculating cost. Please try again.');
      setCalculationResult(null);
      setComponentPieData([]);
      setCostByFloorData([]);
      setBreakdownByFloorData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='calculator-page'>
      {/* --- Input Section --- */}
      <h1 className='calc-title'>Skyscraper Cost Calculator</h1>
      <p className='calc-desc'>
        Enter the required information below to calculate the estimated cost of
        your multi-story building or skyscraper. Adjust the parameters to match
        your specific project requirements.
      </p>
      <div className='calc-card'>
        <div className='calc-section-title'>Input Parameters</div>
        <hr className='calc-divider' />
        <div className='calc-inputs-row'>
          <div className='calc-input-group'>
            <label className='calc-label'>Cost of Basic Floor (₹)</label>
            <input
              type='number'
              className='calc-input'
              value={basicCost}
              onChange={(e) => setBasicCost(e.target.value)}
            />
          </div>
          <div className='calc-input-group'>
            <label className='calc-label'>Number of Floors</label>
            <input
              type='number'
              className='calc-input'
              value={floors}
              onChange={(e) => setFloors(e.target.value)}
            />
          </div>
        </div>
        <div className='calc-toggle-container'>
          <div className='calc-toggle-row'>
            <label className='calc-toggle'>
              <input
                type='checkbox'
                checked={isGroundParking}
                onChange={(e) => setIsGroundParking(e.target.checked)}
              />
              <span className='calc-slider'></span>
            </label>
            <span className='calc-toggle-label'>
              Is ground floor given as parking and security offices?
            </span>
          </div>
          {isGroundParking && (
            <div className='parking-slider-container'>
              <label className='calc-label'>
                Parking Cost Percentage:{' '}
                <span className='parking-percent'>{parkingPercent}%</span>
              </label>
              <input
                type='range'
                min='0'
                max='100'
                value={parkingPercent}
                className='param-slider parking-slider'
                onChange={(e) => setParkingPercent(Number(e.target.value))}
              />
              <div className='parking-hint'>
                (Percentage of basic floor cost allocated to ground floor
                parking)
              </div>
            </div>
          )}
        </div>
      </div>
      {/* --- Construction Parameters --- */}
      <div className='calc-card' style={{ marginTop: '2.5rem' }}>
        <div className='calc-section-title'>Construction Parameters</div>
        <div className='calc-section-desc'>
          Adjust the inputs below according to the project's complexity, as they
          vary based on different architectural and user requirements.
        </div>
        {validationError && (
          <div className='validation-error'>{validationError}</div>
        )}
        <table className='params-table'>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Description</th>
              <th>% Construction Cost</th>
              <th>Adjust</th>
            </tr>
          </thead>
          <tbody>
            {params.map((param) => (
              <tr
                key={param.id}
                className={param.depth === 1 ? 'param-row-highlight' : ''}
              >
                <td>{param.sn}</td>
                <td style={{ paddingLeft: `${param.depth * 1.5}rem` }}>
                  {param.label}
                </td>
                <td>{param.percent}%</td>
                <td>
                  <input
                    type='range'
                    min='0'
                    max='100'
                    value={param.percent}
                    className='param-slider'
                    onChange={(e) =>
                      handleSliderChange(param.id, e.target.value)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className='structural-sum-indicator'>
          <div className='sum-label'>Structural Components Sum:</div>
          <div
            className={`sum-value ${
              validateStructuralComponents() ? 'valid-sum' : 'invalid-sum'
            }`}
          >
            {getStructuralComponentsSum().toFixed(1)}%
          </div>
          {!validateStructuralComponents() && (
            <div className='sum-hint'>(Must equal 100%)</div>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            className='calc-btn'
            onClick={calculateCost}
            disabled={isLoading}
          >
            {isLoading ? 'Calculating...' : 'Calculate Cost'}
          </button>
        </div>
      </div>
      {/* --- Results Section --- */}
      {calculationResult && (
        <div className='results-container'>
          {/* Summary Card */}
          <div className='result-card summary-card'>
            <h2 className='result-heading'>Cost Estimate Results</h2>
            <hr className='result-divider' />
            <div className='summary-content'>
              <div className='summary-item'>
                <span className='summary-label'>Total Floors</span>
                <span className='summary-value'>
                  {calculationResult.totalNumber}
                </span>
              </div>
              <div className='summary-item'>
                <span className='summary-label'>Total Cost</span>
                <span className='summary-value cost-value'>
                  ₹{calculationResult.finalBuildingCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          {/* Charts */}
          <div className='charts-container'>
            {/* Pie Chart */}
            <div className='result-card chart-card'>
              <h2 className='result-heading'>Cost by Component</h2>
              <ResponsiveContainer width='100%' height={300}>
                <PieChart>
                  <Pie
                    data={componentPieData}
                    cx='50%'
                    cy='50%'
                    labelLine={true}
                    outerRadius={100}
                    dataKey='value'
                    nameKey='name'
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {componentPieData.map((entry, idx) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip
                    formatter={(value) => `₹${Number(value).toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Cost by Floor Number */}
            <div className='result-card chart-card'>
              <h2 className='result-heading'>Cost by Floor Number</h2>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart
                  data={costByFloorData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    dataKey='floor'
                    label={{
                      value: 'Floor Number',
                      position: 'insideBottom',
                      offset: -5,
                    }}
                  />
                  <YAxis
                    label={{
                      value: 'Cost (₹)',
                      angle: -90,
                      position: 'left',
                      offset: 30,
                    }}
                    tickFormatter={(value) =>
                      `₹${(value / 1000000).toFixed(2)}M`
                    }
                  />
                  <Tooltip
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    labelFormatter={(value) => `Floor ${value}`}
                  />
                  <Bar dataKey='cost' fill='#1E4976' />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Cost Breakdown by Floor */}
          <div className='result-card full-width-card'>
            <h2 className='result-heading'>Cost Breakdown by Floor</h2>
            <ResponsiveContainer width='100%' height={400}>
              <BarChart
                data={breakdownByFloorData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='floor' />
                <YAxis
                  tickFormatter={(value) => {
                    if (value === 0) return '₹0';
                    if (value < 1000000)
                      return `₹${(value / 1000).toFixed(0)}K`;
                    return `₹${(value / 1000000).toFixed(2)}M`;
                  }}
                />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey='Beams & Slab' stackId='a' fill='#2196F3' />
                <Bar dataKey='Column' stackId='a' fill='#4CAF50' />
                <Bar dataKey='Foundation' stackId='a' fill='#FFC107' />
                <Bar dataKey='Envelope' stackId='a' fill='#FF9800' />
                <Bar dataKey='MEP' stackId='a' fill='#9C27B0' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
