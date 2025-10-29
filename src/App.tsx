import { bitable } from '@lark-base-open/js-sdk';
import './App.css';
import { getStructuredData, watchSelectionData, watchRowAllFields, getTableRecordIds, getRowAllFields, RowData, FieldData, RecordListData, writeDataToField} from './utils/get_structured_data';
import { useState, useEffect, useRef, useCallback } from 'react';
import ExcalidrawComponent from './components/ExcalidrawComponent';
import mockData from './mock/data.json';

export default function App() {
  const [structuredData, setStructuredData] = useState<any>(mockData);
  const [showExcalidraw, setShowExcalidraw] = useState(false);
  const [allFieldsData, setAllFieldsData] = useState<FieldData[]>([]);
  const [recordIds, setRecordIds] = useState<string[]>([]);
  const [currentRecordIndex, setCurrentRecordIndex] = useState<number>(-1);
  const [currentTableId, setCurrentTableId] = useState<string>('');
  
  useEffect(() => {
    // 监听选中记录变化，获取所有字段数据
    const unwatchRowFields = watchRowAllFields(async (rowData: RowData) => {
      
      if (!rowData.success) {
        console.log('获取失败:', rowData.error);
        setAllFieldsData([]);
        return;
      }

      // 如果表格ID发生变化，重新获取记录列表
      if (rowData.tableId && rowData.tableId !== currentTableId) {
        setCurrentTableId(rowData.tableId);
        const recordListData = await getTableRecordIds({ tableId: rowData.tableId, useCurrentSelection: false });
        if (recordListData.success && recordListData.recordIds) {
          setRecordIds(recordListData.recordIds);
          console.log('表格记录总数:', recordListData.recordIds.length);
        }
      }

      // 更新当前记录索引
      if (rowData.recordId && recordIds.length > 0) {
        const index = recordIds.indexOf(rowData.recordId);
        setCurrentRecordIndex(index);
        console.log('当前记录索引:', index + 1, '/', recordIds.length);
      }

      if (rowData.data && rowData.data.length > 0) {
        console.log('字段总数:', rowData.data.length);
        console.log('所有字段详细信息:');
        
        rowData.data.forEach((field: FieldData, index: number) => {
          console.log(`字段 ${index + 1}:`);
          console.log('  - 字段ID:', field.fieldId);
          console.log('  - 字段名称:', field.fieldName);
          console.log('  - 字段类型:', field.fieldType);
          console.log('  - 是否主键:', field.isPrimary);
          console.log('  - 字段值:', field.value);
          console.log('---');
          if (field.fieldName === '输入json') {
            if (field.value === null) {
              setStructuredData({});
            } else {
              let structuredData = '';
              for (const item of field.value) {
                if (item.type === 'text' || item.type === 'url') {
                  structuredData += item.text || '';
                }
              }
              setStructuredData(JSON.parse(structuredData));
            }
          }
        });
        setAllFieldsData(rowData.data);
      } else {
        console.log('没有找到字段数据');
        setAllFieldsData([]);
      }
    });

    // 返回清理函数
    return () => {
      unwatchRowFields();
    };
  }, [currentTableId, recordIds]);

  const handleDataChange = (newData: any, isComplete: number) => {
    setStructuredData(newData);
    console.log('Updated data in App:', newData);
    console.log('isComplete:', isComplete);
    if (isComplete === 2) {
      const WriteData = async () => {
        const writeResult = await writeDataToField("已标注", {
          fieldName: '标注状态',
          useCurrentSelection: false,
          tableId: currentTableId,
          recordId: recordIds[currentRecordIndex]
        });
      }
      WriteData();
      handleNextRow();
    }
  };

  // 上一行按钮点击处理
  const handlePreviousRow = async () => {
    if (currentRecordIndex > 0 && recordIds.length > 0 && currentTableId) {
      const prevIndex = currentRecordIndex - 1;
      const prevRecordId = recordIds[prevIndex];
      
      try {
        // 获取上一行的所有字段数据
        const rowData = await getRowAllFields({ 
          tableId: currentTableId, 
          recordId: prevRecordId, 
          useCurrentSelection: false 
        });
        
        if (rowData.success && rowData.data) {
          setCurrentRecordIndex(prevIndex);
          setAllFieldsData(rowData.data);
          console.log('切换到上一行，索引:', prevIndex + 1, '/', recordIds.length);
          
          // 处理输入json字段
          const jsonField = rowData.data.find(field => field.fieldName === '输入json');
          if (jsonField) {
            if (jsonField.value === null) {
              setStructuredData({});
            } else {
              let structuredData = '';
              for (const item of jsonField.value) {
                if (item.type === 'text' || item.type === 'url') {
                  structuredData += item.text || '';
                }
              }
              setStructuredData(JSON.parse(structuredData));
            }
          }
        }
      } catch (error) {
        console.error('切换到上一行时出错:', error);
      }
    }
  };

  // 下一行按钮点击处理
  const handleNextRow = async () => {
    if (currentRecordIndex < recordIds.length - 1 && recordIds.length > 0 && currentTableId) {
      const nextIndex = currentRecordIndex + 1;
      const nextRecordId = recordIds[nextIndex];
      
      try {
        // 获取下一行的所有字段数据
        const rowData = await getRowAllFields({ 
          tableId: currentTableId, 
          recordId: nextRecordId, 
          useCurrentSelection: false 
        });
        
        if (rowData.success && rowData.data) {
          setCurrentRecordIndex(nextIndex);
          setAllFieldsData(rowData.data);
          console.log('切换到下一行，索引:', nextIndex + 1, '/', recordIds.length);
          
          // 处理输入json字段
          const jsonField = rowData.data.find(field => field.fieldName === '输入json');
          if (jsonField) {
            if (jsonField.value === null) {
              setStructuredData({});
            } else {
              let structuredData = '';
              for (const item of jsonField.value) {
                if (item.type === 'text' || item.type === 'url') {
                  structuredData += item.text || '';
                }
              }
              setStructuredData(JSON.parse(structuredData));
            }
          }
        }
      } catch (error) {
        console.error('切换到下一行时出错:', error);
      }
    }
  };

  return (
    <ExcalidrawComponent data={structuredData} onDataChange={handleDataChange}></ExcalidrawComponent>
  )
}