import { bitable } from '@lark-base-open/js-sdk';
import './App.css';
import { getStructuredData, watchSelectionData} from './utils/get_structured_data';
import { useState, useEffect, useRef, useCallback } from 'react';
import ExcalidrawComponent from './components/ExcalidrawComponent';
import mockData from './mock/data.json';

export default function App() {
  const [structuredData, setStructuredData] = useState<any>(mockData);
  const [showExcalidraw, setShowExcalidraw] = useState(false);
  
  useEffect(() => {
    const unwatch = watchSelectionData((data) => {
      console.log('数据变化:', data);
      if (!data.success) {
        setStructuredData({});
      } else {
        if (data.data === null) {
          setStructuredData({});
        } else {
          let structuredData = '';
          for (const item of data.data) {
            if (item.type === 'text' || item.type === 'url') {
              structuredData += item.text || '';
            }
          }
          setStructuredData(JSON.parse(structuredData));
        }
      }
    });
  }, []);

  const handleDataChange = (newData: any, isComplete: number) => {
    setStructuredData(newData);
    console.log('Updated data in App:', newData);
    console.log('isComplete:', isComplete);
  };

  return (
      <ExcalidrawComponent data={structuredData} onDataChange={handleDataChange}></ExcalidrawComponent>
  )
}