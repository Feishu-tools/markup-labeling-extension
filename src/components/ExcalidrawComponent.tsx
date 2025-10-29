import React, { useState, useRef, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

// 定义数据类型
interface Question {
  question: string;
  answer_location: [number, number, number, number];
}

interface DataItem {
  image_url: string;
  question_list: Question[];
}

interface ExcalidrawComponentProps {
  data?: DataItem[];
  onDataChange?: (data: DataItem[]) => void;
}

const ExcalidrawComponent: React.FC<ExcalidrawComponentProps> = ({ data, onDataChange }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [drawingMode, setDrawingMode] = useState<{ active: boolean; questionIndex: number | null }>({ active: false, questionIndex: null });
  const imageElementId = 'background-image';
  const lastImageUrlRef = useRef<string | null>(null);

  // 将图片 URL 转换为 base64, 以便在 Excalidraw 中使用
  const toDataURL = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to data URL:', error);
      return '';
    }
  };

  // 当数据或 Excalidraw API 准备好时，初始化场景
  useEffect(() => {
    if (data && data.length > 0 && excalidrawAPI) {
      const currentData = data[0];
      const imageUrl = currentData.image_url;

      const setupScene = async () => {
        const imageChanged = imageUrl !== lastImageUrlRef.current;
        const elements = excalidrawAPI.getSceneElements();
        const imageElement = elements.find((el: any) => el.id === imageElementId) || {
          id: imageElementId,
          type: 'image' as const,
          x: (excalidrawAPI.getAppState().width - 800) / 2,
          y: (excalidrawAPI.getAppState().height - 600) / 2,
          width: 800,
          height: 600,
          angle: 0,
          strokeColor: 'transparent',
          backgroundColor: 'transparent',
          fillStyle: 'hachure' as const,
          strokeWidth: 1,
          strokeStyle: 'solid' as const,
          roughness: 1,
          opacity: 100,
          groupIds: [],
          frameId: null,
          roundness: null,
          seed: Math.floor(Math.random() * 1000000),
          versionNonce: Math.floor(Math.random() * 1000000),
          isDeleted: false,
          boundElements: null,
          updated: Date.now(),
          link: null,
          locked: true,
          scale: [1, 1] as [number, number],
        };

        if (imageChanged) {
          const dataURL = await toDataURL(imageUrl);
          if (!dataURL) return;

          const imageFileId = `file-${Date.now()}`;
          (imageElement as any).fileId = imageFileId;

          excalidrawAPI.resetScene();
          excalidrawAPI.addFiles([{
            id: imageFileId,
            dataURL,
            mimeType: 'image/png',
            created: Date.now(),
          }]);
          lastImageUrlRef.current = imageUrl;
        }

        const questionRectangles = currentData.question_list.map((question, index) => {
          const [x1, y1, x2, y2] = question.answer_location;
          return {
            id: `highlight-${index}`,
            type: 'rectangle' as const,
            x: imageElement.x + x1,
            y: imageElement.y + y1,
            width: x2 - x1,
            height: y2 - y1,
            strokeColor: '#ff0000',
            backgroundColor: 'transparent',
            strokeWidth: 2,
            strokeStyle: 'solid' as const,
            roughness: 0,
            opacity: 100,
            seed: Math.floor(Math.random() * 1000000),
            versionNonce: Math.floor(Math.random() * 1000000),
            isDeleted: false,
            locked: false,
            angle: 0,
            fillStyle: 'hachure' as const,
            groupIds: [],
            frameId: null,
            roundness: null,
            boundElements: null,
            updated: Date.now(),
            link: null,
          };
        });

        const allElements = [imageElement, ...questionRectangles];
        excalidrawAPI.updateScene({ elements: allElements });

        if (imageChanged) {
          excalidrawAPI.scrollToContent(imageElement, { fitToContent: true });
        }
      };

      setupScene();
    }
  }, [data, excalidrawAPI]);

  // 点击题目时，在图片上创建或更新高亮矩形
  const handleQuestionClick = (questionIndex: number, question: Question) => {
    setSelectedQuestion(questionIndex);

    if (excalidrawAPI) {
      const elements = excalidrawAPI.getSceneElements();
      const targetElement = elements.find((el: any) => el.id === `highlight-${questionIndex}`);

      if (targetElement) {
        const updatedElements = elements.map((el: any) => {
          if (el.id.startsWith('highlight-')) {
            return { ...el, strokeColor: el.id === `highlight-${questionIndex}` ? '#007bff' : '#ff0000' };
          }
          return el;
        });
        excalidrawAPI.updateScene({ elements: updatedElements });
      } else {
        // 如果没有矩形，则进入绘制模式
        setDrawingMode({ active: true, questionIndex });
        excalidrawAPI.updateScene({
          appState: { viewModeEnabled: false, activeTool: { type: 'rectangle' } },
        });
      }
    }
  };

  // 当用户在画布上完成一次操作（如移动、缩放）后触发
  const handlePointerUp = () => {
    if (!excalidrawAPI || !onDataChange || !data || !data.length) return;

    const elements = excalidrawAPI.getSceneElements();
    const imageElement = elements.find((el: any) => el.id === imageElementId);
    
    if (!imageElement) return;

    const newData = JSON.parse(JSON.stringify(data)); // Deep copy
    let changed = false;

    if (drawingMode.active && drawingMode.questionIndex !== null) {
      const newElement = elements.find((el: any) => !el.id.startsWith('highlight-') && el.type === 'rectangle');
      if (newElement) {
        const questionIndex = drawingMode.questionIndex;
        const newId = `highlight-${questionIndex}`;
        const updatedElement = { ...newElement, id: newId, strokeColor: '#007bff' };

        const relativeX = Math.max(0, updatedElement.x - imageElement.x);
        const relativeY = Math.max(0, updatedElement.y - imageElement.y);
        const endX = Math.min(imageElement.width, relativeX + updatedElement.width);
        const endY = Math.min(imageElement.height, relativeY + updatedElement.height);

        newData[0].question_list[questionIndex].answer_location = [relativeX, relativeY, endX, endY];
        changed = true;

        const otherElements = elements.filter((el: any) => el.id !== newElement.id);
        excalidrawAPI.updateScene({ elements: [...otherElements, updatedElement] });
      }
      setDrawingMode({ active: false, questionIndex: null });
      excalidrawAPI.updateScene({ appState: { activeTool: { type: 'selection' } } });
    } else {
      elements.forEach((el: any) => {
        if (el.id.startsWith('highlight-') && el.type === 'rectangle') {
          const questionIndex = parseInt(el.id.split('-')[1], 10);
          
          const relativeX = Math.max(0, el.x - imageElement.x);
          const relativeY = Math.max(0, el.y - imageElement.y);
          const endX = Math.min(imageElement.width, relativeX + el.width);
          const endY = Math.min(imageElement.height, relativeY + el.height);

          const newLocation: [number, number, number, number] = [relativeX, relativeY, endX, endY];
          
          const oldLocation = newData[0].question_list[questionIndex].answer_location;
          if (JSON.stringify(newLocation) !== JSON.stringify(oldLocation)) {
            newData[0].question_list[questionIndex].answer_location = newLocation;
            changed = true;
          }
        }
      });
    }

    if (changed) {
      onDataChange(newData);
    }
  };

  return (
    <div style={{ display: 'flex', height: '600px', gap: '20px' }}>
      <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '8px' }}>
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          onChange={(elements, appState) => {
            // 可以在这里实时处理，但 onPointerUp 性能更好
          }}
          onPointerUp={handlePointerUp}
        />
      </div>

      {data && data.length > 0 && (
        <div style={{ 
          width: '300px', 
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          overflowY: 'auto'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>题目列表</h3>
          {data[0].question_list.map((question, index) => (
            <div
              key={index}
              onClick={() => handleQuestionClick(index, question)}
              style={{
                padding: '15px',
                marginBottom: '10px',
                backgroundColor: selectedQuestion === index ? '#007bff' : 'white',
                color: selectedQuestion === index ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                题目 {index + 1}
              </div>
              <div>{question.question}</div>
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                位置: [{question.answer_location.join(', ')}]
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExcalidrawComponent;