import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { API_ENDPOINTS } from '../../api/endpoints';

export const loadMealData = async () => {
  try {
    // Use imported data directly from API_ENDPOINTS
    const mealData = API_ENDPOINTS.meals;
    const instructionsData = API_ENDPOINTS.instructions;
    const baggingData = API_ENDPOINTS.bagging;

    return { 
      mealData: mealData, 
      instructionsData: instructionsData,
      baggingData: baggingData
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return { 
      mealData: { breakfast: [], lunch: [], dinner: [] }, 
      instructionsData: {},
      baggingData: {}
    };
  }
};

export const processMasterSpreadsheet = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Process homes data with validation
        const homes = jsonData
          .filter(row => row.home_id && (row.residents))
          .map(row => ({
            home_id: row.home_id,
            residents: parseInt(row.residents) || -1,
            phone: row.phone,
            email: row.email,
            breakfast_preferences: (row.breakfast_preferences || '').trim(),
            lunch_preferences: (row.lunch_preferences || row.LunchPreferences || '').trim(),
            dinner_preferences: (row.dinner_preferences || row.DinnerPreferences || '').trim(),
            dietary_restrictions: (row.dietary_restrictions || row.DietaryRestrictions || 'none').trim()
          }));

        if (homes.length === 0) {
          reject(new Error('No valid data found in the Excel file.'));
          return;
        }
        
        // Calculate meal popularity by type
        const mealCountsByType = {
          breakfast: {},
          lunch: {},
          dinner: {}
        };

        jsonData.forEach(row => {
          Object.entries(row).forEach(([key, value]) => {
            if (value && typeof value === 'string' && key.startsWith('Meal')) {
              const mealType = key.includes('Breakfast') ? 'breakfast' :
                             key.includes('Lunch') ? 'lunch' :
                             key.includes('Dinner') ? 'dinner' : null;
              
              if (mealType) {
                mealCountsByType[mealType][value] = (mealCountsByType[mealType][value] || 0) + 1;
              }
            }
          });
        });
        
        const calculateMealPopularity = (homes, mealType, mealData) => {
          const mealCounts = {};
          const mealHomes = {};
          
          homes.forEach(home => {
            const preferences = home[`${mealType}_preferences`]?.split(',') || [];
            preferences.forEach(mealId => {
              if (mealId) {
                const meal = mealData[mealType].find(m => m.id === mealId);
                if (meal) {
                  mealCounts[meal.name] = (mealCounts[meal.name] || 0) + 1;
                  if (!mealHomes[meal.name]) mealHomes[meal.name] = [];
                  mealHomes[meal.name].push(home.phone);
                }
              }
            });
          });
        
          return Object.entries(mealCounts)
            .map(([name, count]) => ({ 
              name, 
              count,
              homes: mealHomes[name]
            }))
            .sort((a, b) => b.count - a.count);
        };

        const popularityData = ['breakfast', 'lunch', 'dinner'].map(type => ({
          type,
          meals: calculateMealPopularity(homes, type, API_ENDPOINTS.meals)
        }));
        
        resolve({ homes, popularityData });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

export const generateMenuPDF = (home, homeMenus) => {
  const doc = new jsPDF();
  let yPos = 20;

  // Header
  doc.setFontSize(16);
  doc.text(`${home.name} Menu, ${home.residents} residents`, 20, yPos);
  yPos += 15;

  // Dietary restrictions
  if (home.dietaryRestrictions.length > 0) {
    doc.setFontSize(12);
    doc.text(`Dietary Restrictions: ${home.dietaryRestrictions.join(', ')}`, 20, yPos);
    yPos += 15;
  }

  // Meal times
  doc.text('8am Breakfast\n10am Snack\n12pm Lunch\n3pm Snack\n5pm Dinner\n7pm Snack', 20, yPos);
  yPos += 50;

  // Weekly menus
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  weeks.forEach((week, weekIndex) => {
    doc.setFontSize(14);
    doc.text(week, 20, yPos);
    yPos += 10;

    // Days of the week
    for (let day = 1; day <= 7; day++) {
      const dayMenu = homeMenus[home.id]?.[weekIndex]?.[day - 1];
      if (dayMenu) {
        doc.setFontSize(12);
        doc.text(`Day ${day}`, 20, yPos);
        doc.text(dayMenu.breakfast, 50, yPos);
        doc.text(dayMenu.lunch, 50, yPos + 10);
        doc.text(dayMenu.dinner, 50, yPos + 20);
        yPos += 30;
      }
    }
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += 10;
    }
  });

  return doc;
};

export const compileShoppingList = (homeMenus, instructions, homes) => {
  const allItems = new Set();
  
  Object.entries(homeMenus).forEach(([homeId, homeMenu]) => {
    const home = homes.find(h => h.id === homeId);
    if (!home) return;

    homeMenu.forEach(week => {
      week.forEach(day => {
        ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
          const meal = day[mealType];
          const mealInstructions = instructions[meal];
          if (mealInstructions) {
            const servingSize = home.residents <= 4 ? '4' : 
                             home.residents <= 6 ? '6' :
                             home.residents <= 8 ? '8' : '12';
            
            mealInstructions[servingSize]?.shoppingList?.forEach(item => {
              allItems.add(item);
            });
          }
        });
      });
    });
  });

  return Array.from(allItems)
    .sort((a, b) => a.localeCompare(b))
    .reduce((groups, item) => {
      const [category] = item.split(',');
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item.split(',').slice(1).join(',').trim());
      return groups;
    }, {});
};

export const compilePrepList = (homeMenus, instructions, homes) => {
  const allPrep = new Set();
  
  Object.entries(homeMenus).forEach(([homeId, homeMenu]) => {
    const home = homes.find(h => h.id === homeId);
    if (!home) return;

    homeMenu.forEach(week => {
      week.forEach(day => {
        ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
          const meal = day[mealType];
          const mealInstructions = instructions[meal];
          if (mealInstructions) {
            const servingSize = home.residents <= 4 ? '4' : 
                             home.residents <= 6 ? '6' :
                             home.residents <= 8 ? '8' : '12';
            
            mealInstructions[servingSize]?.prep?.forEach(item => {
              allPrep.add(item);
            });
          }
        });
      });
    });
  });

  return Array.from(allPrep).sort();
};