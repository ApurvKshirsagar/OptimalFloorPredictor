// Cashflow.jsx
import React, { useState } from 'react';
import './Cashflow.css';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = ['#2196F3', '#4CAF50', '#FFC107', '#FF9800', '#9C27B0'];
const COMPONENT_KEYS = [
  { key: 'totalBeamsSlabCost', label: 'Beams & Slab' },
  { key: 'totalColumnCost', label: 'Column' },
  { key: 'totalFoundationCost', label: 'Foundation' },
  { key: 'totalEnvelopeCost', label: 'Envelope' },
  { key: 'totalMEPCost', label: 'MEP' },
];

export default function Cashflow() {
  // === Shared State ===
  const [floors, setFloors] = useState('10');

  // === Cost Form States ===
  const [basicCost, setBasicCost] = useState('7000000');
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
  const [validationErrorCost, setValidationErrorCost] = useState('');
  const [isLoadingCost, setIsLoadingCost] = useState(false);

  // === Cost Results ===
  const [calculationResult, setCalculationResult] = useState(null);
  const [componentPieData, setComponentPieData] = useState([]);
  const [costByFloorData, setCostByFloorData] = useState([]);
  const [breakdownByFloorData, setBreakdownByFloorData] = useState([]);

  // === Revenue Form States ===
  const [basePrice, setBasePrice] = useState('70000');
  const [viewPercentage, setViewPercentage] = useState(10);
  const [viewBase, setViewBase] = useState(10);
  const [maxHeatPenaltyPercentage, setMaxHeatPenaltyPercentage] = useState(3);
  const [heatExponent, setHeatExponent] = useState(3);
  const [elevatorPenaltyPercentage, setElevatorPenaltyPercentage] =
    useState(0.25);
  const [area, setArea] = useState(3560);
  const [validationErrorRev, setValidationErrorRev] = useState('');
  const [isLoadingRev, setIsLoadingRev] = useState(false);

  // === Revenue Results ===
  const [revenueByFloorData, setRevenueByFloorData] = useState([]);
  const [breakdownRevData, setBreakdownRevData] = useState([]);
  const [totalBuildingRevenue, setTotalBuildingRevenue] = useState(null);
  const [buildingRevenuePerSqFeet, setBuildingRevenuePerSqFeet] =
    useState(null);

  // ===== Shared Helpers =====
  // Ensure beams+column+foundation = 100%
  const validateStructural = () => {
    const sum = ['beams', 'column', 'foundation']
      .map((id) => params.find((p) => p.id === id).percent)
      .reduce((a, b) => a + b, 0);
    return Math.abs(sum - 100) < 0.5;
  };
  const structuralSum = () =>
    ['beams', 'column', 'foundation']
      .map((id) => params.find((p) => p.id === id).percent)
      .reduce((a, b) => a + b, 0);

  // Slider sync for cost params
  const handleParamChange = (id, newVal) => {
    const updated = params.map((p) => ({ ...p }));
    const i = updated.findIndex((p) => p.id === id);
    updated[i].percent = Number(newVal);
    // mirror pairs
    if (id === 'civil')
      updated.find((p) => p.id === 'mep').percent = 100 - updated[i].percent;
    if (id === 'mep')
      updated.find((p) => p.id === 'civil').percent = 100 - updated[i].percent;
    if (id === 'structural')
      updated.find((p) => p.id === 'envelope').percent =
        100 - updated[i].percent;
    if (id === 'envelope')
      updated.find((p) => p.id === 'structural').percent =
        100 - updated[i].percent;
    setParams(updated);
    setValidationErrorCost('');
  };

  // ===== Cost Calculation =====
  async function calculateCost() {
    if (!validateStructural()) {
      setValidationErrorCost('Beams+Column+Foundation must sum to 100%.');
      return;
    }
    setIsLoadingCost(true);
    setValidationErrorCost('');
    try {
      // build payload
      const req = {
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
        envelopePercentage:
          params.find((p) => p.id === 'envelope').percent / 100,
        MEPPercentage: params.find((p) => p.id === 'mep').percent / 100,
      };
      // 1. total cost & breakdown
      const main = await fetch('http://localhost:3000/totalcost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      }).then((r) => r.json());
      setCalculationResult(main);
      // pie
      setComponentPieData(
        COMPONENT_KEYS.map((c, i) => ({
          name: c.label,
          value: main.breakdown[c.key],
          color: PIE_COLORS[i],
        }))
      );
      // cost by floor
      const costArr = [];
      for (let i = 1; i <= Number(floors); i++) {
        const d = await fetch('http://localhost:3000/totalcost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...req, totalNumber: i }),
        }).then((r) => r.json());
        costArr.push({ floor: i, cost: d.finalBuildingCost });
      }
      setCostByFloorData(costArr);
      // breakdown by floor
      const brk = [];
      for (let i = 1; i <= Number(floors); i++) {
        const d = await fetch('http://localhost:3000/floorcost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...req,
            totalNumber: Number(floors),
            floorNumber: i,
          }),
        }).then((r) => r.json());
        brk.push({
          floor: i,
          'Beams & Slab': d.floorBreakdown.beamsSlabCost,
          Column: d.floorBreakdown.columnCost,
          Foundation: d.floorBreakdown.foundationCost,
          Envelope: d.floorBreakdown.envelopeCost,
          MEP: d.floorBreakdown.MEPCost,
        });
      }
      setBreakdownByFloorData(brk);
    } catch (e) {
      setValidationErrorCost('Error calculating cost.');
    } finally {
      setIsLoadingCost(false);
    }
  }

  // ===== Revenue Calculation =====
  async function calculateRevenue() {
    setIsLoadingRev(true);
    setValidationErrorRev('');
    setTotalBuildingRevenue(null);
    try {
      const req = {
        basePrice: Number(basePrice),
        viewPercentage: viewPercentage / 100,
        viewBase: Number(viewBase),
        maxHeatPenaltyPercentage: maxHeatPenaltyPercentage / 100,
        heatExponent: Number(heatExponent),
        elevatorPenaltyPercentage: elevatorPenaltyPercentage / 100,
        area: Number(area),
      };
      // first floor drives totals
      const first = await fetch('http://localhost:3000/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...req,
          totalNumber: Number(floors),
          floorNumber: 1,
        }),
      }).then((r) => r.json());
      setTotalBuildingRevenue(first.buildingRevenue);
      setBuildingRevenuePerSqFeet(first.buildingRevenuePerSqFeet);
      // revenue by floor
      const revArr = [];
      for (let i = 1; i <= Number(floors); i++) {
        const d = await fetch('http://localhost:3000/revenue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...req,
            totalNumber: Number(floors),
            floorNumber: i,
          }),
        }).then((r) => r.json());
        revArr.push({ floor: i, revenue: d.floorRevenue });
      }
      setRevenueByFloorData(revArr);
      // breakdown rev per floor
      const br = [];
      for (let i = 1; i <= Number(floors); i++) {
        const d = await fetch('http://localhost:3000/revenue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...req,
            totalNumber: Number(floors),
            floorNumber: i,
          }),
        }).then((r) => r.json());
        br.push({
          floor: i,
          Base: d.floorBreakdown.basePrice,
          'View Premium': d.floorBreakdown.viewPremium,
          'Heat Penalty': Math.abs(d.floorBreakdown.heatPenalty),
          'Elevator Penalty': Math.abs(d.floorBreakdown.elevatorPenalty),
        });
      }
      setBreakdownRevData(br);
    } catch (e) {
      setValidationErrorRev('Error calculating revenue.');
    } finally {
      setIsLoadingRev(false);
    }
  }

  // ===== Rendering =====
  return (
    <div className='cashflow-page'>
      {/* ==== COST SECTION ==== */}
      <div className='section-card'>
        <h1 className='section-title'>Cost Calculator</h1>
        <div className='input-row'>
          <div className='input-group'>
            <label>Basic Floor Cost (₹)</label>
            <input
              type='number'
              value={basicCost}
              onChange={(e) => setBasicCost(e.target.value)}
            />
          </div>
          <div className='input-group'>
            <label>Floors</label>
            <input
              type='number'
              value={floors}
              onChange={(e) => setFloors(e.target.value)}
            />
          </div>
        </div>
        <div className='toggle-row'>
          <label>
            <input
              type='checkbox'
              checked={isGroundParking}
              onChange={(e) => setIsGroundParking(e.target.checked)}
            />
            Ground Parking?
          </label>
          {isGroundParking && (
            <div className='slider-group'>
              <label>Parking %: {parkingPercent}%</label>
              <input
                type='range'
                min='0'
                max='100'
                value={parkingPercent}
                onChange={(e) => setParkingPercent(Number(e.target.value))}
              />
            </div>
          )}
        </div>
        <table className='params-table'>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Component</th>
              <th>%</th>
              <th>Adjust</th>
            </tr>
          </thead>
          <tbody>
            {params.map((p) => (
              <tr key={p.id} className={p.depth === 1 ? 'highlight' : ''}>
                <td>{p.sn}</td>
                <td style={{ paddingLeft: p.depth * 16 }}>{p.label}</td>
                <td>{p.percent}%</td>
                <td>
                  <input
                    type='range'
                    min='0'
                    max='100'
                    value={p.percent}
                    onChange={(e) => handleParamChange(p.id, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className='sum-row'>
          <span>Structural Sum:</span>
          <span className={validateStructural() ? 'good' : 'bad'}>
            {structuralSum().toFixed(1)}%
          </span>
          {!validateStructural() && <span className='hint'>(needs 100%)</span>}
        </div>
        {validationErrorCost && (
          <div className='error'>{validationErrorCost}</div>
        )}
        <button
          className='btn'
          onClick={calculateCost}
          disabled={isLoadingCost}
        >
          {isLoadingCost ? 'Calculating...' : 'Calculate Cost'}
        </button>

        {calculationResult && (
          <div className='results'>
            <div className='summary-card'>
              <div>
                <strong>Floors:</strong> {calculationResult.totalNumber}
              </div>
              <div>
                <strong>Total Cost:</strong> ₹
                {calculationResult.finalBuildingCost.toLocaleString()}
              </div>
            </div>
            <div className='charts-row'>
              <div className='chart-card'>
                <h3>Cost by Component</h3>
                <ResponsiveContainer width='100%' height={250}>
                  <PieChart>
                    <Pie
                      data={componentPieData}
                      dataKey='value'
                      nameKey='name'
                      outerRadius={80}
                    >
                      {componentPieData.map((c, i) => (
                        <Cell key={i} fill={c.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <ChartTooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className='chart-card'>
                <h3>Cost by Floor</h3>
                <ResponsiveContainer width='100%' height={250}>
                  <BarChart data={costByFloorData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='floor' />
                    <YAxis tickFormatter={(v) => `₹${(v / 1e6).toFixed(1)}M`} />
                    <ChartTooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                    <Bar dataKey='cost' fill='#1E4976' />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className='full-chart'>
              <h3>Breakdown by Floor</h3>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={breakdownByFloorData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='floor' />
                  <YAxis
                    tickFormatter={(v) =>
                      v < 1e6
                        ? `₹${(v / 1e3).toFixed(0)}K`
                        : `₹${(v / 1e6).toFixed(2)}M`
                    }
                  />
                  <ChartTooltip formatter={(v) => `₹${v.toLocaleString()}`} />
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

      {/* ==== REVENUE SECTION ==== */}
      <div className='section-card' style={{ marginTop: 40 }}>
        <h1 className='section-title'>Revenue Calculator</h1>
        <div className='input-row'>
          <div className='input-group'>
            <label>Base Price (₹/sqft)</label>
            <input
              type='number'
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </div>
          <div className='input-group'>
            <label>Floors</label>
            <input
              type='number'
              value={floors}
              onChange={(e) => setFloors(e.target.value)}
            />
          </div>
          <div className='input-group'>
            <label>View Premium (%)</label>
            <input
              type='number'
              value={viewPercentage}
              onChange={(e) => setViewPercentage(e.target.value)}
            />
          </div>
          <div className='input-group'>
            <label>View Base (floor)</label>
            <input
              type='number'
              value={viewBase}
              onChange={(e) => setViewBase(e.target.value)}
            />
          </div>
          <div className='input-group'>
            <label>Max Heat Penalty (%)</label>
            <input
              type='number'
              value={maxHeatPenaltyPercentage}
              onChange={(e) => setMaxHeatPenaltyPercentage(e.target.value)}
            />
          </div>
          <div className='input-group'>
            <label>Heat Exponent</label>
            <input
              type='number'
              value={heatExponent}
              onChange={(e) => setHeatExponent(e.target.value)}
            />
          </div>
          <div className='input-group'>
            <label>Elevator Penalty (%)</label>
            <input
              type='number'
              value={elevatorPenaltyPercentage}
              onChange={(e) => setElevatorPenaltyPercentage(e.target.value)}
            />
          </div>
          <div className='input-group'>
            <label>Area (sqft)</label>
            <input
              type='number'
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </div>
        </div>
        {validationErrorRev && (
          <div className='error'>{validationErrorRev}</div>
        )}
        <button
          className='btn'
          onClick={calculateRevenue}
          disabled={isLoadingRev}
        >
          {isLoadingRev ? 'Calculating...' : 'Calculate Revenue'}
        </button>

        {totalBuildingRevenue !== null && (
          <div className='results'>
            <div className='summary-card rev-summary'>
              <div>
                <strong>Total Revenue:</strong> ₹
                {totalBuildingRevenue.toLocaleString()}
              </div>
              <div>
                <strong>Per sqft:</strong> ₹
                {buildingRevenuePerSqFeet.toLocaleString()}
              </div>
            </div>
            <div className='chart-card'>
              <h3>Revenue by Floor</h3>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={revenueByFloorData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='floor' />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 1e7
                        ? `${(v / 1e7).toFixed(1)}Cr`
                        : v >= 1e5
                        ? `${(v / 1e5).toFixed(1)}L`
                        : v >= 1e3
                        ? `${(v / 1e3).toFixed(1)}K`
                        : v
                    }
                  />
                  <ChartTooltip
                    formatter={(v) => v.toLocaleString()}
                    labelFormatter={(l) => `Floor ${l}`}
                  />
                  <Legend verticalAlign='top' />
                  <Bar dataKey='revenue' fill='#23477a' name='Floor Revenue' />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className='full-table'>
              <h3>Floor Revenue Breakdown (₹/sqft)</h3>
              <div className='table-wrap'>
                <table className='params-table'>
                  <thead>
                    <tr>
                      <th>Floor</th>
                      <th>Base</th>
                      <th>View</th>
                      <th>Heat Penalty</th>
                      <th>Elevator Penalty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownRevData.map((r) => (
                      <tr key={r.floor}>
                        <td>{r.floor}</td>
                        <td>{r.Base.toLocaleString()}</td>
                        <td>{r['View Premium'].toLocaleString()}</td>
                        <td>{r['Heat Penalty'].toLocaleString()}</td>
                        <td>{r['Elevator Penalty'].toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
