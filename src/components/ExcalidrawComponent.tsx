import React, { useState, useRef, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

// 定义数据类型
interface Question {
  question: string;
  answer_location: [number, number, number, number];
  filter: boolean;
}

interface DataItem {
  image_url: string;
  question_list: Question[];
}

interface ExcalidrawComponentProps {
  data?: DataItem[];
  onDataChange?: (data: DataItem[], isComplete: number) => void;
}

const ExcalidrawComponent: React.FC<ExcalidrawComponentProps> = ({ data, onDataChange }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [drawingMode, setDrawingMode] = useState<{ active: boolean; questionIndex: number | null }>({ active: false, questionIndex: null });

  // 判断answer_location是否有有效值的辅助函数
  const hasValidAnswerLocation = (answerLocation: [number, number, number, number]): boolean => {
    return answerLocation && answerLocation.length === 4 && answerLocation.some(coord => coord !== 0);
  };
  const [isComplete, setIsComplete] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const imageElementId = 'background-image';
  const lastImageUrlRef = useRef<string | null>(null);

  const getProxiedUrl = (url: string) => {
    const s3Prefix = 'https://algo-public.s3.cn-north-1.amazonaws.com.cn';
    if (url.startsWith(s3Prefix)) {
      const proxiedUrl = url.replace(s3Prefix, '/s3-proxy');
      console.log(`URL translated from ${url} to ${proxiedUrl}`);
      return proxiedUrl;
    }
    return url;
  };

  // 获取图片的原始尺寸
  const getImageSize = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      console.log("Getting image size for:", url);
      img.src = url;
    });
  };

  // 将图片 URL 转换为 base64, 以便在 Excalidraw 中使用
  const toDataURL = async (url: string) => {
    try {
      console.log("Fetching image for data URL conversion:", url);
      // Ensure the URL is absolute for the fetch request to be handled by the proxy
      const absoluteUrl = new URL(url, window.location.origin).href;
      console.log("Absolute URL for fetch:", absoluteUrl);
      const response = await fetch(absoluteUrl);
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
      const imageUrl = getProxiedUrl(currentData.image_url);

      const setupScene = async () => {
        const imageChanged = imageUrl !== lastImageUrlRef.current;
        const elements = excalidrawAPI.getSceneElements();
        const imageSize = await getImageSize(imageUrl);

        const imageElement = elements.find((el: any) => el.id === imageElementId) || {
          id: imageElementId,
          type: 'image' as const,
          x: (excalidrawAPI.getAppState().width - imageSize.width) / 2,
          y: (excalidrawAPI.getAppState().height - imageSize.height) / 2,
          width: imageSize.width,
          height: imageSize.height,
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

        const questionElements = currentData.question_list.map((question, index) => {
          if (!question.answer_location || (question.answer_location as any).length === 0) {
            return []; // 如果 answer_location 为空，则不创建矩形和文本
          }
          const [x1, y1, x2, y2] = question.answer_location;
          const rectX = imageElement.x + x1;
          const rectY = imageElement.y + y1;
          const rectWidth = x2 - x1;
          const rectHeight = y2 - y1;
          
          // 创建矩形框
          const rectangle = {
            id: `highlight-${index}`,
            type: 'rectangle' as const,
            x: rectX,
            y: rectY,
            width: rectWidth,
            height: rectHeight,
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
            boundElements: [{ id: `text-${index}`, type: 'text' }],
            updated: Date.now(),
            link: null,
          };

          // 创建文本元素，位置在矩形框上方
          const text = {
            id: `text-${index}`,
            type: 'text' as const,
            x: rectX + rectWidth / 2 - 20, // 居中显示，稍微偏移
            y: rectY - 25, // 在矩形框上方
            width: 40,
            height: 20,
            text: `题目${index + 1}`,
            fontSize: 24,
            fontFamily: 1,
            textAlign: 'center' as const,
            verticalAlign: 'middle' as const,
            strokeColor: '#7c0202ff',
            backgroundColor: 'white',
            fillStyle: 'solid' as const,
            strokeWidth: 1,
            strokeStyle: 'solid' as const,
            roughness: 0,
            opacity: 100,
            angle: 0,
            seed: Math.floor(Math.random() * 1000000),
            versionNonce: Math.floor(Math.random() * 1000000),
            isDeleted: false,
            locked: false,
            groupIds: [],
            frameId: null,
            roundness: null,
            boundElements: [{ id: `highlight-${index}`, type: 'rectangle' }],
            updated: Date.now(),
            link: null,
            containerId: null,
            originalText: `ID: ${index + 1}`,
            lineHeight: 1.25,
          };

          return [rectangle, text];
        }).flat().filter(Boolean); // 展平数组并过滤掉空值

        const allElements = [imageElement, ...questionElements];
        excalidrawAPI.updateScene({ elements: allElements });

        if (imageChanged) {
          excalidrawAPI.scrollToContent(imageElement);
        }
      };

      setupScene();
    }
  }, [data, excalidrawAPI]);

  // 处理filter切换事件
  const handleFilterToggle = (questionIndex: number) => {
    if (!data || !data.length || !onDataChange) return;

    const newData = JSON.parse(JSON.stringify(data)); // Deep copy
    newData[0].question_list[questionIndex].filter = !newData[0].question_list[questionIndex].filter;
    
    onDataChange(newData, 1);
    console.log(`题目 ${questionIndex + 1} filter状态已切换为:`, newData[0].question_list[questionIndex].filter);
  };

  // 数据导出功能
  const exportData = (format: 'json' | 'csv' = 'json') => {
    if (!data || !data.length) {
      console.warn('没有可导出的数据');
      return null;
    }

    const currentData = data[0];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (format === 'json') {
      // 导出JSON格式
      const jsonData = JSON.stringify(currentData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `question_data_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('JSON数据已导出:', currentData);
      return currentData;
    } else if (format === 'csv') {
      // 导出CSV格式
      const headers = ['题目序号', '题目内容', '答案位置X1', '答案位置Y1', '答案位置X2', '答案位置Y2', '过滤状态'];
      const csvRows = [headers.join(',')];
      
      currentData.question_list.forEach((question, index) => {
        const row = [
          index + 1,
          `"${question.question.replace(/"/g, '""')}"`, // 转义双引号
          question.answer_location[0] || '',
          question.answer_location[1] || '',
          question.answer_location[2] || '',
          question.answer_location[3] || '',
          question.filter ? '已过滤' : '未过滤'
        ];
        csvRows.push(row.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // 添加BOM以支持中文
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `question_data_${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('CSV数据已导出');
      return currentData;
    }
  };

  // 获取当前数据的方法（供外部调用）
  const getCurrentData = () => {
    return data && data.length > 0 ? data[0] : null;
  };

  // 处理题目点击事件
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
          if (el.id.startsWith('text-')) {
            const textIndex = parseInt(el.id.split('-')[1], 10);
            return { ...el, strokeColor: textIndex === questionIndex ? '#007bff' : '#ff0000' };
          }
          return el;
        });

        // 同步更新文本位置
        const finalElements = updatedElements.map((el: any) => {
          if (el.id.startsWith('text-')) {
            const index = parseInt(el.id.split('-')[1], 10);
            const correspondingRect = updatedElements.find((e: any) => e.id === `highlight-${index}`);
            if (correspondingRect) {
              return {
                ...el,
                x: correspondingRect.x + correspondingRect.width / 2 - 20,
                y: correspondingRect.y - 25,
              };
            }
          }
          return el;
        });
        excalidrawAPI.updateScene({ elements: finalElements });
        
        excalidrawAPI.updateScene({
          appState: {
            selectedElementIds: { [targetElement.id]: true },
          },
        });
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
      onDataChange(newData, 1);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', gap: '20px' }}>
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>题目列表</h3>
            {/* <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => exportData('json')}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: '#007bff',
                  color: 'white',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
              >
                导出JSON
              </button>
              <button
                onClick={() => exportData('csv')}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: '#28a745',
                  color: 'white',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e7e34'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
              >
                导出CSV
              </button>
            </div> */}
          </div>
          {data[0].question_list.map((question, index) => {
            const hasAnswer = hasValidAnswerLocation(question.answer_location);
            return (
            <div
              key={index}
              style={{
                padding: '15px',
                marginBottom: '10px',
                backgroundColor: selectedQuestion === index ? '#007bff' : 'white',
                color: selectedQuestion === index ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                lineHeight: '1.5',
                boxShadow: hasAnswer 
                  ? '0 0 15px rgba(40, 167, 69, 0.8), 0 0 25px rgba(40, 167, 69, 0.4)' 
                  : '0 0 15px rgba(108, 117, 125, 0.6), 0 0 25px rgba(108, 117, 125, 0.3)'
              }}
            >
              <div 
                onClick={() => handleQuestionClick(index, question)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  题目 {index + 1}
                </div>
                <div>{question.question}</div>
                <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                  位置: [{question.answer_location.join(', ')}]
                </div>
              </div>
              <div style={{ 
                marginTop: '10px', 
                paddingTop: '10px', 
                borderTop: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>
                  skip状态:
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFilterToggle(index);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: question.filter ? '#a7282aff' : '#38dc35ff',
                    color: 'white',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  {question.filter ? 'skiped' : 'skip'}
                </button>
              </div>
            </div>
          );
          })}
          
          {/* 确认按钮 */}
          <div style={{ 
            marginTop: '20px', 
            paddingTop: '20px', 
            borderTop: '2px solid #ddd' 
          }}>
            <button
              onClick={async () => {
                if (data && data.length > 0 && onDataChange && !isSubmitting) {
                  setIsSubmitting(true);
                  try {
                    onDataChange(data, 2);
                    // 模拟数据写入延迟
                    await new Promise(resolve => setTimeout(resolve, 1500));
                  } finally {
                    setIsSubmitting(false);
                  }
                }
              }}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 20px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                backgroundColor: isSubmitting ? '#6c757d' : '#28a745',
                color: 'white',
                transition: 'background-color 0.2s ease',
                opacity: isSubmitting ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#218838';
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#28a745';
                }
              }}
            >
              {isSubmitting ? '写入数据中...' : '确认完成'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcalidrawComponent;