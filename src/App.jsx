import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Home from './components/Home/Home';
import Footer from './components/Footer/Footer';
import Calculator from './components/Calculator/Calculator';
import Revenue from './components/Revenue/Revenue';
import CashFlow from './components/Cashflow/Cashflow';
import './App.css';

function App() {
  const [buildingCost, setBuildingCost] = useState(null);
  const [buildingRevenue, setBuildingRevenue] = useState(null);
  const [costByFloorData, setCostByFloorData] = useState([]);
  const [revenueByFloorData, setRevenueByFloorData] = useState([]);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route
          path='/calculator'
          element={
            <Calculator
              onCalculate={(result, costData) => {
                setBuildingCost(result?.finalBuildingCost);
                setCostByFloorData(costData);
              }}
            />
          }
        />
        <Route
          path='/revenue'
          element={
            <Revenue
              onCalculate={(revenue, revenueData) => {
                setBuildingRevenue(revenue);
                setRevenueByFloorData(revenueData);
              }}
            />
          }
        />
        <Route
          path='/cashflow'
          element={
            <CashFlow
              buildingCost={buildingCost}
              buildingRevenue={buildingRevenue}
              costByFloorData={costByFloorData}
              revenueByFloorData={revenueByFloorData}
            />
          }
        />
        <Route
          path='/about'
          element={<div className='about-container'>About Us Page</div>}
        />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
