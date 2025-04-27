import React from 'react';
import './CashFlow.css';

export default function CashFlow({ costByFloorData, revenueByFloorData }) {
  // Merge cost and revenue by floor
  const cashFlowData = (costByFloorData || []).map((costItem, idx) => {
    const revenueItem = (revenueByFloorData || [])[idx] || {};
    const profit = (revenueItem.revenue || 0) - (costItem.cost || 0);
    return {
      floor: costItem.floor,
      cost: costItem.cost,
      revenue: revenueItem.revenue,
      profit,
    };
  });

  // Find the floor with maximum profit
  const maxProfit = Math.max(...cashFlowData.map((d) => d.profit));
  const maxProfitFloor = cashFlowData.find((d) => d.profit === maxProfit);

  return (
    <div className='cashflow-card'>
      <div className='cashflow-title'>Cash Flow by Floor</div>
      <table className='cashflow-table'>
        <thead>
          <tr>
            <th>Floor</th>
            <th>Total Cost</th>
            <th>Total Revenue</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          {cashFlowData.map((row) => (
            <tr
              key={row.floor}
              className={
                row.floor === maxProfitFloor.floor ? 'max-profit-row' : ''
              }
            >
              <td>{row.floor}</td>
              <td>
                ₹
                {row.cost.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </td>
              <td>
                ₹
                {row.revenue.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </td>
              <td>
                {row.profit >= 0 ? '+' : '-'}₹
                {Math.abs(row.profit).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='cashflow-summary'>
        <span>
          <b>Maximum Profit:</b> Floor {maxProfitFloor.floor} (₹
          {maxProfitFloor.profit.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}
          )
        </span>
      </div>
    </div>
  );
}
