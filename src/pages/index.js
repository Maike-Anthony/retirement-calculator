import { useState } from "react";
import { runInvestmentCalculator } from "../../utils/calculator";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Helper function to format numbers with thousand separators
const formatNumber = (num, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

export default function App() {
  const [inputs, setInputs] = useState({
    nominalInterest: 7,        // Changed from 0.07 to 7 (percentage)
    inflationRate: 2,          // Changed from 0.02 to 2 (percentage)
    initialCapital: 10000,
    desiredMonthlyIncome: 1000,
    withdrawalRate: 4,         // Changed from 0.04 to 4 (percentage)
    taxRate: 15,               // Changed from 0.15 to 15 (percentage)
    taxOption: "1",
    periods: [{ years: 10, deposit: 200 }]
  });

  const [results, setResults] = useState(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputs({ ...inputs, [e.target.name]: value });
  };

  const handlePeriodChange = (index, field, value) => {
    const updated = [...inputs.periods];
    updated[index][field] = value;
    setInputs({ ...inputs, periods: updated });
  };

  const addPeriod = () => setInputs({ ...inputs, periods: [...inputs.periods, { years: 5, deposit: 100 }] });
  const removePeriod = (index) => setInputs({ ...inputs, periods: inputs.periods.filter((_, i) => i !== index) });

  const calculate = () => {
    // Convert percentage inputs to decimals for calculation
    const res = runInvestmentCalculator({
      ...inputs,
      nominalInterest: parseFloat(inputs.nominalInterest) / 100,
      inflationRate: parseFloat(inputs.inflationRate) / 100,
      initialCapital: parseFloat(inputs.initialCapital),
      desiredMonthlyIncome: parseFloat(inputs.desiredMonthlyIncome),
      withdrawalRate: parseFloat(inputs.withdrawalRate) / 100,
      taxRate: parseFloat(inputs.taxRate) / 100,
      periods: inputs.periods.map(p => ({
        years: parseInt(p.years),
        deposit: parseFloat(p.deposit)
      }))
    });
    setResults(res);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-bold text-blue-800 mb-8 text-center">Retirement Calculator</h1>

        {/* Two-column inputs */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {[
            { label: "Nominal annual interest rate (%)", name: "nominalInterest", step: "0.01" },
            { label: "Expected annual inflation rate (%)", name: "inflationRate", step: "0.01" },
            { label: "Initial capital ($)", name: "initialCapital", step: "1" },
            { label: "Desired monthly income AFTER TAX ($)", name: "desiredMonthlyIncome", step: "1" },
            { label: "Planned annual withdrawal rate (%)", name: "withdrawalRate", step: "0.01" },
            { label: "Tax rate (%)", name: "taxRate", step: "0.01" }
          ].map((item, index) => (
            <div key={index} className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
              <label className="block font-semibold mb-2 text-blue-800">{item.label}</label>
              <input 
                type="number" 
                step={item.step}
                name={item.name} 
                value={inputs[item.name]}
                onChange={handleChange} 
                className="border border-blue-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800" 
              />
            </div>
          ))}
          
          <div className="md:col-span-2 bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
            <label className="block font-semibold mb-2 text-blue-800">Tax applied to:</label>
            <select 
              name="taxOption" 
              value={inputs.taxOption} 
              onChange={handleChange}
              className="border border-blue-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800"
            >
              <option value="1">Entire capital</option>
              <option value="2">Interest only</option>
            </select>
          </div>
        </div>

        {/* Periods */}
        <div className="bg-blue-50 rounded-xl p-6 mb-8 shadow-sm border border-blue-100">
          <h2 className="text-2xl font-semibold text-blue-800 mb-6">Investment Periods</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {inputs.periods.map((p, i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-blue-100 flex flex-col gap-4">
                <div>
                  <label className="font-semibold mb-2 text-blue-800">Years</label>
                  <input 
                    type="number" 
                    value={p.years}
                    onChange={(e) => handlePeriodChange(i, "years", e.target.value)}
                    className="border border-blue-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800" 
                  />
                </div>
                <div>
                  <label className="font-semibold mb-2 text-blue-800">Monthly deposit ($)</label>
                  <input 
                    type="number" 
                    value={p.deposit}
                    onChange={(e) => handlePeriodChange(i, "deposit", e.target.value)}
                    className="border border-blue-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800" 
                  />
                </div>
                <button 
                  onClick={() => removePeriod(i)}
                  className="bg-red-500 text-white py-2 rounded-xl mt-2 hover:bg-red-600 transition-colors shadow-md"
                >
                  Remove Period
                </button>
              </div>
            ))}
          </div>
          
          <button 
            onClick={addPeriod} 
            className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center mx-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Period
          </button>
        </div>

        {/* Calculate button */}
        <button 
          onClick={calculate} 
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl w-full mb-8 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg text-xl font-semibold"
        >
          Calculate Results
        </button>

        {/* Results */}
        {results && (
          <div className="bg-blue-50 rounded-2xl p-8 shadow-sm border border-blue-100">
            <h2 className="text-3xl font-bold mb-6 text-blue-800 text-center">Investment Summary</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                `Nominal annual interest rate: ${inputs.nominalInterest}%`,
                `Expected annual inflation rate: ${inputs.inflationRate}%`,
                `Real annual interest rate (after inflation): ${(results.realInterest * 100).toFixed(2)}%`,
                `Initial capital: $${formatNumber(inputs.initialCapital, 0)}`,
                `Desired monthly income AFTER TAX: $${formatNumber(inputs.desiredMonthlyIncome, 0)}`,
                `Planned withdrawal rate: ${inputs.withdrawalRate}%`,
                `Tax rate: ${inputs.taxRate}%`,
                `Tax applied to: ${inputs.taxOption === "1" ? "Entire capital" : "Interest only"}`
              ].map((text, index) => (
                <div key={index} className="bg-white p-4 rounded-xl shadow-sm">
                  <p className="text-gray-900 font-medium">{text}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-blue-800 mt-6 mb-4">Periods</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {results.periods.map((p, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm">
                  <p className="text-gray-900 font-medium">Period {i+1}: ${formatNumber(p.deposit, 0)} per month for {p.years} years</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-blue-800 mt-6 mb-4">Final Results</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                `Capital before tax: $${formatNumber(results.capital)}`,
                `Total deposits: $${formatNumber(results.totalDeposits)}`,
                `Interest earned before tax: $${formatNumber(results.interestEarned)}`,
                `Tax amount: $${formatNumber(results.taxAmount)}`,
                `Capital after tax: $${formatNumber(results.capitalAfterTax)}`,
                `Monthly income generated by after-tax capital: $${formatNumber(results.monthlyIncomeAfterTax)}`
              ].map((text, index) => (
                <div key={index} className="bg-white p-4 rounded-xl shadow-sm">
                  <p className="text-gray-900 font-medium">{text}</p>
                </div>
              ))}
            </div>
            
            {results.monthlyIncomeAfterTax >= inputs.desiredMonthlyIncome ? (
              <div className="bg-green-100 border border-green-300 p-5 rounded-xl mt-6 text-center">
                <p className="text-green-900 font-bold text-xl">
                  ✅ SUCCESS: Target met! {results.riseYears !== null && `Achieved after ${results.riseYears} years and ${results.riseMonths} months.`}
                </p>
              </div>
            ) : (
              <div className="bg-red-100 border border-red-300 p-5 rounded-xl mt-6 text-center">
                <p className="text-red-900 font-bold text-xl">
                  ❌ SHORTFALL: Target not met.
                </p>
              </div>
            )}

            <h3 className="text-xl font-semibold text-blue-800 mt-8 mb-6 text-center">Capital Growth Over Time</h3>
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <div style={{ width: "100%", height: 350 }}>
                <ResponsiveContainer>
                  <LineChart data={results.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => `$${formatNumber(value, 0)}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${formatNumber(value, 2)}`, undefined]}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '2px solid #bfdbfe',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        color: '#1a202c'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="capital" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      name="Capital (before tax)" 
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="capitalAfterTax" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      name="Capital (after tax)" 
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}