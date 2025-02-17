import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { generateMenuPDF } from './utils';

const MealPlanner = ({ meals, selectedHome, homeMenus, setHomeMenus }) => {
  const [servingSizes, setServingSizes] = React.useState({});
  const [filteredMeals, setFilteredMeals] = React.useState({ breakfast: [], lunch: [], dinner: [] });
  const [leftovers, setLeftovers] = React.useState({});

  React.useEffect(() => {
    if (selectedHome) {
      const filtered = {
        breakfast: meals.breakfast
          .filter(meal => selectedHome.breakfast_preferences?.split(',').includes(meal.id))
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0)),
        lunch: meals.lunch
          .filter(meal => selectedHome.lunch_preferences?.split(',').includes(meal.id))
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0)),
        dinner: meals.dinner
          .filter(meal => selectedHome.dinner_preferences?.split(',').includes(meal.id))
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      };
      setFilteredMeals(filtered);

      // Auto-allocate meals if no meals are currently set
      const currentHomeMenus = homeMenus[selectedHome.id];
      if (!currentHomeMenus || !Object.keys(currentHomeMenus).length) {
        const newHomeMenus = { ...homeMenus };
        newHomeMenus[selectedHome.id] = Array(4).fill(null).map(() =>
          Array(7).fill(null).map(() => ({
            breakfast: '',
            lunch: '',
            dinner: '',
            notes: {}
          }))
        );

        // Distribute meals across the calendar
        ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
          let mealIndex = 0;
          for (let week = 0; week < 4; week++) {
            for (let day = 0; day < 7; day++) {
              const meal = filtered[mealType][mealIndex % filtered[mealType].length];
              if (meal) {
                newHomeMenus[selectedHome.id][week][day][mealType] = meal.name;
                const initialServings = parseInt(meal.servings?.[0]) || 0;
                const mealKey = `${selectedHome.id}-${week}-${day}-${mealType}`;
                setServingSizes(prev => ({
                  ...prev,
                  [mealKey]: initialServings
                }));

                if (initialServings > selectedHome.residents) {
                  calculateLeftovers(initialServings, selectedHome.residents, week, day, mealType);
                  newHomeMenus[selectedHome.id][week][day].notes[mealType] =
                    `Prepare new meal (${initialServings - selectedHome.residents} servings will be left)`;
                } else {
                  newHomeMenus[selectedHome.id][week][day].notes[mealType] = 'Prepare new meal';
                }
              }
              mealIndex++;
            }
          }
        });

        setHomeMenus(newHomeMenus);
      }
    }
  }, [selectedHome, meals]);

  const calculateLeftovers = (servingSize, residentCount, week, day, mealType) => {
    let remainingServings = servingSize - residentCount;
    let currentDay = day;
    let currentWeek = week;

    while (remainingServings > 0 && currentWeek < 4) {
      currentDay++;
      if (currentDay > 6) {
        currentDay = 0;
        currentWeek++;
      }
      if (currentWeek >= 4) break;

      const servingsForDay = Math.min(remainingServings, residentCount);
      setLeftovers(prev => ({
        ...prev,
        [`${selectedHome.id}-${currentWeek}-${currentDay}-${mealType}`]: servingsForDay
      }));
      remainingServings -= servingsForDay;
    }
  };

  const handleMealChange = (week, day, mealType, mealId) => {
    if (!selectedHome) return;

    const newHomeMenus = { ...homeMenus };
    if (!newHomeMenus[selectedHome.id]) {
      newHomeMenus[selectedHome.id] = Array(4).fill(null).map(() => 
        Array(7).fill(null).map(() => ({
          breakfast: '',
          lunch: '',
          dinner: '',
          notes: {}
        }))
      );
    }

    const selectedMeal = filteredMeals[mealType].find(meal => meal.id === mealId);
    if (selectedMeal) {
      newHomeMenus[selectedHome.id][week][day][mealType] = selectedMeal.name;
      
      // Check for available leftovers
      const leftoverKey = `${selectedHome.id}-${week}-${day}-${mealType}`;
      const availableLeftovers = leftovers[leftoverKey];
      
      if (availableLeftovers) {
        newHomeMenus[selectedHome.id][week][day].notes[mealType] = `Use ${availableLeftovers} leftover servings`;
        setLeftovers(prev => {
          const newLeftovers = { ...prev };
          delete newLeftovers[leftoverKey];
          return newLeftovers;
        });
      } else {
        // Initialize serving size when meal is selected
        const initialServings = parseInt(selectedMeal.servings?.[0]) || 0;
        const mealKey = `${selectedHome.id}-${week}-${day}-${mealType}`;
        setServingSizes(prev => ({
          ...prev,
          [mealKey]: initialServings
        }));
        
        // Calculate leftovers for next day
        if (initialServings > selectedHome.residents) {
          calculateLeftovers(initialServings, selectedHome.residents, week, day, mealType);
          newHomeMenus[selectedHome.id][week][day].notes[mealType] = 
            `Prepare new meal (${initialServings - selectedHome.residents} servings will be left)`;
        } else {
          newHomeMenus[selectedHome.id][week][day].notes[mealType] = 'Prepare new meal';
        }
      }
      
      setHomeMenus(newHomeMenus);
    }
  };

  const handleServingSizeChange = (mealKey, value) => {
    const [homeId, week, day, mealType] = mealKey.split('-');
    setServingSizes(prev => ({
      ...prev,
      [mealKey]: parseInt(value)
    }));
    
    // Recalculate leftovers when serving size changes
    calculateLeftovers(parseInt(value), selectedHome.residents, parseInt(week), parseInt(day), mealType);
  };

  const handleGenerateMenu = () => {
    if (!selectedHome) return;
    const doc = generateMenuPDF(selectedHome, homeMenus);
    doc.save(`${selectedHome.name}-menu.pdf`);
  };

  if (!selectedHome) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Please select a home to start planning meals</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold p-2 bg-gray-100 rounded">
            {day}
          </div>
        ))}
        {Array.from({ length: 28 }).map((_, index) => {
          const week = Math.floor(index / 7);
          const day = index % 7;
          const currentDay = homeMenus[selectedHome?.id]?.[week]?.[day] || {
            breakfast: '',
            lunch: '',
            dinner: ''
          };
          
          return (
            <div key={index} className="border rounded p-2 min-h-[180px] bg-white">
              <div className="text-sm font-medium mb-2">Day {index + 1}</div>
              {['breakfast', 'lunch', 'dinner'].map(mealType => (
                <div key={mealType} className="mb-2">
                  <div className="text-xs font-medium mb-1 capitalize">{mealType}</div>
                  <select
                    value={currentDay[mealType] ? filteredMeals[mealType].find(m => m.name === currentDay[mealType])?.id || '' : ''}
                    onChange={(e) => handleMealChange(week, day, mealType, e.target.value)}
                    className="text-sm p-1 border rounded w-full mb-1"
                  >
                    <option value="">Select a meal</option>
                    {filteredMeals[mealType].map(meal => (
                      <option key={meal.id} value={meal.id}>
                        {meal.name}
                      </option>
                    ))}
                  </select>
                  {currentDay[mealType] && (
                    <select
                      value={servingSizes[`${selectedHome?.id}-${week}-${day}-${mealType}`] || ''}
                      onChange={(e) => handleServingSizeChange(`${selectedHome?.id}-${week}-${day}-${mealType}`, e.target.value)}
                      className="text-sm p-1 border rounded w-full"
                    >
                      {filteredMeals[mealType]
                        .find(m => m.name === currentDay[mealType])?.servings
                        ?.map(serving => (
                          <option key={serving} value={serving}>
                            {serving} servings
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Current Menu Plan</h3>
          <Button onClick={handleGenerateMenu} variant="outline">
            Generate Menu PDF
          </Button>
        </div>
        
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, weekIndex) => (
            <div key={weekIndex} className="space-y-2">
              <h4 className="font-medium text-lg">Week {weekIndex + 1}</h4>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = homeMenus[selectedHome?.id]?.[weekIndex]?.[dayIndex] || {
                    breakfast: 'Not set',
                    lunch: 'Not set',
                    dinner: 'Not set'
                  };

                  return (
                    <div key={dayIndex} className="p-3 border rounded bg-gray-50">
                      <div className="text-sm font-medium mb-2">Day {dayIndex + 1}</div>
                      {['breakfast', 'lunch', 'dinner'].map(mealType => (
                        <div key={mealType} className="text-sm">
                          <span className="capitalize">{mealType}:</span>
                          <div className="ml-2 text-gray-600">
                            {day[mealType] || 'Not set'}
                            {day[mealType] && servingSizes[`${selectedHome?.id}-${weekIndex}-${dayIndex}-${mealType}`] && 
                              ` (${servingSizes[`${selectedHome?.id}-${weekIndex}-${dayIndex}-${mealType}`]} servings)`
                            }
                            {day.notes?.[mealType] && (
                              <div className="text-xs text-blue-600 mt-1">
                                {day.notes[mealType]}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MealPlanner;