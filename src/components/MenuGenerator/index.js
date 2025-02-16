import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    loadMealData().then(({ mealData, instructionsData }) => {
      setMeals(mealData);
      setInstructions(instructionsData);
    });
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const { homes, popularityData } = await processMasterSpreadsheet(file);
    setHomes(homes);
    setPopularityData(popularityData);
  };

  return (
    <div className="p-4">
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-2xl font-bold">Menu Generator Portal</h2>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            onChange={handleFileUpload}
            accept=".xlsx,.xls"
            className="mb-4"
          />
          
          {homes.length > 0 && (
            <select
              value={selectedHome?.id || ''}
              onChange={(e) => setSelectedHome(homes.find(h => h.id === e.target.value))}
              className="mb-4 p-2 border rounded"
            >
              <option value="">Select a Home</option>
              {homes.map(home => (
                <option key={home.id} value={home.id}>
                  {home.name} ({home.residents} residents)
                </option>
              ))}
            </select>
          )}
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