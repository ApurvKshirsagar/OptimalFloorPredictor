// Cashflow.jsx
import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import { calculateBuildingCost, calculateFloorCost } from './costFunctions';
import {
  calculateViewPremium,
  calculateHeatPenalty,
  calculateElevatorPenalty,
} from './revenueFunctions';

const PIE_COLORS = ['#2196F3', '#4CAF50', '#FFC107', '#FF9800', '#9C27B0'];
const COMPONENT_KEYS = [
  { key: 'totalBeamsSlabCost', label: 'Beams & Slab' },
  { key: 'totalColumnCost', label: 'Column' },
  { key: 'totalFoundationCost', label: 'Foundation' },
  { key: 'totalEnvelopeCost', label: 'Envelope' },
  { key: 'totalMEPCost', label: 'MEP' },
];

export default function Cashflow() {
  // === Cost states (naming from Calculator.jsx) ===
  const [basicCost, setBasicCost] = useState('10000000');
  const [floors, setFloors] = useState('100');
  const [isGroundParking, setIsGroundParking] = useState(false);
  const [parkingPercent, setParkingPercent] = useState(25);
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
  const [validationError, setValidationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cost results
  const [calculationResult, setCalculationResult] = useState(null);
  const [componentPieData, setComponentPieData] = useState([]);
  const [costByFloorData, setCostByFloorData] = useState([]);
  const [breakdownByFloorData, setBreakdownByFloorData] = useState([]);
  const [showAllRevenueRows, setShowAllRevenueRows] = useState(false);

  // === Revenue states (naming from Revenue.jsx) ===
  const [basePrice, setBasePrice] = useState('60000');
  const [viewPercentage, setViewPercentage] = useState(10);
  const [viewBase, setViewBase] = useState(10);
  const [maxHeatPenaltyPercentage, setMaxHeatPenaltyPercentage] = useState(3);
  const [heatExponent, setHeatExponent] = useState(3);
  const [elevatorPenaltyPercentage, setElevatorPenaltyPercentage] =
    useState(0.25);
  const [area, setArea] = useState(3464.72);
  const [validationErrorRev, setValidationErrorRev] = useState('');
  const [isLoadingRev, setIsLoadingRev] = useState(false);

  // Revenue results
  const [revenueByFloorData, setRevenueByFloorData] = useState([]);
  const [breakdownByFloorRev, setBreakdownByFloorRev] = useState([]);
  const [totalBuildingRevenue, setTotalBuildingRevenue] = useState(null);
  const [buildingRevenuePerSqFeet, setBuildingRevenuePerSqFeet] =
    useState(null);

  // === Cashflow related states ===
  const [cashflowMarr, setCashflowMarr] = useState(15); // editable
  const [fsi, setFsi] = useState(3);
  const [builtupAreaSqFtPerFloor, setBuiltupAreaSqFtPerFloor] =
    useState(4540.72);
  const [landCostPerSqFt, setLandCostPerSqFt] = useState(20000);
  const [landAreaBaseSqFt, setLandAreaBaseSqFt] = useState(18655.15);

  const cashflowConstructionPeriod = 5; // fixed 5 years
  const [cashflowData, setCashflowData] = useState([]); // final graph data
  const [isGeneratingCashflow, setIsGeneratingCashflow] = useState(false);

  // === Helpers for cost (from Calculator.jsx) ===
  const validateStructuralComponents = () => {
    const beams = params.find((p) => p.id === 'beams').percent;
    const column = params.find((p) => p.id === 'column').percent;
    const foundation = params.find((p) => p.id === 'foundation').percent;
    const sum = beams + column + foundation;
    return Math.abs(sum - 100) < 0.5;
  };
  const getStructuralComponentsSum = () => {
    const beams = params.find((p) => p.id === 'beams').percent;
    const column = params.find((p) => p.id === 'column').percent;
    const foundation = params.find((p) => p.id === 'foundation').percent;
    return beams + column + foundation;
  };
  const handleSliderChange = (id, newValue) => {
    const updated = [...params];
    const idx = updated.findIndex((p) => p.id === id);
    updated[idx].percent = Number(newValue);
    if (id === 'civil')
      updated.find((p) => p.id === 'mep').percent = 100 - updated[idx].percent;
    if (id === 'mep')
      updated.find((p) => p.id === 'civil').percent =
        100 - updated[idx].percent;
    if (id === 'structural')
      updated.find((p) => p.id === 'envelope').percent =
        100 - updated[idx].percent;
    if (id === 'envelope')
      updated.find((p) => p.id === 'structural').percent =
        100 - updated[idx].percent;
    setParams(updated);
    setValidationError('');
  };

 const civilPercentage = params.find((p) => p.id === 'civil')?.percent / 100;
   const structuralPercentage = params.find((p) => p.id === 'structural')?.percent / 100;
   const beamsSlabPercentage = params.find((p) => p.id === 'beams')?.percent / 100;
   const columnPercentage = params.find((p) => p.id === 'column')?.percent / 100;
   const foundationPercentage = params.find((p) => p.id === 'foundation')?.percent / 100;
   const envelopePercentage = params.find((p) => p.id === 'envelope')?.percent / 100;
   const MEPPercentage = params.find((p) => p.id === 'mep')?.percent / 100;
 
   // 2) Compute net percentages
   const netStructuralPercentage = civilPercentage * structuralPercentage;
   const netBeamsSlabPercentage = netStructuralPercentage * beamsSlabPercentage;
   const netColumnPercentage = netStructuralPercentage * columnPercentage;
   const netFoundationPercentage =
     netStructuralPercentage * foundationPercentage;
   const netEnvelopePercentage = civilPercentage * envelopePercentage;
 
   const beamsSlabConstructibilityCost = 0.03
   const columnConstructibilityCost = 0.03
   const envelopeConstructibilityCost = 0.05
   const MEPConstructibilityCost = 0.01
 
   const calculateCost = () => {
     if (!validateStructuralComponents()) {
       setValidationError(
         'Beams & Slab + Column + Foundation must sum to 100%.'
       );
       return;
     }
     setValidationError('');
     setIsLoading(true);
 
     const totalNumber = Number(floors);
     const floorCost = Number(basicCost);
     const parkingCostPercentage = parkingPercent / 100;
 
     const totalRes = calculateBuildingCost(
       floorCost,
       totalNumber,
       netBeamsSlabPercentage,
       beamsSlabConstructibilityCost,
       netEnvelopePercentage,
       envelopeConstructibilityCost,
       MEPPercentage,
       MEPConstructibilityCost,
       netColumnPercentage,
       columnConstructibilityCost,
       netFoundationPercentage,
       isGroundParking,
       parkingCostPercentage
     );
 
     setCalculationResult(totalRes);
     setComponentPieData(
       COMPONENT_KEYS.map((c, i) => ({
         name: c.label,
         value: totalRes.breakdown[c.key],
         color: PIE_COLORS[i],
       }))
     );
 
     const floorcostArr = [];
     for (let i = 1; i <= totalNumber; i++) {
       const tillThatFloorCost = calculateBuildingCost(
         floorCost,
         i,
         netBeamsSlabPercentage,
         beamsSlabConstructibilityCost,
         netEnvelopePercentage,
         envelopeConstructibilityCost,
         MEPPercentage,
         MEPConstructibilityCost,
         netColumnPercentage,
         columnConstructibilityCost,
         netFoundationPercentage,
         isGroundParking,
         parkingCostPercentage
       );
       floorcostArr.push({ floor: i, cost: tillThatFloorCost.finalBuildingCost });
     }
     setCostByFloorData(floorcostArr);
 
     const costArr = [];
     for (let i = 1; i <= totalNumber; i++) {
       const floorRes = calculateFloorCost(
         floorCost,
         i,
         totalNumber,
         netBeamsSlabPercentage,
         beamsSlabConstructibilityCost,
         netEnvelopePercentage,
         envelopeConstructibilityCost,
         MEPPercentage,
         MEPConstructibilityCost,
         netColumnPercentage,
         columnConstructibilityCost,
         netFoundationPercentage
       );
       costArr.push({ floor: i, cost: floorRes.floorCost, floorBreakdown: floorRes.floorBreakdown });
     }
 
     const breakdownArr = costArr.map(({ floor, floorBreakdown }) => ({
       floor,
       'Beams & Slab': floorBreakdown.beamsSlabCost,
       Column: floorBreakdown.columnCost,
       Foundation: floorBreakdown.foundationCost,
       Envelope: floorBreakdown.envelopeCost,
       MEP: floorBreakdown.MEPCost,
     }));
     setBreakdownByFloorData(breakdownArr);
 
     setIsLoading(false);
   };
 
  // Calculate revenue for a single floor
   const calculateFloorRevenue = (floorNumber, totalFloors) => {
     const basePriceNum = Number(basePrice);
     const viewPremium = calculateViewPremium(
       Number(viewPercentage) / 100,
       basePriceNum,
       Number(viewBase),
       floorNumber
     );
     
     const heatPenalty = floorNumber === 1 
       ? 0 
       : calculateHeatPenalty(
           Number(maxHeatPenaltyPercentage) / 100,
           basePriceNum,
           Number(heatExponent),
           floorNumber,
           totalFloors
         );
 
     const elevatorPenalty = calculateElevatorPenalty(
       Number(elevatorPenaltyPercentage) / 100,
       basePriceNum,
       floorNumber
     );
 
     const floorRevenue = (basePriceNum + viewPremium - heatPenalty - elevatorPenalty) * Number(area);
     
     return {
       floorRevenue,
       floorBreakdown: {
         basePrice: basePriceNum * Number(area),
         viewPremium: viewPremium * Number(area),
         heatPenalty: heatPenalty * Number(area),
         elevatorPenalty: elevatorPenalty * Number(area),
       }
     };
   };
 
   // Main calculation
   const calculateRevenue = () => {
     setValidationErrorRev('');
     setIsLoadingRev(true);
     setTotalBuildingRevenue(null);
     setBuildingRevenuePerSqFeet(null);

     const totalFloors = Number(floors);
     let totalRevenue = 0;
     const revenueArr = [];
     const breakdownArr = [];

     // Calculate revenue for each floor
     for (let i = 1; i <= totalFloors; i++) {
       const result = calculateFloorRevenue(i, totalFloors);
       totalRevenue += result.floorRevenue;
       
       revenueArr.push({
         floor: i,
         revenue: result.floorRevenue,
       });

       breakdownArr.push({
         floor: i,
         Base: result.floorBreakdown.basePrice / Number(area),
         'View Premium': result.floorBreakdown.viewPremium / Number(area),
         'Heat Penalty': result.floorBreakdown.heatPenalty / Number(area),
         'Elevator Penalty': result.floorBreakdown.elevatorPenalty / Number(area),
       });
     }

     setRevenueByFloorData(revenueArr);
     setBreakdownByFloorRev(breakdownArr);
     setTotalBuildingRevenue(totalRevenue);
     setBuildingRevenuePerSqFeet(totalRevenue / (Number(area) * totalFloors));
     setIsLoadingRev(false);
   };
 

  const generateCashflow = async () => {
    if (!calculationResult || revenueByFloorData.length === 0) {
      alert('Please calculate cost and revenue first.');
      return;
    }

    setIsGeneratingCashflow(true);

    const tempCashflowData = [];
    const totalNumber = Number(floors);
    const floorCost = Number(basicCost);
    const marrDecimal = cashflowMarr / 100;
    const parkingCostPercentage = parkingPercent / 100;

    try {
      let cumulativeRevenue = 0;
      let cumulativeCost = 0;

      // Calculate revenue cashflow factor once since it's the same for all floors
      const revenueCashflowDistribution = [0.5, 0.3, 0.2]; // Year 1, 2, 3
      let revenueDiscountedSum = 0;
      for (let year = 1; year <= 3; year++) {
        revenueDiscountedSum += revenueCashflowDistribution[year - 1] / Math.pow(1 + marrDecimal, year);
      }

      for (let i = 1; i <= totalNumber; i++) {
        // Calculate built-up area and land cost for current floor
        const builtupArea = (builtupAreaSqFtPerFloor * i) / fsi;
        const landCost = builtupArea < landAreaBaseSqFt 
          ? landCostPerSqFt * landAreaBaseSqFt 
          : landCostPerSqFt * builtupArea;

        // Calculate building cost till floor i
        const buildingRes = calculateBuildingCost(
          floorCost,
          i,
          netBeamsSlabPercentage,
          beamsSlabConstructibilityCost,
          netEnvelopePercentage,
          envelopeConstructibilityCost,
          MEPPercentage,
          MEPConstructibilityCost,
          netColumnPercentage,
          columnConstructibilityCost,
          netFoundationPercentage,
          isGroundParking,
          parkingCostPercentage
        );

        // Apply S-curve distribution for construction cost
        const sCurveDistribution = [0.1, 0.2, 0.35, 0.25, 0.1]; // Year 1 to 5
        let costDiscountedSum = 0;
        for (let year = 1; year <= 5; year++) {
          costDiscountedSum += sCurveDistribution[year - 1] / Math.pow(1 + marrDecimal, year);
        }

        // Calculate discounted building cost
        const baseYear0Cost = buildingRes.finalBuildingCost * costDiscountedSum;
        
        // Add land cost and apply construction period adjustment
        const totalFloorCost = (baseYear0Cost + landCost) * Math.pow(1 + marrDecimal, cashflowConstructionPeriod);
        cumulativeCost = totalFloorCost;

        // Calculate revenue with cashflow factor
        const revenueRes = calculateFloorRevenue(i, totalNumber);
        const adjustedRevenue = revenueRes.floorRevenue * revenueDiscountedSum;
        cumulativeRevenue += adjustedRevenue;

        tempCashflowData.push({
          floor: i,
          Revenue: cumulativeRevenue,
          Cost: cumulativeCost,
          Profit: cumulativeRevenue - cumulativeCost
        });
      }

      setCashflowData(tempCashflowData);
    } catch (err) {
      console.error('Error generating cashflow data:', err);
    } finally {
      setIsGeneratingCashflow(false);
    }
  };

  return (
    <>
      <div className='calculator-page'>
        {/* --- Input Section --- */}
        <h1 className='calc-title'>Skyscraper Cost Calculator</h1>
        <p className='calc-desc'>
          Enter the required information below to calculate the estimated cost
          of your multi-story building or skyscraper. Adjust the parameters to
          match your specific project requirements.
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
            Adjust the inputs below according to the project's complexity, as
            they vary based on different architectural and user requirements.
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
                  {Number(floors)}
                  </span>
                </div>
                <div className='summary-item'>
                  <span className='summary-label'>Total Cost</span>
                  <span className='summary-value cost-value'>
                    <span className='summary-value cost-value'>
                      {Number.isFinite(calculationResult?.finalBuildingCost)
                        ? `₹${calculationResult.finalBuildingCost.toLocaleString()}`
                        : 'N/A'}
                    </span>
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
                      formatter={(value) =>
                        `₹${Number(value).toLocaleString()}`
                      }
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
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <Legend
                    verticalAlign='top'
                    align='center'
                    height={40} // make space for multi-line or wrapped entries
                    wrapperStyle={{ top: 0, left: 0, right: 0 }}
                  />
                  <XAxis
                    dataKey='floor'
                    label={{
                      value: 'Floor Number',
                      position: 'insideBottom',
                      offset: -10,
                    }}
                  />
                  <YAxis
                    tickFormatter={(value) => {
                      if (value === 0) return '₹0';
                      if (value < 1000000)
                        return `₹${(value / 1000).toFixed(0)}K`;
                      return `₹${(value / 1000000).toFixed(2)}M`;
                    }}
                  />
                  <Tooltip
                    formatter={(value) => `₹${value.toLocaleString()}`}
                  />
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
              <label className='calc-label'>
                Base Price per square feet (₹)
              </label>
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
                disabled={!!calculationResult}
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
          {breakdownByFloorRev.length > 0 && (
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
                    {(showAllRevenueRows
                      ? breakdownByFloorRev
                      : breakdownByFloorRev.slice(0, 10)
                    ).map((row) => (
                      <tr key={row.floor}>
                        <td>{row.floor}</td>
                        <td>
                          {row.Base !== undefined
                            ? row.Base.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })
                            : 'N/A'}
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

                {/* Toggle Button */}
                {breakdownByFloorRev.length > 10 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: '1.5rem',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: '1px',
                        backgroundColor: '#d1d5db',
                      }}
                    />
                    <button
                      className='show-more-btn'
                      onClick={() => setShowAllRevenueRows(!showAllRevenueRows)}
                      style={{ margin: '0 1rem' }}
                    >
                      {showAllRevenueRows ? 'Show Less' : 'Show All Floors'}
                    </button>
                    <div
                      style={{
                        flex: 1,
                        height: '1px',
                        backgroundColor: '#d1d5db',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- Cashflow Inputs Section --- */}
          <div className='calc-card' style={{ marginTop: '2rem' }}>
            <div className='calc-section-title'>Cashflow Parameters</div>
            <hr className='calc-divider' />
            <div className='calc-inputs-row'>
              <div className='calc-input-group'>
                <label className='calc-label'>MARR (%)</label>
                <input
                  type='number'
                  className='calc-input'
                  value={cashflowMarr}
                  onChange={(e) => setCashflowMarr(Number(e.target.value))}
                />
              </div>
              <div className='calc-input-group'>
                <label className='calc-label'>FSI</label>
                <input
                  type='number'
                  className='calc-input'
                  value={fsi}
                  onChange={(e) => setFsi(Number(e.target.value))}
                />
              </div>
              <div className='calc-input-group'>
                <label className='calc-label'>
                  Built-up Area per Floor (sq ft)
                </label>
                <input
                  type='number'
                  className='calc-input'
                  value={builtupAreaSqFtPerFloor}
                  onChange={(e) =>
                    setBuiltupAreaSqFtPerFloor(Number(e.target.value))
                  }
                />
              </div>
              <div className='calc-input-group'>
                <label className='calc-label'>Land Cost per sq ft (₹)</label>
                <input
                  type='number'
                  className='calc-input'
                  value={landCostPerSqFt}
                  onChange={(e) => setLandCostPerSqFt(Number(e.target.value))}
                />
              </div>
              <div className='calc-input-group'>
                <label className='calc-label'>Land Area Base (sq ft)</label>
                <input
                  type='number'
                  className='calc-input'
                  value={landAreaBaseSqFt}
                  onChange={(e) => setLandAreaBaseSqFt(Number(e.target.value))}
                />
              </div>

              <div className='calc-input-group'>
                <label className='calc-label'>
                  Construction Period (years)
                </label>
                <input
                  type='number'
                  className='calc-input'
                  value={cashflowConstructionPeriod}
                  disabled
                />
              </div>
            </div>
            <div className='calc-btn-center'>
              <button
                className='calc-btn'
                onClick={generateCashflow}
                disabled={isGeneratingCashflow}
              >
                {isGeneratingCashflow
                  ? 'Generating...'
                  : 'Generate Cashflow Graph'}
              </button>
            </div>
          </div>
          {cashflowData.length > 0 && (
            <div className='chart-card' style={{ marginTop: '2rem' }}>
              <div className='result-heading'>Revenue vs Cost by Floor</div>
              <ResponsiveContainer width='100%' height={320}>
                <LineChart
                  data={cashflowData.map((d) => ({
                    ...d,
                    Profit: d.Revenue - d.Cost, // Add Profit field for later
                  }))}
                  margin={{ top: 30, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    dataKey='floor'
                    label={{
                      value: 'Floor',
                      position: 'insideBottom',
                      offset: -5,
                      fontSize: 14,
                      fill: '#23477a',
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      value >= 1e7
                        ? `${(value / 1e7).toFixed(1)}Cr`
                        : value >= 1e5
                        ? `${(value / 1e5).toFixed(1)}L`
                        : value
                    }
                    label={{
                      value: 'INR',
                      angle: -90,
                      position: 'insideLeft',
                      offset: -5,
                      fontSize: 14,
                      fill: '#23477a',
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) =>
                      `₹${value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}`
                    }
                    labelFormatter={(label) => `Floor: ${label}`}
                  />
                  <Legend verticalAlign='top' height={36} />
                  <Line
                    type='monotone'
                    dataKey='Revenue'
                    stroke='#1E4976'
                    strokeWidth={2.5}
                    dot={false}
                    name='Revenue'
                  />
                  <Line
                    type='monotone'
                    dataKey='Cost'
                    stroke='#B91C1C'
                    strokeWidth={2.5}
                    dot={false}
                    name='Cost'
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Optimal floor display */}
              <div
                style={{
                  marginTop: '1.5rem',
                  textAlign: 'center',
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  color: '#23477a',
                }}
              >
                {(() => {
                  const dataWithProfit = cashflowData.map((d) => ({
                    ...d,
                    Profit: d.Revenue - d.Cost,
                  }));
                  const maxProfitObj = dataWithProfit.reduce(
                    (max, curr) => (curr.Profit > max.Profit ? curr : max),
                    dataWithProfit[0]
                  );
                  return `Optimal Number of Floors for Maximum Profit: ${maxProfitObj.floor}`;
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
