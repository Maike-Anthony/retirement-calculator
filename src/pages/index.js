import { useState, useEffect } from "react";
import { runInvestmentCalculator } from "../../utils/calculator";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Analytics } from "@vercel/analytics/next";

// Helper function to format numbers with thousand separators
const formatNumber = (num, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

// Helper function to export data as CSV - FIXED VERSION
const exportToCSV = (data, filename) => {
  // Create CSV content from the data array
  const csvContent = data.map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function App() {
  const [inputs, setInputs] = useState({
    nominalInterest: 7,
    inflationRate: 2,
    initialCapital: 10000,
    desiredMonthlyIncome: 1000,
    withdrawalRate: 4,
    taxRate: 15,
    taxOption: "1",
    periods: [{ years: 10, deposit: 200 }]
  });

  const [results, setResults] = useState(null);
  const [savedSimulations, setSavedSimulations] = useState([]);
  const [editingName, setEditingName] = useState(null);
  const [newName, setNewName] = useState("");

  // Load saved simulations from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('savedSimulations');
    if (saved) {
      setSavedSimulations(JSON.parse(saved));
    }
  }, []);

  // Save simulations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedSimulations', JSON.stringify(savedSimulations));
  }, [savedSimulations]);

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
    
    // Save this simulation to history
    const simulation = {
      id: Date.now(),
      name: `Simulation ${savedSimulations.length + 1}`,
      inputs: {...inputs},
      results: {...res},
      timestamp: new Date().toISOString()
    };
    
    setSavedSimulations([simulation, ...savedSimulations]);
  };

  const exportCurrentSimulation = () => {
  if (!results) return;
  
  // Create summary data
  const summaryData = [
    ["Parameter", "Value"],
    ["Nominal annual interest rate", `${inputs.nominalInterest}%`],
    ["Expected annual inflation rate", `${inputs.inflationRate}%`],
    ["Real annual interest rate", `${(results.realInterest * 100).toFixed(2)}%`],
    ["Initial capital", inputs.initialCapital],
    ["Desired monthly income AFTER TAX", inputs.desiredMonthlyIncome],
    ["Planned withdrawal rate", `${inputs.withdrawalRate}%`],
    ["Tax rate", `${inputs.taxRate}%`],
    ["Tax applied to", inputs.taxOption === "1" ? "Entire capital" : "Interest only"],
    ["Capital before tax", results.capital.toFixed(2)],
    ["Total deposits", results.totalDeposits.toFixed(2)],
    ["Interest earned before tax", results.interestEarned.toFixed(2)],
    ["Tax amount", results.taxAmount.toFixed(2)],
    ["Capital after tax", results.capitalAfterTax.toFixed(2)],
    ["Monthly income generated", results.monthlyIncomeAfterTax.toFixed(2)],
    ["Target met", results.monthlyIncomeAfterTax >= inputs.desiredMonthlyIncome ? "Yes" : "No"],
    [""], // Empty row
    ["Timeline Data"],
    ["Month", "Capital (before tax)", "Capital (after tax)"]
  ];
  
  // Add timeline data
  const timelineData = results.timeline.map(item => [
    item.month,
    item.capital.toFixed(2),
    item.capitalAfterTax.toFixed(2)
  ]);
  
  // Combine all data
  const allData = [...summaryData, ...timelineData];
  
  // Download
  exportToCSV(allData, `retirement_simulation_${new Date().toISOString().split('T')[0]}`);
};

