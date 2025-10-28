import { bitable } from '@lark-base-open/js-sdk';
import './App.css';
import { getStructuredData, watchSelectionData} from './utils/get_structured_data';
import { ExcalidrawComponent } from './components/ExcalidrawComponent';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function App() {
  const [structuredData, setStructuredData] = useState<object>({});
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

  return (
    <main>
      {/* <ExcalidrawComponent></ExcalidrawComponent> */}
      <div>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '4px',
          overflow: 'auto'
        }}>
          {JSON.stringify(structuredData, null, 2)}
        </pre>
      </div>
    </main>
  )
}