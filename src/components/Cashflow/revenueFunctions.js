export function calculateViewPremium(
  viewPercentage,
  basePrice,
  viewBase,
  floorNumber
) {
  return (
    (basePrice * viewPercentage * Math.log(floorNumber)) / Math.log(viewBase)
  );
}

export function calculateHeatPenalty(
  maxHeatPenaltyPercentage,
  basePrice,
  heatExponent,
  floorNumber,
  totalNumber
) {
  const heatRatio = floorNumber / totalNumber;
  const baseHeatPenalty =
    basePrice * maxHeatPenaltyPercentage * Math.pow(totalNumber / 10, 0.5);
  return baseHeatPenalty * Math.pow(heatRatio, heatExponent);
}

export function calculateElevatorPenalty(
  elevatorPenaltyPercentage,
  basePrice,
  floorNumber
) {
  return basePrice * (floorNumber - 1) * elevatorPenaltyPercentage;
}

export function calculateCashflowRevenue(floorRevenue, marr = 0.2) {
  const cashflowDistribution = [0.5, 0.3, 0.2]; // Year 1, 2, 3

  let discountedSum = 0;
  for (let year = 1; year <= 3; year++) {
    discountedSum += cashflowDistribution[year - 1] / Math.pow(1 + marr, year);
  }

  return floorRevenue * discountedSum;
} 