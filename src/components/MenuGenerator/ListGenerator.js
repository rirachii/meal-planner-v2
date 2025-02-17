import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { compileShoppingList, compilePrepList } from './utils';
import { jsPDF } from 'jspdf';

const ListGenerator = ({
  homeMenus,
  instructions,
  selectedHome,
  homes,
  shoppingList,
  prepList,
  setShoppingList,
  setPrepList
}) => {
  const handleCompileShoppingList = () => {
    const list = compileShoppingList(homeMenus, instructions, homes);
    setShoppingList(list);
  };

  const handleCompilePrepList = () => {
    const list = compilePrepList(homeMenus, instructions, homes);
    setPrepList(list);
  };

  const generateShoppingListPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const selectedHomeData = homes.find(home => home.id === selectedHome);

    // Enhanced Header
    doc.setFontSize(16);
    doc.text('Shopping List', 20, yPos);
    yPos += 15;
    
    // Add home info
    doc.setFontSize(12);
    doc.text(`Home: ${selectedHomeData?.name || 'All Homes'}`, 20, yPos);
    yPos += 10;
    doc.text(`Residents: ${selectedHomeData?.residentCount || 0}`, 20, yPos);
    yPos += 10;
    if (selectedHomeData?.dietaryRestrictions) {
      doc.text(`Dietary Restrictions: ${selectedHomeData.dietaryRestrictions}`, 20, yPos);
      yPos += 15;
    }

    // Rest of the shopping list
    doc.setFontSize(12);
    Object.entries(shoppingList).forEach(([category, items]) => {
      // Category header
      doc.setFont(undefined, 'bold');
      doc.text(category, 20, yPos);
      yPos += 10;

      // Items
      doc.setFont(undefined, 'normal');
      items.forEach(item => {
        doc.text(`• ${item}`, 30, yPos);
        yPos += 8;

        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
      });
      yPos += 10;
    });

    doc.save(`shopping-list-${selectedHomeData?.name || 'all'}.pdf`);
  };

  const generatePrepListPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const selectedHomeData = homes.find(home => home.id === selectedHome);

    // Enhanced Header
    doc.setFontSize(16);
    doc.text('Prep Instructions', 20, yPos);
    yPos += 15;

    // Add home info
    doc.setFontSize(12);
    doc.text(`Home: ${selectedHomeData?.name || 'All Homes'}`, 20, yPos);
    yPos += 10;
    doc.text(`Residents: ${selectedHomeData?.residentCount || 0}`, 20, yPos);
    yPos += 15;

    // Rest of the prep list
    doc.setFontSize(12);
    prepList.forEach((instruction, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${instruction}`, 170);
      lines.forEach(line => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 10;
      });
    });

    doc.save(`prep-list-${selectedHomeData?.name || 'all'}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <Button onClick={handleCompileShoppingList}>
          Compile Shopping List
        </Button>
        <Button onClick={handleCompilePrepList}>
          Compile Prep List
        </Button>
      </div>

      <Tabs defaultValue="shopping" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shopping">Shopping List</TabsTrigger>
          <TabsTrigger value="prep">Prep Instructions</TabsTrigger>
        </TabsList>

        <TabsContent value="shopping">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Shopping List</h3>
                {Object.keys(shoppingList).length > 0 && (
                  <Button onClick={generateShoppingListPDF}>
                    Download PDF
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(shoppingList).length === 0 ? (
                <p className="text-gray-600">
                  Click "Compile Shopping List" to generate the list
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(shoppingList).map(([category, items]) => (
                    <div key={category}>
                      <h4 className="font-medium mb-2">{category}</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        {items.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prep">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Prep Instructions</h3>
                {prepList.length > 0 && (
                  <Button onClick={generatePrepListPDF}>
                    Download PDF
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {prepList.length === 0 ? (
                <p className="text-gray-600">
                  Click "Compile Prep List" to generate instructions
                </p>
              ) : (
                <ol className="list-decimal pl-6 space-y-2">
                  {prepList.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ListGenerator;