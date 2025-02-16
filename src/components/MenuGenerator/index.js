import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import MealPlanner from './MealPlanner';
import PopularityChart from './PopularityChart';
import ListGenerator from './ListGenerator';
import { processMasterSpreadsheet, loadMealData } from './utils';