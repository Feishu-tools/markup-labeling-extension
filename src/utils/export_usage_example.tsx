/**
 * 数据导出功能调用样例和使用说明
 * 
 * ExcalidrawComponent 组件提供了完整的数据导出功能，支持 JSON 和 CSV 两种格式
 */

import React, { useRef } from 'react';
import ExcalidrawComponent from '../components/ExcalidrawComponent';

// 示例数据结构
const sampleData = [
  {
    image_url: "https://example.com/image.png",
    question_list: [
      {
        question: "这是第一个问题？",
        answer_location: [50, 50, 150, 100] as [number, number, number, number],
        filter: false
      },
      {
        question: "这是第二个问题？",
        answer_location: [200, 200, 300, 250] as [number, number, number, number],
        filter: true
      }
    ]
  }
];

// 使用样例组件
const ExportUsageExample: React.FC = () => {
  const excalidrawRef = useRef<any>(null);

  // 方法1: 通过UI按钮导出（推荐）
  // 用户可以直接点击组件右上角的"导出JSON"或"导出CSV"按钮

  // 方法2: 程序化调用导出功能
  const handleProgrammaticExport = () => {
    // 注意：这需要在 ExcalidrawComponent 内部调用，或者通过 ref 暴露方法
    console.log('程序化导出需要在组件内部实现或通过 ref 暴露');
  };

  // 方法3: 获取当前数据进行自定义处理
  const handleGetCurrentData = (currentData: any) => {
    console.log('当前数据:', currentData);
    
    // 自定义导出逻辑示例
    const customExport = () => {
      if (!currentData || !currentData.question_list) return;
      
      // 只导出已过滤的题目
      const filteredQuestions = currentData.question_list.filter((q: any) => q.filter);
      
      // 创建自定义格式的数据
      const customData = {
        export_time: new Date().toISOString(),
        total_questions: currentData.question_list.length,
        filtered_questions: filteredQuestions.length,
        image_url: currentData.image_url,
        questions: filteredQuestions.map((q: any, index: number) => ({
          id: index + 1,
          content: q.question,
          position: {
            x1: q.answer_location[0],
            y1: q.answer_location[1],
            x2: q.answer_location[2],
            y2: q.answer_location[3]
          },
          is_filtered: q.filter
        }))
      };
      
      // 导出自定义格式的JSON
      const jsonString = JSON.stringify(customData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `custom_export_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    
    return customExport;
  };

  return (
    <div>
      <h2>数据导出功能使用示例</h2>
      
      {/* 基本使用 */}
      <ExcalidrawComponent 
        data={sampleData}
        onDataChange={(newData) => {
          console.log('数据已更新:', newData);
          // 在这里可以获取更新后的数据进行自定义处理
          const customExportFn = handleGetCurrentData(newData[0]);
          // 可以在需要时调用 customExportFn()
        }}
      />
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f5f5f5' }}>
        <h3>调用方式说明：</h3>
        
        <h4>1. UI按钮导出（最简单）</h4>
        <p>用户直接点击组件右上角的导出按钮：</p>
        <ul>
          <li><strong>导出JSON</strong>：完整的数据结构，包含所有字段</li>
          <li><strong>导出CSV</strong>：表格格式，适合在Excel中查看</li>
        </ul>
        
        <h4>2. 数据格式说明</h4>
        <p><strong>JSON格式</strong>包含：</p>
        <pre style={{ backgroundColor: '#fff', padding: '10px', fontSize: '12px' }}>
{`{
  "image_url": "图片URL",
  "question_list": [
    {
      "question": "题目内容",
      "answer_location": [x1, y1, x2, y2],
      "filter": true/false
    }
  ]
}`}
        </pre>
        
        <p><strong>CSV格式</strong>包含列：</p>
        <ul>
          <li>题目序号</li>
          <li>题目内容</li>
          <li>答案位置X1, Y1, X2, Y2</li>
          <li>过滤状态</li>
        </ul>
        
        <h4>3. 程序化调用示例</h4>
        <pre style={{ backgroundColor: '#fff', padding: '10px', fontSize: '12px' }}>
{`// 在 onDataChange 回调中获取数据
const handleDataChange = (newData) => {
  const currentData = newData[0];
  
  // 自定义导出逻辑
  if (someCondition) {
    exportCustomFormat(currentData);
  }
};

// 自定义导出函数
const exportCustomFormat = (data) => {
  // 处理数据...
  // 创建下载...
};`}
        </pre>
        
        <h4>4. 文件命名规则</h4>
        <ul>
          <li>JSON: <code>question_data_YYYY-MM-DDTHH-mm-ss.json</code></li>
          <li>CSV: <code>question_data_YYYY-MM-DDTHH-mm-ss.csv</code></li>
        </ul>
        
        <h4>5. 注意事项</h4>
        <ul>
          <li>导出的文件会自动下载到浏览器默认下载目录</li>
          <li>CSV文件支持中文，使用UTF-8编码</li>
          <li>JSON文件保持完整的数据结构，便于程序处理</li>
          <li>导出操作会在控制台输出日志，便于调试</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportUsageExample;

/**
 * 快速调用示例：
 * 
 * 1. 基本使用：
 *    <ExcalidrawComponent data={yourData} onDataChange={handleChange} />
 *    用户点击导出按钮即可
 * 
 * 2. 监听数据变化并自动导出：
 *    const handleChange = (newData) => {
 *      if (shouldAutoExport(newData)) {
 *        // 触发导出逻辑
 *      }
 *    };
 * 
 * 3. 获取当前数据：
 *    在 onDataChange 回调中可以获取到最新的数据状态
 */