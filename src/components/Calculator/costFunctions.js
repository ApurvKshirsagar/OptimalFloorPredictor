export function calculateMEPCost(
  floorCost,
  floorNumber,
  MEPPercentage,
  MEPConstructibilityCost
) {
  if (floorNumber === 0) return 0;
  return (
    floorCost *
    MEPPercentage *
    Math.pow(1 + MEPConstructibilityCost, floorNumber - 1)
  );
}

export function calculateEnvelopeCost(
  floorCost,
  floorNumber,
  netenvelopePercentage,
  envelopeConstructibilityCost
) {
  if (floorNumber === 0) return 0;
  return (
    floorCost *
    netenvelopePercentage *
    Math.pow(1 + envelopeConstructibilityCost, floorNumber - 1)
  );
}

export function calculateFoundationCost(
  floorCost,
  floorNumber,
  netFoundationPercentage
) {
  return floorCost * netFoundationPercentage * floorNumber;
}

export function calculateColumnCost(
  floorCost,
  floorNumber,
  totalNumber,
  netcolumnPercentage,
  columnConstructibilityCost
) {
  if (floorNumber === 0) return 0;
  return (
    floorCost *
    netcolumnPercentage *
    (totalNumber - floorNumber + 1) *
    Math.pow(1 + columnConstructibilityCost, floorNumber - 1)
  );
}

export function calculateBeamsSlabCost(
  floorCost,
  floorNumber,
  netBeamsSlabPercentage,
  beamsSlabConstructibilityCost
) {
  if (floorNumber === 0) return 0;
  return (
    floorCost *
    netBeamsSlabPercentage *
    Math.pow(1 + beamsSlabConstructibilityCost, floorNumber - 1)
  );
}

export function calculateBuildingCost(
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
  isParkingFloor,
  parkingCostPercentage
) {
  let totalBeamsSlabCost = 0;
  let totalColumnCost = 0;
  let totalEnvelopeCost = 0;
  let totalMEPCost = 0;

  for (let i = 1; i <= totalNumber; i++) {
    totalBeamsSlabCost += calculateBeamsSlabCost(
      floorCost,
      i,
      netBeamsSlabPercentage,
      beamsSlabConstructibilityCost
    );
    totalEnvelopeCost += calculateEnvelopeCost(
      floorCost,
      i,
      netEnvelopePercentage,
      envelopeConstructibilityCost
    );
    totalMEPCost += calculateMEPCost(
      floorCost,
      i,
      MEPPercentage,
      MEPConstructibilityCost
    );
    totalColumnCost += calculateColumnCost(
      floorCost,
      totalNumber - i + 1,
      totalNumber,
      netColumnPercentage,
      columnConstructibilityCost
    );
  }

  const totalFoundationCost = calculateFoundationCost(
    floorCost,
    totalNumber,
    netFoundationPercentage
  );

  const buildingCost =
    totalBeamsSlabCost +
    totalColumnCost +
    totalFoundationCost +
    totalEnvelopeCost +
    totalMEPCost;

  const finalBuildingCost =
    isParkingFloor === false
      ? buildingCost
      : buildingCost * (1 - parkingCostPercentage) +
        floorCost *
          (parkingCostPercentage *
            (netColumnPercentage * totalNumber + (1 - netColumnPercentage)));
  return finalBuildingCost;
}

export function calculateCashflowFloorCost(
  presentWorth,
  marr = 0.15,
  constructionPeriod = 5
) {
  const sCurveDistribution = [0.1, 0.2, 0.35, 0.25, 0.1]; // Year 1 to 5

  let discountedSum = 0;
  for (let year = 1; year <= 5; year++) {
    discountedSum += sCurveDistribution[year - 1] / Math.pow(1 + marr, year);
  }

  let baseYear0Cost = presentWorth * discountedSum;
  const finalCost = baseYear0Cost * Math.pow(1 + marr, constructionPeriod);

  return finalCost;
}

export function calculateFloorLandCost({
  floorNumber,
  fsi,
  builtupAreaSqFtPerFloor,
  landCostPerSqFt,
  landAreaBaseSqFt,
  marr,
  constructionPeriod = 5,
}) {
  const builtupArea = (builtupAreaSqFtPerFloor * floorNumber) / fsi;

  let pwLandCost = 0;

  if (builtupArea < landAreaBaseSqFt) {
    pwLandCost = landCostPerSqFt * landAreaBaseSqFt;
  } else {
    pwLandCost = landCostPerSqFt * builtupArea;
  }

  return pwLandCost * Math.pow(1 + marr, constructionPeriod);
}

export function calculateFloorCost(customConfig) {
  const cfg = { ...customConfig };
  const {
    totalNumber,
    floorNumber,
    floorCost,
    civilPercentage,
    structuralPercentage,
    beamsSlabPercentage,
    columnPercentage,
    foundationPercentage,
    envelopePercentage,
    MEPPercentage,
    beamsSlabConstructibilityCost,
    columnConstructibilityCost,
    envelopeConstructibilityCost,
    MEPConstructibilityCost,
    marr,
    constructionPeriod,
    fsi,
    builtupAreaSqFtPerFloor,
    landCostPerSqFt,
    landAreaBaseSqFt,
  } = cfg;

  const netStrPct = civilPercentage * structuralPercentage;
  const netEnvPct = civilPercentage * envelopePercentage;
  const netBeamsPct = netStrPct * beamsSlabPercentage;
  const netColsPct = netStrPct * columnPercentage;
  const netFunsPct = netStrPct * foundationPercentage;

  const beamsSlabCost = calculateBeamsSlabCost(
    floorCost,
    floorNumber,
    netBeamsPct,
    beamsSlabConstructibilityCost
  );
  const columnCost = calculateColumnCost(
    floorCost,
    floorNumber,
    totalNumber,
    netColsPct,
    columnConstructibilityCost
  );
  const foundationCost = calculateFoundationCost(
    floorCost,
    totalNumber === floorNumber ? totalNumber : 0,
    netFunsPct
  );
  const envelopeCost = calculateEnvelopeCost(
    floorCost,
    floorNumber,
    netEnvPct,
    envelopeConstructibilityCost
  );
  const MEPCost = calculateMEPCost(
    floorCost,
    floorNumber,
    MEPPercentage,
    MEPConstructibilityCost
  );

  const structuralCost = beamsSlabCost + columnCost + foundationCost;
  const civilCost = structuralCost + envelopeCost;
  const floorTotalCost = civilCost + MEPCost;

  const cashflowFloorCost = calculateCashflowFloorCost(
    floorTotalCost,
    marr,
    constructionPeriod
  );
  const floorLandCost = calculateFloorLandCost({
    floorNumber,
    fsi,
    builtupAreaSqFtPerFloor,
    landCostPerSqFt,
    landAreaBaseSqFt,
    marr,
    constructionPeriod,
  });

  return {
    totalNumber,
    floorNumber,
    floorCost: floorTotalCost,
    cashflowFloorCost,
    floorLandCost,
    floorBreakdown: {
      civilCost,
      structuralCost,
      beamsSlabCost,
      columnCost,
      foundationCost,
      envelopeCost,
      MEPCost,
    },
  };
}
