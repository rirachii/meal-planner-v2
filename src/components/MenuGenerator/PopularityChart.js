import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardContent } from '../ui/card';

const PopularityChart = ({ data }) => {
  console.log('PopularityChart received data:', data);

  if (!data) {
    console.log('Data is undefined or null');
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No data available. Please upload a spreadsheet.</p>
      </div>
    );
  }

  if (!Array.isArray(data)) {
    console.error('Data is not an array:', typeof data);
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Invalid data format. Please try again.</p>
      </div>
    );
  }

  if (data.length === 0) {
    console.log('Data array is empty');
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Upload a spreadsheet to see meal popularity data</p>
      </div>
    );
  }

  const colors = {
    breakfast: "#ffa726",
    lunch: "#66bb6a",
    dinner: "#42a5f5"
  };

  return (
    <div className="space-y-6">
      {data.map(({ type, meals }) => (
        <Card key={type}>
          <CardHeader>
            <h3 className="text-xl font-semibold capitalize">{type} - Most Popular Meals</h3>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-x-auto">
              <div className="min-w-[800px] h-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={meals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={45} 
                    textAnchor="start" 
                    height={100}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill={colors[type]} 
                    name={`${type} meals`}
                  />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PopularityChart;