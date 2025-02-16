import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const PopularityChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Upload a spreadsheet to see meal popularity data</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-xl font-semibold">Most Popular Meals</h3>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
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
              <Legend />
              <Bar 
                dataKey="count" 
                fill="#8884d8" 
                name="Times Requested"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PopularityChart;