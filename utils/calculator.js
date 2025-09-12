export function runInvestmentCalculator({
  nominalInterest,
  inflationRate,
  initialCapital,
  desiredMonthlyIncome,
  withdrawalRate,
  taxRate,
  taxOption,
  periods
}) {
  const realInterest = (1 + nominalInterest) / (1 + inflationRate) - 1;
  const monthlyInterest = Math.pow(1 + realInterest, 1 / 12) - 1;

  let capital = initialCapital;
  let totalDepositsSoFar = initialCapital;
  let riseYears = null;
  let riseMonths = null;
  const timeline = [];

  const totalMonths = periods.reduce((acc, p) => acc + p.years * 12, 0);
  const riseNumber = desiredMonthlyIncome * 12 / (withdrawalRate * (1 - taxRate));

  let i = 0;
  let currentPeriod = 0;
  let monthsInCurrentPeriod = 0;

  while (i < totalMonths) {
    if (monthsInCurrentPeriod >= periods[currentPeriod].years * 12) {
      currentPeriod++;
      monthsInCurrentPeriod = 0;
    }

    // deposit
    capital += periods[currentPeriod].deposit;
    totalDepositsSoFar += periods[currentPeriod].deposit;

    // apply interest
    capital *= (1 + monthlyInterest);

    i++;
    monthsInCurrentPeriod++;

    // after-tax calculation
    let capitalAfterTax;
    if (taxOption === "1") {
      capitalAfterTax = capital * (1 - taxRate);
    } else {
      const interestEarned = capital - totalDepositsSoFar;
      capitalAfterTax = totalDepositsSoFar + interestEarned * (1 - taxRate);
    }

    if (capitalAfterTax >= riseNumber && riseYears === null) {
      riseYears = Math.floor(i / 12);
      riseMonths = i % 12;
    }

    timeline.push({
      month: i,
      capital,
      capitalAfterTax
    });
  }

  const totalDeposits = initialCapital + periods.reduce((sum, p) => sum + p.deposit * (p.years * 12), 0);
  const interestEarned = capital - totalDeposits;
  const taxAmount = taxOption === "1" ? capital * taxRate : interestEarned * taxRate;
  const capitalAfterTax = capital - taxAmount;
  const monthlyIncomeAfterTax = (capitalAfterTax * withdrawalRate) / 12;

  return {
    realInterest,
    capital,
    totalDeposits,
    interestEarned,
    taxAmount,
    capitalAfterTax,
    monthlyIncomeAfterTax,
    riseYears,
    riseMonths,
    timeline,
    periods
  };
}