import { bitable, IAttachmentField, ITableMeta, FieldType, IFieldMeta } from "@lark-base-open/js-sdk";

// 定义字段数据类型
export interface FieldData {
  fieldId: string;
  fieldName: string;
  fieldType: FieldType;
  value: any;
  isPrimary: boolean;
}

// 定义返回数据的类型
export interface StructuredData {
  success: boolean;
  data?: any;
  error?: string;
  fieldType?: FieldType;
  tableId?: string;
  fieldId?: string;
  recordId?: string;
}

// 定义获取一行所有字段数据的返回类型
export interface RowData {
  success: boolean;
  data?: FieldData[];
  error?: string;
  tableId?: string;
  recordId?: string;
  tableName?: string;
}

// 定义获取表格记录列表的返回类型
export interface RecordListData {
  success: boolean;
  recordIds?: string[];
  error?: string;
  tableId?: string;
  tableName?: string;
}

// 定义选项参数类型
export interface GetDataOptions {
  tableId?: string;
  fieldId?: string;
  recordId?: string;
  useCurrentSelection?: boolean;
}

/**
 * 获取飞书多维表格的结构化数据
 * @param options 配置选项
 * @returns Promise<StructuredData> 返回结构化数据
 */
export async function getStructuredData(options: GetDataOptions = {}): Promise<StructuredData> {
  try {
    let { tableId, fieldId, recordId, useCurrentSelection = true } = options;

    // 如果没有提供具体参数且允许使用当前选择，则获取当前选中的单元格
    if (useCurrentSelection && (!tableId || !fieldId || !recordId)) {
      const selection = await bitable.base.getSelection();
      
      if (!selection.fieldId || !selection.recordId || !selection.tableId) {
        return {
          success: false,
          error: '未选中有效的单元格，请选择一个单元格或提供具体的tableId、fieldId、recordId参数'
        };
      }
      
      tableId = selection.tableId;
      fieldId = selection.fieldId;
      recordId = selection.recordId;
    }

    // 验证必要参数
    if (!tableId || !fieldId || !recordId) {
      return {
        success: false,
        error: '缺少必要参数：tableId、fieldId、recordId'
      };
    }

    // 获取表格和字段信息
    const table = await bitable.base.getTable(tableId);
    const field = await table.getField(fieldId);
    const fieldType = await field.getType();
    
    // 获取字段数据
    const data = await field.getValue(recordId);
    
    return {
      success: true,
      data,
      fieldType,
      tableId,
      fieldId,
      recordId
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取数据时发生未知错误'
    };
  }
}

/**
 * 获取一行数据的所有字段信息
 * @param options 配置选项
 * @returns Promise<RowData> 返回一行数据的所有字段信息
 */
export async function getRowAllFields(options: GetDataOptions = {}): Promise<RowData> {
  try {
    let { tableId, recordId, useCurrentSelection = true } = options;

    // 如果没有提供具体参数且允许使用当前选择，则获取当前选中的单元格
    if (useCurrentSelection && (!tableId || !recordId)) {
      const selection = await bitable.base.getSelection();
      
      if (!selection.recordId || !selection.tableId) {
        return {
          success: false,
          error: '未选中有效的记录，请选择一个单元格或提供具体的tableId、recordId参数'
        };
      }
      
      tableId = selection.tableId;
      recordId = selection.recordId;
    }

    // 验证必要参数
    if (!tableId || !recordId) {
      return {
        success: false,
        error: '缺少必要参数：tableId、recordId'
      };
    }

    // 获取表格信息
    const table = await bitable.base.getTable(tableId);
    const tableMeta = await table.getMeta();
    
    // 获取所有字段的元信息
    const fieldMetaList: IFieldMeta[] = await table.getFieldMetaList();
    
    // 获取记录的所有字段数据
    const fieldDataList: FieldData[] = [];
    
    for (const fieldMeta of fieldMetaList) {
      try {
        const field = await table.getField(fieldMeta.id);
        const value = await field.getValue(recordId);
        
        fieldDataList.push({
          fieldId: fieldMeta.id,
          fieldName: fieldMeta.name,
          fieldType: fieldMeta.type,
          value: value,
          isPrimary: fieldMeta.isPrimary
        });
      } catch (error) {
        // 如果某个字段获取失败，记录错误但继续处理其他字段
        console.warn(`获取字段 ${fieldMeta.name} (${fieldMeta.id}) 的值时出错:`, error);
        fieldDataList.push({
          fieldId: fieldMeta.id,
          fieldName: fieldMeta.name,
          fieldType: fieldMeta.type,
          value: null,
          isPrimary: fieldMeta.isPrimary
        });
      }
    }
    
    return {
      success: true,
      data: fieldDataList,
      tableId,
      recordId,
      tableName: tableMeta.name
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取行数据时发生未知错误'
    };
  }
}

/**
 * 获取表格的所有记录ID列表
 * @param options 配置选项
 * @returns Promise<RecordListData> 返回记录ID列表
 */
export async function getTableRecordIds(options: GetDataOptions = {}): Promise<RecordListData> {
  try {
    let { tableId, useCurrentSelection = true } = options;

    // 如果没有提供tableId且允许使用当前选择，则获取当前选中的表格
    if (useCurrentSelection && !tableId) {
      const selection = await bitable.base.getSelection();
      
      if (!selection.tableId) {
        return {
          success: false,
          error: '未选中有效的表格，请选择一个单元格或提供具体的tableId参数'
        };
      }
      
      tableId = selection.tableId;
    }

    // 验证必要参数
    if (!tableId) {
      return {
        success: false,
        error: '缺少必要参数：tableId'
      };
    }

    // 获取表格信息
    const table = await bitable.base.getTable(tableId);
    const tableMeta = await table.getMeta();
    
    // 获取所有记录ID
    const recordIds = await table.getRecordIdList();
    
    return {
      success: true,
      recordIds,
      tableId,
      tableName: tableMeta.name
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取记录列表时发生未知错误'
    };
  }
}

/**
 * 监听选中单元格变化并获取数据
 * @param callback 数据变化时的回调函数
 * @param options 配置选项
 * @returns 取消监听的函数
 */
export function watchSelectionData(
  callback: (data: StructuredData) => void,
  options: Omit<GetDataOptions, 'useCurrentSelection'> = {}
): () => void {
  const handleSelectionChange = async () => {
    const data = await getStructuredData({ ...options, useCurrentSelection: true });
    callback(data);
  };

  // 初始加载
  handleSelectionChange();

  // 监听选中单元格变化
  const off = bitable.base.onSelectionChange(handleSelectionChange);

  return off;
}

/**
 * 监听选中记录变化并获取所有字段数据
 * @param callback 数据变化时的回调函数
 * @param options 配置选项
 * @returns 取消监听的函数
 */
export function watchRowAllFields(
  callback: (data: RowData) => void,
  options: Omit<GetDataOptions, 'useCurrentSelection'> = {}
): () => void {
  const handleSelectionChange = async () => {
    const data = await getRowAllFields({ ...options, useCurrentSelection: true });
    callback(data);
  };

  // 初始加载
  handleSelectionChange();

  // 监听选中单元格变化
  const off = bitable.base.onSelectionChange(handleSelectionChange);

  return off;
}

// 导出默认函数以保持向后兼容
export default getStructuredData;