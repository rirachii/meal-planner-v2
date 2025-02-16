# Meal Planner Portal

A comprehensive meal planning system built with React for managing multiple homes' meal schedules, generating shopping lists, and creating prep instructions.

## Features

- **Multi-home Support**
  - Individual menu planning for each home
  - Dietary restriction tracking
  - Resident count-based serving sizes

- **Drag-and-Drop Menu Planning**
  - Visual meal organization
  - 28-day menu planning
  - Automatic serving size suggestions

- **PDF Generation**
  - Custom menu PDFs for each home
  - Categorized shopping lists
  - Organized prep instructions

- **Analytics**
  - Meal popularity tracking
  - Visual charts and graphs
  - Usage statistics

## Setup

1. Clone the repository:
```bash
git clone https://github.com/rirachii/meal-planner-v2.git
cd meal-planner-v2
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Data Files

The system requires two JSON files in the root directory:

1. `meal.json`: Contains meal information including:
   - Name
   - Type (breakfast, lunch, dinner)
   - Dietary restrictions
   - Available serving sizes
   - Nutritional information

2. `instructions.json`: Contains preparation instructions including:
   - Shopping lists for different serving sizes
   - Prep instructions
   - Cooking steps

## Usage

1. **Upload Master Spreadsheet**
   - File should contain home information
   - Include dietary restrictions
   - Number of residents per home

2. **Menu Planning**
   - Select a home from the dropdown
   - Drag meals from the menu to plan days
   - Adjust serving sizes as needed
   - Generate menu PDF

3. **Shopping & Prep Lists**
   - Click "Compile Shopping List" to generate categorized shopping lists
   - Click "Compile Prep List" for prep instructions
   - Download PDFs for kitchen staff

## Project Structure

```
src/
  ├── components/
  │   └── MenuGenerator/
  │       ├── index.js           # Main component
  │       ├── MealPlanner.js     # Drag-and-drop planning
  │       ├── PopularityChart.js # Analytics visualization
  │       ├── ListGenerator.js   # Shopping/prep lists
  │       └── utils.js           # Helper functions
  ├── App.js
  └── index.js
```

## Dependencies

- `react-beautiful-dnd`: Drag-and-drop functionality
- `recharts`: Data visualization
- `jspdf`: PDF generation
- `xlsx`: Excel file processing
- `tailwindcss`: Styling
- `@radix-ui/react-*`: UI components

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.