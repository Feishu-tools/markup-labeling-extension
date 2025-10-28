import React, { useState, useEffect } from 'react';
import { getStructuredData, watchSelectionData, StructuredData } from './get_structured_data';

// 示例组件：展示如何使用工具函数
export function DataDisplayComponent() {
  const [data, setData] = useState<StructuredData | null>(null);
  const [loading, setLoading] = useState(false);

  // 方法1：手动获取数据
  const handleGetData = async () => {
    setLoading(true);
    const result = await getStructuredData();
    setData(result);
    setLoading(false);
  };

  // 方法2：监听选中单元格变化
  useEffect(() => {
    const unwatch = watchSelectionData((newData) => {
      setData(newData);
    });

    return unwatch; // 清理监听器
  }, []);

  return (
    <div>
      <h3>飞书多维表格数据获取工具示例</h3>
      
      <button onClick={handleGetData} disabled={loading}>
        {loading ? '获取中...' : '手动获取数据'}
      </button>

      {data && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h4>获取结果：</h4>
          {data.success ? (
            <div>
              <p><strong>成功获取数据</strong></p>
              <p>表格ID: {data.tableId}</p>
              <p>字段ID: {data.fieldId}</p>
              <p>记录ID: {data.recordId}</p>
              <p>字段类型: {data.fieldType}</p>
              <p>数据内容:</p>
              <pre style={{ background: '#f5f5f5', padding: '10px' }}>
                {JSON.stringify(data.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div style={{ color: 'red' }}>
              <p><strong>获取失败</strong></p>
              <p>错误信息: {data.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 示例：在其他组件中使用工具函数
export async function useDataInOtherComponent() {
  // 获取当前选中单元格的数据
  const currentData = await getStructuredData();
  
  if (currentData.success) {
    console.log('获取到的数据:', currentData.data);
    console.log('字段类型:', currentData.fieldType);
    return currentData.data;
  } else {
    console.error('获取数据失败:', currentData.error);
    return null;
  }
}

// 示例：获取指定位置的数据
export async function getSpecificData(tableId: string, fieldId: string, recordId: string) {
  const result = await getStructuredData({
    tableId,
    fieldId,
    recordId,
    useCurrentSelection: false // 不使用当前选择，使用指定参数
  });
  
  return result;
}