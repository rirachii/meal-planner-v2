import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import MealPlanner from './MealPlanner';
import PopularityChart from './PopularityChart';
import ListGenerator from './ListGenerator';
import { processMasterSpreadsheet, loadMealData } from './utils';

const MenuGenerator = () => {
  const [meals, setMeals] = useState({ breakfast: [], lunch: [], dinner: [] });
  const [instructions, setInstructions] = useState({});
  const [homes, setHomes] = useState([]);
  const [selectedHome, setSelectedHome] = useState(null);
  const [homeMenus, setHomeMenus] = useState({});
  const [popularityData, setPopularityData] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [prepList, setPrepList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMealData().then(({ mealData, instructionsData }) => {
      setMeals(mealData);
      setInstructions(instructionsData);
      // console.log(instructionsData)
    });
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Processing file:', file.name);
    try {
      const { homes, popularityData } = await processMasterSpreadsheet(file);
      console.log('Processed spreadsheet data:', { homes, popularityData });

      if (homes.length === 0) {
        console.error('No valid data found in the Excel file.');
        setError('No valid data found in the Excel file.');
        return;
      }

      setHomes(homes);
      setPopularityData(popularityData);
      console.log('Updated state with new data');
    } catch (error) {
      console.error('Error processing Excel file:', error);
      setError('Error processing Excel file: ' + error.message);
    }
  };

  return (
    <div className="p-4">
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-2xl font-bold">Menu Generator Portal</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Input
              type="file"
              onChange={handleFileUpload}
              accept=".xlsx,.xls"
              className="mb-4"
            />
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
          {homes.length > 0 && (
            <select
              value={selectedHome?.home_id || ''}
              onChange={(e) => {
                const selectedHome = homes.find(h => h.home_id === e.target.value);
                console.log('Selected home:', selectedHome);
                setSelectedHome(selectedHome);
              }}
              className="mb-4 p-2 border rounded"
            >
              <option key="default" value="">Select a Home</option>
              {homes.map(home => (
                <option key={home.home_id} value={home.home_id}>
                  {home.home_id} ({home.residents} residents)
                </option>
              ))}
            </select>
          )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="menus" className="space-y-4">
        <TabsList>
          <TabsTrigger value="menus">Menu Planning</TabsTrigger>
          <TabsTrigger value="popularity">Meal Popularity</TabsTrigger>
          <TabsTrigger value="lists">Shopping & Prep Lists</TabsTrigger>
        </TabsList>

        <TabsContent value="menus">
          <MealPlanner
            meals={meals}
            selectedHome={selectedHome}
            homeMenus={homeMenus}
            setHomeMenus={setHomeMenus}
          />
        </TabsContent>

        <TabsContent value="popularity">
          <PopularityChart data={popularityData} />
        </TabsContent>

        <TabsContent value="lists">
          <ListGenerator
            homeMenus={homeMenus}
            instructions={instructions}
            selectedHome={selectedHome}
            shoppingList={shoppingList}
            prepList={prepList}
            setShoppingList={setShoppingList}
            setPrepList={setPrepList}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MenuGenerator;