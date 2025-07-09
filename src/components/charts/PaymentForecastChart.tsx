
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PaymentForecastChart = () => {
  const data = [
    {
      month: 'Jun 2024',
      forecast: 4500000,
      collected: 3200000,
    },
    {
      month: 'Jul 2024',
      forecast: 5800000,
      collected: 4100000,
    },
    {
      month: 'Aug 2024',
      forecast: 6200000,
      collected: 5500000,
    },
    {
      month: 'Sep 2024',
      forecast: 3400000,
      collected: 1200000,
    },
    {
      month: 'Oct 2024',
      forecast: 5200000,
      collected: 0,
    },
    {
      month: 'Nov 2024',
      forecast: 4800000,
      collected: 0,
    },
  ];

  const formatCurrency = (value: number) => {
    return `$${(value / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Payment Forecast</h2>
        <p className="text-sm text-gray-600">Monthly forecast vs actual collections</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Bar 
              dataKey="forecast" 
              name="Forecast" 
              fill="#93c5fd" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="collected" 
              name="Collected" 
              fill="#1e40af" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">Open Forecasted</p>
          <p className="text-xl font-bold text-gray-900">$2,010,145</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Past Predicted</p>
          <p className="text-xl font-bold text-gray-900">$346,257</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentForecastChart;