const exportSavedSimulation = (simulation) => {
  // Create summary data
  const summaryData = [
    ["Parameter", "Value"],
    ["Nominal annual interest rate", `${simulation.inputs.nominalInterest}%`],
    ["Expected annual inflation rate", `${simulation.inputs.inflationRate}%`],
    ["Real annual interest rate", `${(simulation.results.realInterest * 100).toFixed(2)}%`],
    ["Initial capital", simulation.inputs.initialCapital],
    ["Desired monthly income AFTER TAX", simulation.inputs.desiredMonthlyIncome],
    ["Planned withdrawal rate", `${simulation.inputs.withdrawalRate}%`],
    ["Tax rate", `${simulation.inputs.taxRate}%`],
    ["Tax applied to", simulation.inputs.taxOption === "1" ? "Entire capital" : "Interest only"],
    ["Capital before tax", simulation.results.capital.toFixed(2)],
    ["Total deposits", simulation.results.totalDeposits.toFixed(2)],
    ["Interest earned before tax", simulation.results.interestEarned.toFixed(2)],
    ["Tax amount", simulation.results.taxAmount.toFixed(2)],
    ["Capital after tax", simulation.results.capitalAfterTax.toFixed(2)],
    ["Monthly income generated", simulation.results.monthlyIncomeAfterTax.toFixed(2)],
    ["Target met", simulation.results.monthlyIncomeAfterTax >= simulation.inputs.desiredMonthlyIncome ? "Yes" : "No"],
    [""], // Empty row
    ["Timeline Data"],
    ["Month", "Capital (before tax)", "Capital (after tax)"]
  ];
  
  // Add timeline data
  const timelineData = simulation.results.timeline.map(item => [
    item.month,
    item.capital.toFixed(2),
    item.capitalAfterTax.toFixed(2)
  ]);
  
  // Combine all data
  const allData = [...summaryData, ...timelineData];
  
  // Download
  exportToCSV(allData, `retirement_simulation_${simulation.name.replace(/\s+/g, '_')}`);
};

  const loadSimulation = (simulation) => {
    setInputs(simulation.inputs);
    setResults(simulation.results);
    window.scrollTo(0, 0);
  };

  const deleteSimulation = (id) => {
    setSavedSimulations(savedSimulations.filter(sim => sim.id !== id));
  };

  const startRenaming = (simulation) => {
    setEditingName(simulation.id);
    setNewName(simulation.name);
  };

  const saveNewName = (id) => {
    setSavedSimulations(savedSimulations.map(sim => 
      sim.id === id ? {...sim, name: newName} : sim
    ));
    setEditingName(null);
    setNewName("");
  };

  const cancelRenaming = () => {
    setEditingName(null);
    setNewName("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-bold text-blue-800 mb-8 text-center">Retirement Calculator <Analytics/></h1>

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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-blue-800">Investment Summary</h2>
              <button 
                onClick={exportCurrentSimulation}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export to CSV
              </button>
            </div>
            
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
                  <LineChart 
                    data={results.timeline}
                    margin={{ top: 20, right: 30, left: 70, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      label={{ 
                        value: 'Time (months)', 
                        position: 'insideBottom', 
                        offset: -5, 
                        style: { textAnchor: 'middle', fill: '#374151' } 
                      }}
                      interval="preserveStartEnd"
                      tickCount={10}
                    />
                    <YAxis 
                      tickFormatter={(value) => {
                        if (value >= 1000000) {
                          return `$${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                          return `$${Math.round(value / 1000)}K`;
                        }
                        return `$${value}`;
                      }}
                      label={{ 
                        value: 'Capital ($)', 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: -10,
                        style: { textAnchor: 'middle', fill: '#374151' }
                      }}
                      width={80}
                      domain={[0, (dataMax) => {
                        // Calculate a "nice" maximum value for the Y-axis
                        const maxVal = dataMax * 1.1; // Add 10% padding
                        
                        if (maxVal < 1000) {
                          return Math.ceil(maxVal / 100) * 100;
                        } else if (maxVal < 10000) {
                          return Math.ceil(maxVal / 1000) * 1000;
                        } else if (maxVal < 100000) {
                          return Math.ceil(maxVal / 10000) * 10000;
                        } else if (maxVal < 1000000) {
                          return Math.ceil(maxVal / 100000) * 100000;
                        } else {
                          // For values over 1M, round to the nearest 0.5M
                          return Math.ceil(maxVal / 500000) * 500000;
                        }
                      }]}
                      tickCount={6}
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
                    <Legend verticalAlign="top" height={36} />
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

        {/* Saved Simulations */}
        {savedSimulations.length > 0 && (
          <div className="mt-8 bg-blue-50 rounded-2xl p-8 shadow-sm border border-blue-100">
            <h2 className="text-3xl font-bold text-blue-800 mb-6 text-center">Saved Simulations</h2>
            
            <div className="space-y-4">
              {savedSimulations.map((simulation) => (
                <div key={simulation.id} className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
                  <div className="flex justify-between items-center mb-4">
                    {editingName === simulation.id ? (
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="border border-blue-200 p-2 rounded-lg mr-2 text-gray-800" // Added text-gray-800
                        />
                        <button 
                          onClick={() => saveNewName(simulation.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded-lg mr-2"
                        >
                          Save
                        </button>
                        <button 
                          onClick={cancelRenaming}
                          className="bg-gray-500 text-white px-3 py-1 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <h3 className="text-xl font-semibold text-blue-800">{simulation.name}</h3>
                    )}
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => loadSimulation(simulation)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
                      >
                        Load
                      </button>
                      <button 
                        onClick={() => exportSavedSimulation(simulation)}
                        className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
                      >
                        Export
                      </button>
                      <button 
                        onClick={() => startRenaming(simulation)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600"
                      >
                        Rename
                      </button>
                      <button 
                        onClick={() => deleteSimulation(simulation.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-2"> {/* Changed from text-gray-600 to text-gray-700 */}
                    Created: {new Date(simulation.timestamp).toLocaleString()}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-800"> {/* Added text-gray-800 */}
                    <p><span className="font-semibold">Interest:</span> {simulation.inputs.nominalInterest}%</p>
                    <p><span className="font-semibold">Inflation:</span> {simulation.inputs.inflationRate}%</p>
                    <p><span className="font-semibold">Initial Capital:</span> ${formatNumber(simulation.inputs.initialCapital, 0)}</p>
                    <p><span className="font-semibold">Monthly Income Goal:</span> ${formatNumber(simulation.inputs.desiredMonthlyIncome, 0)}</p>
                    <p><span className="font-semibold">Final Capital:</span> ${formatNumber(simulation.results.capitalAfterTax)}</p>
                    <p><span className="font-semibold">Monthly Income:</span> ${formatNumber(simulation.results.monthlyIncomeAfterTax)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}