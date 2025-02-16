import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { generateMenuPDF } from './utils';

const MealPlanner = ({ meals, selectedHome, homeMenus, setHomeMenus }) => {
  const onDragEnd = (result) => {
    if (!result.destination || !selectedHome) return;
    
    const { source, destination } = result;
    const mealType = source.droppableId;
    
    const newHomeMenus = { ...homeMenus };
    if (!newHomeMenus[selectedHome.id]) {
      newHomeMenus[selectedHome.id] = Array(4).fill(null).map(() => 
        Array(7).fill(null).map(() => ({
          breakfast: '',
          lunch: '',
          dinner: ''
        }))
      );
    }
    
    const week = Math.floor(destination.index / 7);
    const day = destination.index % 7;
    newHomeMenus[selectedHome.id][week][day][mealType] = meals[mealType][source.index].name;
    
    setHomeMenus(newHomeMenus);
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
    <div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-3 gap-4">
          {['breakfast', 'lunch', 'dinner'].map(mealType => (
            <Card key={mealType}>
              <CardHeader>
                <h3 className="text-xl font-semibold capitalize">{mealType}</h3>
              </CardHeader>
              <CardContent>
                <Droppable droppableId={mealType}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="min-h-96 p-2 border rounded"
                    >
                      {meals[mealType].map((meal, index) => (
                        <Draggable
                          key={meal.id}
                          draggableId={meal.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="p-2 mb-2 bg-white border rounded shadow"
                            >
                              <div className="flex justify-between items-center">
                                <span>{meal.name}</span>
                                <select
                                  value={meal.servings?.[0] || ''}
                                  className="ml-2 p-1 border rounded"
                                >
                                  {meal.servings?.map(serving => (
                                    <option key={serving} value={serving}>
                                      {serving} servings
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          ))}
        </div>
      </DragDropContext>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Current Menu Plan</h3>
        {homeMenus[selectedHome.id]?.map((week, weekIndex) => (
          <div key={weekIndex} className="mb-6">
            <h4 className="font-medium mb-2">Week {weekIndex + 1}</h4>
            {week.map((day, dayIndex) => (
              <div key={dayIndex} className="p-2 border-b">
                <p className="font-medium">Day {dayIndex + 1}</p>
                <p>Breakfast: {day.breakfast || 'Not set'}</p>
                <p>Lunch: {day.lunch || 'Not set'}</p>
                <p>Dinner: {day.dinner || 'Not set'}</p>
              </div>
            ))}
          </div>
        ))}
        
        <Button
          onClick={handleGenerateMenu}
          className="mt-4"
        >
          Generate Menu PDF
        </Button>
      </div>
    </div>
  );
};

export default MealPlanner;