import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

export const loadMealData = async () => {
  try {
    // Load meal data
    const mealResponse = await window.fs.readFile('meal.json');
    const mealText = new TextDecoder().decode(mealResponse);
    const mealData = JSON.parse(mealText);

    // Load instructions data
    const instructionsResponse = await window.fs.readFile('instructions.json');
    const instructionsText = new TextDecoder().decode(instructionsResponse);
    const instructionsData = JSON.parse(instructionsText);

    return { mealData, instructionsData };
  } catch (error) {
    console.error('Error loading data:', error);
    return { mealData: { breakfast: [], lunch: [], dinner: [] }, instructionsData: {} };
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
        
        // Process homes data
        const homes = jsonData.map(row => ({
          id: row.HomeID,
          name: row.HomeName,
          residents: row.Residents,
          dietaryRestrictions: row.DietaryRestrictions?.split(',').map(r => r.trim()) || []
        }));
        
        // Calculate meal popularity
        const mealCounts = {};
        jsonData.forEach(row => {
          Object.entries(row).forEach(([key, value]) => {
            if (value && typeof value === 'string' && key.startsWith('Meal')) {
              mealCounts[value] = (mealCounts[value] || 0) + 1;
            }
          });
        });
        
        const popularityData = Object.entries(mealCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        
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