import { bitable, IAttachmentField, ITableMeta, FieldType } from "@lark-base-open/js-sdk";

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

// 导出默认函数以保持向后兼容
export default getStructuredData;