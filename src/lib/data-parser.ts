// ============================================================
// Multi-Format Data Parser — Unified file reading for Enrichment
// ============================================================
// Supports: CSV, TSV, XLSX, XLS, JSON, JSONL, XML, TXT
// Returns normalized tabular data (headers + rows) regardless
// of input format.
// ============================================================

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// ============================================================
// Types
// ============================================================

export interface ParsedData {
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  columnCount: number;
  fileType: SupportedFormat;
  sheetName?: string;       // For Excel files
  sheetNames?: string[];    // All sheet names for Excel
}

export type SupportedFormat = 'csv' | 'tsv' | 'xlsx' | 'xls' | 'json' | 'jsonl' | 'xml' | 'txt' | 'parquet';

export interface ParseOptions {
  maxRows?: number;         // Limit rows parsed (for preview)
  sheetIndex?: number;      // Which Excel sheet to parse
  delimiter?: string;       // Custom delimiter for CSV/TSV
  encoding?: string;        // File encoding
}

// ============================================================
// Format detection
// ============================================================

export function detectFormat(fileName: string, mimeType?: string): SupportedFormat {
  const ext = fileName.toLowerCase().split('.').pop() || '';

  const extMap: Record<string, SupportedFormat> = {
    csv: 'csv',
    tsv: 'tsv',
    xlsx: 'xlsx',
    xls: 'xls',
    json: 'json',
    jsonl: 'jsonl',
    ndjson: 'jsonl',
    xml: 'xml',
    txt: 'txt',
    parquet: 'parquet',
  };

  if (extMap[ext]) return extMap[ext];

  // Fallback: check MIME type
  if (mimeType) {
    if (mimeType.includes('csv')) return 'csv';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'xlsx';
    if (mimeType.includes('json')) return 'json';
    if (mimeType.includes('xml')) return 'xml';
    if (mimeType.includes('tab')) return 'tsv';
  }

  return 'csv'; // Default fallback
}

// ============================================================
// Main parser entry point
// ============================================================

export async function parseFile(
  file: File | Buffer | ArrayBuffer,
  fileName: string,
  options: ParseOptions = {}
): Promise<ParsedData> {
  const format = detectFormat(fileName);
  let buffer: ArrayBuffer;

  if (file instanceof File) {
    buffer = await file.arrayBuffer();
  } else if (Buffer.isBuffer(file)) {
    buffer = (file as Buffer).buffer.slice((file as Buffer).byteOffset, (file as Buffer).byteOffset + (file as Buffer).byteLength) as ArrayBuffer;
  } else {
    buffer = file;
  }

  switch (format) {
    case 'csv':
    case 'tsv':
    case 'txt':
      return parseDelimited(buffer, format, options);
    case 'xlsx':
    case 'xls':
      return parseExcel(buffer, options);
    case 'json':
      return parseJSON(buffer);
    case 'jsonl':
      return parseJSONL(buffer);
    case 'xml':
      return parseXML(buffer);
    case 'parquet':
      return parseParquet(buffer);
    default:
      return parseDelimited(buffer, 'csv', options);
  }
}

// ============================================================
// CSV / TSV / Delimited text parser
// ============================================================

function parseDelimited(
  buffer: ArrayBuffer,
  format: SupportedFormat,
  options: ParseOptions
): ParsedData {
  const text = new TextDecoder(options.encoding || 'utf-8').decode(buffer);
  const delimiter = options.delimiter || (format === 'tsv' ? '\t' : undefined);

  const result = Papa.parse(text, {
    header: true,
    delimiter,
    skipEmptyLines: 'greedy',
    dynamicTyping: true,
    transformHeader: (h: string) => h.trim(),
  });

  let rows = result.data as Record<string, unknown>[];
  if (options.maxRows && rows.length > options.maxRows) {
    rows = rows.slice(0, options.maxRows);
  }

  const headers = result.meta.fields || [];

  return {
    headers,
    rows,
    rowCount: rows.length,
    columnCount: headers.length,
    fileType: format,
  };
}

// ============================================================
// Excel (XLSX / XLS) parser
// ============================================================

function parseExcel(buffer: ArrayBuffer, options: ParseOptions): ParsedData {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;
  const sheetIndex = options.sheetIndex || 0;
  const sheetName = sheetNames[sheetIndex] || sheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return {
      headers: [],
      rows: [],
      rowCount: 0,
      columnCount: 0,
      fileType: 'xlsx',
      sheetNames,
    };
  }

  // Convert to JSON with headers
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  if (rawData.length === 0) {
    return {
      headers: [],
      rows: [],
      rowCount: 0,
      columnCount: 0,
      fileType: 'xlsx',
      sheetName,
      sheetNames,
    };
  }

  // First row as headers
  const headerRow = rawData[0].map((h, i) =>
    h != null ? String(h).trim() : `Column_${i + 1}`
  );

  // Convert data rows
  let rows: Record<string, unknown>[] = rawData.slice(1).map(row => {
    const obj: Record<string, unknown> = {};
    headerRow.forEach((header, idx) => {
      obj[header] = row[idx] != null ? row[idx] : null;
    });
    return obj;
  });

  if (options.maxRows && rows.length > options.maxRows) {
    rows = rows.slice(0, options.maxRows);
  }

  return {
    headers: headerRow,
    rows,
    rowCount: rows.length,
    columnCount: headerRow.length,
    fileType: 'xlsx',
    sheetName,
    sheetNames,
  };
}

// ============================================================
// JSON parser (array of objects or single object)
// ============================================================

function parseJSON(buffer: ArrayBuffer): ParsedData {
  const text = new TextDecoder('utf-8').decode(buffer);

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    // Try fixing common JSON issues (trailing commas, BOM)
    const cleaned = text.replace(/^\uFEFF/, '').replace(/,\s*([}\]])/g, '$1');
    data = JSON.parse(cleaned);
  }

  // Normalize to array of objects
  let rows: Record<string, unknown>[];

  if (Array.isArray(data)) {
    rows = data.map(item => {
      if (typeof item === 'object' && item !== null) {
        return item as Record<string, unknown>;
      }
      return { value: item };
    });
  } else if (typeof data === 'object' && data !== null) {
    // Single object — treat keys as columns
    // Check if it's a nested structure with a data array
    const obj = data as Record<string, unknown>;
    const arrayKey = Object.keys(obj).find(k => Array.isArray(obj[k]));
    if (arrayKey) {
      rows = (obj[arrayKey] as unknown[]).map(item => {
        if (typeof item === 'object' && item !== null) {
          return item as Record<string, unknown>;
        }
        return { value: item };
      });
    } else {
      // Single record
      rows = [obj];
    }
  } else {
    rows = [{ value: data }];
  }

  // Collect all unique headers across rows
  const headerSet = new Set<string>();
  rows.forEach(row => Object.keys(row).forEach(k => headerSet.add(k)));
  const headers = Array.from(headerSet);

  return {
    headers,
    rows,
    rowCount: rows.length,
    columnCount: headers.length,
    fileType: 'json',
  };
}

// ============================================================
// JSONL (JSON Lines) parser
// ============================================================

function parseJSONL(buffer: ArrayBuffer): ParsedData {
  const text = new TextDecoder('utf-8').decode(buffer);
  const lines = text.split('\n').filter(l => l.trim());
  const headerSet = new Set<string>();
  const rows: Record<string, unknown>[] = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line.trim());
      if (typeof obj === 'object' && obj !== null) {
        const row = obj as Record<string, unknown>;
        Object.keys(row).forEach(k => headerSet.add(k));
        rows.push(row);
      } else {
        headerSet.add('value');
        rows.push({ value: obj });
      }
    } catch {
      // Skip malformed lines
    }
  }

  return {
    headers: Array.from(headerSet),
    rows,
    rowCount: rows.length,
    columnCount: headerSet.size,
    fileType: 'jsonl',
  };
}

// ============================================================
// XML parser
// ============================================================

function parseXML(buffer: ArrayBuffer): ParsedData {
  const text = new TextDecoder('utf-8').decode(buffer);

  // Simple XML to tabular converter
  // Strategy: find repeated child elements at the deepest level and use them as rows
  const rows: Record<string, unknown>[] = [];
  const headerSet = new Set<string>();

  // Extract all elements and their text content
  const tagRegex = /<(\w+)[^>]*>([\s\S]*?)<\/\1>/g;

  // Find the repeating element pattern
  const elementCounts: Record<string, number> = {};
  let match: RegExpExecArray | null;

  // Reset regex
  tagRegex.lastIndex = 0;
  while ((match = tagRegex.exec(text)) !== null) {
    const tagName = match[1];
    elementCounts[tagName] = (elementCounts[tagName] || 0) + 1;
  }

  // Find the most repeated element (likely our row element)
  const rowElement = Object.entries(elementCounts)
    .sort((a, b) => b[1] - a[1])[0];

  if (rowElement && rowElement[1] > 1) {
    const rowTag = rowElement[0];
    // Extract all instances of this element
    const rowRegex = new RegExp(`<${rowTag}[^>]*>([\\s\\S]*?)<\\/${rowTag}>`, 'g');
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRegex.exec(text)) !== null) {
      const rowContent = rowMatch[1];
      const row: Record<string, unknown> = {};

      // Parse child elements
      const childRegex = /<(\w+)[^>]*>([\s\S]*?)<\/\1>/g;
      let childMatch: RegExpExecArray | null;
      while ((childMatch = childRegex.exec(rowContent)) !== null) {
        const key = childMatch[1];
        let value: unknown = childMatch[2].trim();

        // Try to parse as number or boolean
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value !== '' && !isNaN(Number(value))) value = Number(value);

        row[key] = value;
        headerSet.add(key);
      }

      // Also handle attributes
      const attrRegex = /<(\w+)\s+([^>]+)\/?>/g;
      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = attrRegex.exec(rowContent)) !== null) {
        const attrStr = attrMatch[2];
        const pairs = attrStr.match(/(\w+)="([^"]*)"/g);
        if (pairs) {
          for (const pair of pairs) {
            const [, key, val] = pair.match(/(\w+)="([^"]*)"/) || [];
            if (key && val) {
              row[`${attrMatch[1]}_${key}`] = val;
              headerSet.add(`${attrMatch[1]}_${key}`);
            }
          }
        }
      }

      if (Object.keys(row).length > 0) {
        rows.push(row);
      }
    }
  } else {
    // Flat XML — treat each element as a column
    tagRegex.lastIndex = 0;
    const flatRow: Record<string, unknown> = {};
    while ((match = tagRegex.exec(text)) !== null) {
      const key = match[1];
      let value: unknown = match[2].trim();
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (value !== '' && !isNaN(Number(value))) value = Number(value);
      flatRow[key] = value;
      headerSet.add(key);
    }
    if (Object.keys(flatRow).length > 0) {
      rows.push(flatRow);
    }
  }

  return {
    headers: Array.from(headerSet),
    rows,
    rowCount: rows.length,
    columnCount: headerSet.size,
    fileType: 'xml',
  };
}

// ============================================================
// Parquet parser (basic — reads via XLSX if available, else stub)
// ============================================================

function parseParquet(_buffer: ArrayBuffer): ParsedData {
  // Parquet requires a dedicated native library (e.g., parquet-wasm or duckdb-wasm)
  // For now, return a helpful error message through the data structure
  return {
    headers: ['Error'],
    rows: [{ Error: 'Parquet format requires server-side processing. Please convert to CSV or XLSX and re-upload.' }],
    rowCount: 1,
    columnCount: 1,
    fileType: 'parquet',
  };
}

// ============================================================
// Data Profiler — Compute statistics for each column
// ============================================================

export interface ColumnProfile {
  name: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'null' | 'mixed';
  nullCount: number;
  nullPercent: number;
  uniqueCount: number;
  uniquePercent: number;
  sampleValues: unknown[];
  // Numeric stats
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  sum?: number;
  percentiles?: { p25: number; p50: number; p75: number; p95: number };
  // Categorical stats
  topValues?: Array<{ value: string; count: number; percent: number }>;
  // Semantic type detection
  semanticType?: string;
}

export interface DataProfile {
  columns: ColumnProfile[];
  totalRows: number;
  totalColumns: number;
  memoryEstimate: string;
  duplicateRowPercent: number;
  overallQuality: number; // 0-100
}

const SEMANTIC_PATTERNS: Record<string, RegExp> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
  url: /^https?:\/\/.+/,
  zipCode: /^\d{5}(-\d{4})?$/,
  ipAddress: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  date: /^\d{4}[-/]\d{2}[-/]\d{2}|^\d{2}[-/]\d{2}[-/]\d{4}/,
  currency: /^[\$€£¥][\d,]+\.?\d*$/,
  percentage: /^-?\d+\.?\d*%$/,
};

const SEMANTIC_NAME_HINTS: Record<string, string[]> = {
  email: ['email', 'e-mail', 'mail', 'email_address'],
  phone: ['phone', 'tel', 'telephone', 'mobile', 'cell', 'fax', 'phone_number'],
  url: ['url', 'website', 'link', 'domain', 'web', 'site', 'homepage'],
  company: ['company', 'company_name', 'organization', 'org', 'business', 'employer', 'firm'],
  person: ['name', 'full_name', 'person', 'contact', 'first_name', 'last_name', 'full name'],
  address: ['address', 'street', 'addr', 'address_line', 'location'],
  city: ['city', 'town', 'municipality'],
  state: ['state', 'province', 'region', 'state_province'],
  country: ['country', 'nation', 'country_code'],
  industry: ['industry', 'sector', 'vertical', 'category', 'business_type'],
  revenue: ['revenue', 'income', 'turnover', 'sales', 'annual_revenue', 'arr', 'mrr'],
  employees: ['employees', 'employee_count', 'headcount', 'size', 'staff_count', 'fte'],
  title: ['title', 'job_title', 'position', 'role', 'designation'],
  linkedin: ['linkedin', 'linkedin_url'],
  twitter: ['twitter', 'handle', 'twitter_handle'],
  sicCode: ['sic', 'sic_code', 'industry_code'],
  naicsCode: ['naics', 'naics_code'],
};

export function profileData(headers: string[], rows: Record<string, unknown>[]): DataProfile {
  const totalRows = rows.length;
  const columnProfiles: ColumnProfile[] = headers.map(name => profileColumn(name, rows, totalRows));

  // Check duplicate rows
  const rowStrings = new Set<string>();
  let duplicateCount = 0;
  for (const row of rows) {
    const key = JSON.stringify(row);
    if (rowStrings.has(key)) duplicateCount++;
    else rowStrings.add(key);
  }

  // Overall quality score
  const avgNullPercent = columnProfiles.reduce((s, c) => s + c.nullPercent, 0) / (columnProfiles.length || 1);
  const avgUniquePercent = columnProfiles.reduce((s, c) => s + c.uniquePercent, 0) / (columnProfiles.length || 1);
  const typeConsistency = columnProfiles.filter(c => c.dataType !== 'mixed' && c.dataType !== 'null').length / (columnProfiles.length || 1);
  const overallQuality = Math.round(
    (100 - avgNullPercent) * 0.4 +
    Math.min(avgUniquePercent, 100) * 0.2 +
    typeConsistency * 100 * 0.2 +
    (100 - (duplicateCount / (totalRows || 1)) * 100) * 0.2
  );

  // Memory estimate
  const jsonSize = JSON.stringify(rows).length;
  const memoryEstimate = jsonSize > 1_000_000
    ? `${(jsonSize / 1_000_000).toFixed(1)} MB`
    : `${(jsonSize / 1_000).toFixed(1)} KB`;

  return {
    columns: columnProfiles,
    totalRows,
    totalColumns: headers.length,
    memoryEstimate,
    duplicateRowPercent: totalRows > 0 ? Math.round((duplicateCount / totalRows) * 100) : 0,
    overallQuality,
  };
}

function profileColumn(name: string, rows: Record<string, unknown>[], totalRows: number): ColumnProfile {
  const values = rows.map(r => r[name]);
  const nonNullValues = values.filter(v => v != null && v !== '');
  const nullCount = totalRows - nonNullValues.length;
  const uniqueValues = new Set(nonNullValues.map(v => String(v)));
  const sampleValues = nonNullValues.slice(0, 20);

  // Detect data type
  const dataType = detectColumnType(nonNullValues);

  const profile: ColumnProfile = {
    name,
    dataType,
    nullCount,
    nullPercent: totalRows > 0 ? Math.round((nullCount / totalRows) * 100) : 0,
    uniqueCount: uniqueValues.size,
    uniquePercent: totalRows > 0 ? Math.round((uniqueValues.size / totalRows) * 100) : 0,
    sampleValues,
  };

  // Compute type-specific statistics
  if (dataType === 'number') {
    const nums = nonNullValues.map(v => Number(v)).filter(n => !isNaN(n));
    if (nums.length > 0) {
      nums.sort((a, b) => a - b);
      profile.min = nums[0];
      profile.max = nums[nums.length - 1];
      profile.sum = nums.reduce((a, b) => a + b, 0);
      profile.mean = profile.sum / nums.length;
      profile.median = nums.length % 2 === 0
        ? (nums[nums.length / 2 - 1] + nums[nums.length / 2]) / 2
        : nums[Math.floor(nums.length / 2)];

      // Standard deviation
      const variance = nums.reduce((s, n) => s + Math.pow(n - profile.mean!, 2), 0) / nums.length;
      profile.stdDev = Math.sqrt(variance);

      // Percentiles
      const p = (pct: number) => {
        const idx = Math.ceil((pct / 100) * nums.length) - 1;
        return nums[Math.max(0, idx)];
      };
      profile.percentiles = { p25: p(25), p50: p(50), p75: p(75), p95: p(95) };
    }
  } else {
    // Categorical / string — compute frequency
    const freq: Record<string, number> = {};
    for (const v of nonNullValues) {
      const key = String(v);
      freq[key] = (freq[key] || 0) + 1;
    }
    profile.topValues = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({
        value,
        count,
        percent: Math.round((count / totalRows) * 100),
      }));
  }

  // Detect semantic type
  profile.semanticType = detectSemanticType(name, nonNullValues);

  return profile;
}

function detectColumnType(values: unknown[]): ColumnProfile['dataType'] {
  if (values.length === 0) return 'null';

  const types = new Set<string>();
  for (const v of values.slice(0, 100)) {
    if (v == null || v === '') continue;
    if (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)))) {
      types.add('number');
    } else if (typeof v === 'boolean' || v === 'true' || v === 'false') {
      types.add('boolean');
    } else if (v instanceof Date) {
      types.add('date');
    } else {
      types.add('string');
    }
  }

  if (types.size === 0) return 'null';
  if (types.size === 1) return Array.from(types)[0] as ColumnProfile['dataType'];
  if (types.size === 2 && types.has('number') && types.has('string')) return 'mixed';
  return 'mixed';
}

function detectSemanticType(columnName: string, values: unknown[]): string | undefined {
  const lowerName = columnName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  // Check name hints first (most reliable)
  for (const [semanticType, hints] of Object.entries(SEMANTIC_NAME_HINTS)) {
    if (hints.some(hint => lowerName.includes(hint))) {
      return semanticType;
    }
  }

  // Check value patterns (sample first 50 values)
  const sampleValues = values.slice(0, 50).filter(v => v != null && v !== '').map(String);
  if (sampleValues.length === 0) return undefined;

  let bestMatch = '';
  let bestMatchRate = 0;

  for (const [semanticType, pattern] of Object.entries(SEMANTIC_PATTERNS)) {
    const matchCount = sampleValues.filter(v => pattern.test(v)).length;
    const matchRate = matchCount / sampleValues.length;
    if (matchRate > bestMatchRate && matchRate > 0.6) {
      bestMatch = semanticType;
      bestMatchRate = matchRate;
    }
  }

  return bestMatch || undefined;
}

// ============================================================
// Chart recommendation engine
// ============================================================

export interface ChartRecommendation {
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'histogram' | 'heatmap' | 'treemap';
  title: string;
  xAxis?: string;
  yAxis?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colorBy?: string;
  description: string;
  priority: number; // 1 = highest
}

export function recommendCharts(profile: DataProfile): ChartRecommendation[] {
  const charts: ChartRecommendation[] = [];
  const numericCols = profile.columns.filter(c => c.dataType === 'number');
  const categoricalCols = profile.columns.filter(c =>
    c.dataType === 'string' && c.uniquePercent > 0 && c.uniquePercent < 80 && c.uniqueCount <= 30
  );
  const dateCols = profile.columns.filter(c => c.dataType === 'date' || c.semanticType === 'date');

  // 1. Bar charts: categorical vs numeric
  for (const catCol of categoricalCols.slice(0, 5)) {
    for (const numCol of numericCols.slice(0, 3)) {
      charts.push({
        chartType: 'bar',
        title: `${numCol.name} by ${catCol.name}`,
        xAxis: catCol.name,
        yAxis: numCol.name,
        xAxisLabel: catCol.name,
        yAxisLabel: numCol.name,
        description: `Distribution of ${numCol.name} across ${catCol.name} categories`,
        priority: 1,
      });
    }
  }

  // 2. Line charts: date vs numeric (time series)
  for (const dateCol of dateCols) {
    for (const numCol of numericCols.slice(0, 3)) {
      charts.push({
        chartType: 'line',
        title: `${numCol.name} over time`,
        xAxis: dateCol.name,
        yAxis: numCol.name,
        xAxisLabel: dateCol.name,
        yAxisLabel: numCol.name,
        description: `Trend of ${numCol.name} over ${dateCol.name}`,
        priority: 1,
      });
    }
  }

  // 3. Pie charts: categorical distribution (top 10 values)
  for (const catCol of categoricalCols.filter(c => c.uniqueCount >= 2 && c.uniqueCount <= 12).slice(0, 3)) {
    charts.push({
      chartType: 'pie',
      title: `${catCol.name} Distribution`,
      colorBy: catCol.name,
      description: `Distribution of values in ${catCol.name}`,
      priority: 2,
    });
  }

  // 4. Scatter plots: numeric vs numeric
  for (let i = 0; i < Math.min(numericCols.length, 4); i++) {
    for (let j = i + 1; j < Math.min(numericCols.length, 4); j++) {
      charts.push({
        chartType: 'scatter',
        title: `${numericCols[i].name} vs ${numericCols[j].name}`,
        xAxis: numericCols[i].name,
        yAxis: numericCols[j].name,
        xAxisLabel: numericCols[i].name,
        yAxisLabel: numericCols[j].name,
        description: `Correlation between ${numericCols[i].name} and ${numericCols[j].name}`,
        priority: 2,
      });
    }
  }

  // 5. Histograms: distribution of numeric columns
  for (const numCol of numericCols.slice(0, 4)) {
    charts.push({
      chartType: 'histogram',
      title: `${numCol.name} Distribution`,
      xAxis: numCol.name,
      xAxisLabel: numCol.name,
      yAxisLabel: 'Frequency',
      description: `Frequency distribution of ${numCol.name}`,
      priority: 3,
    });
  }

  // 6. Area charts: cumulative numeric over order
  if (numericCols.length > 0 && dateCols.length > 0) {
    for (const numCol of numericCols.slice(0, 2)) {
      charts.push({
        chartType: 'area',
        title: `Cumulative ${numCol.name}`,
        xAxis: dateCols[0].name,
        yAxis: numCol.name,
        xAxisLabel: dateCols[0].name,
        yAxisLabel: numCol.name,
        description: `Cumulative view of ${numCol.name} over time`,
        priority: 3,
      });
    }
  }

  // Sort by priority and limit
  return charts.sort((a, b) => a.priority - b.priority).slice(0, 12);
}

// ============================================================
// Validation engine — Check data quality for platform value
// ============================================================

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  column?: string;
  message: string;
  suggestion?: string;
  affectedRows?: number;
  affectedPercent?: number;
}

export interface ValidationResult {
  score: number; // 0-100
  platformValueScore: number; // 0-100 — how useful for lead generation
  issues: ValidationIssue[];
  summary: string;
  platformFit: {
    hasCompanyData: boolean;
    hasContactData: boolean;
    hasLocationData: boolean;
    hasFirmographicData: boolean;
    hasTechnographicData: boolean;
    matchScore: number; // 0-100
    recommendations: string[];
  };
}

export function validateDataset(
  headers: string[],
  rows: Record<string, unknown>[],
  profile: DataProfile
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Check for empty dataset
  if (rows.length === 0) {
    return {
      score: 0,
      platformValueScore: 0,
      issues: [{ severity: 'error', message: 'Dataset is empty', suggestion: 'Upload a file with data' }],
      summary: 'Empty dataset — no data to process',
      platformFit: {
        hasCompanyData: false,
        hasContactData: false,
        hasLocationData: false,
        hasFirmographicData: false,
        hasTechnographicData: false,
        matchScore: 0,
        recommendations: ['Upload a dataset with company or contact information'],
      },
    };
  }

  // 2. Check column quality
  for (const col of profile.columns) {
    if (col.nullPercent > 80) {
      issues.push({
        severity: 'warning',
        column: col.name,
        message: `Column "${col.name}" has ${col.nullPercent}% null values`,
        suggestion: 'Consider removing this column or filling missing values',
        affectedPercent: col.nullPercent,
      });
    }
    if (col.dataType === 'mixed') {
      issues.push({
        severity: 'info',
        column: col.name,
        message: `Column "${col.name}" has mixed data types`,
        suggestion: 'Standardize data types for better analysis',
      });
    }
    if (col.uniquePercent === 100 && col.dataType === 'string' && !col.semanticType) {
      issues.push({
        severity: 'info',
        column: col.name,
        message: `Column "${col.name}" has all unique values — likely an ID column`,
        suggestion: 'This column may be a unique identifier rather than a data field',
      });
    }
  }

  // 3. Check for duplicate rows
  if (profile.duplicateRowPercent > 10) {
    issues.push({
      severity: 'warning',
      message: `${profile.duplicateRowPercent}% of rows are duplicates`,
      suggestion: 'Remove duplicate rows for cleaner analysis',
      affectedPercent: profile.duplicateRowPercent,
    });
  }

  // 4. Check minimum data size
  if (rows.length < 5) {
    issues.push({
      severity: 'info',
      message: 'Dataset has fewer than 5 rows — analysis may not be meaningful',
      suggestion: 'Upload a larger dataset for better insights',
    });
  }

  // 5. Platform fit assessment
  const headerLower = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const semanticTypes = new Set(profile.columns.map(c => c.semanticType).filter(Boolean));

  const hasCompanyData = headerLower.some(h =>
    ['company', 'company_name', 'organization', 'org', 'business', 'employer'].some(k => h.includes(k))
  ) || semanticTypes.has('company');

  const hasContactData = headerLower.some(h =>
    ['email', 'phone', 'tel', 'contact', 'name', 'first_name', 'last_name'].some(k => h.includes(k))
  ) || semanticTypes.has('email') || semanticTypes.has('phone') || semanticTypes.has('person');

  const hasLocationData = headerLower.some(h =>
    ['city', 'state', 'country', 'address', 'zip', 'postal', 'location', 'region'].some(k => h.includes(k))
  ) || semanticTypes.has('city') || semanticTypes.has('country') || semanticTypes.has('address');

  const hasFirmographicData = headerLower.some(h =>
    ['revenue', 'employees', 'size', 'industry', 'sector', 'founded', 'year'].some(k => h.includes(k))
  ) || semanticTypes.has('revenue') || semanticTypes.has('employees') || semanticTypes.has('industry');

  const hasTechnographicData = headerLower.some(h =>
    ['tech', 'stack', 'technology', 'tools', 'software', 'platform'].some(k => h.includes(k))
  );

  const matchScore = Math.round(
    (hasCompanyData ? 30 : 0) +
    (hasContactData ? 30 : 0) +
    (hasLocationData ? 15 : 0) +
    (hasFirmographicData ? 15 : 0) +
    (hasTechnographicData ? 10 : 0)
  );

  const recommendations: string[] = [];
  if (!hasCompanyData) recommendations.push('Add company/organization names for lead identification');
  if (!hasContactData) recommendations.push('Add email or phone fields for outreach capabilities');
  if (!hasLocationData) recommendations.push('Add location data for geographic targeting');
  if (!hasFirmographicData) recommendations.push('Add industry or employee count for firmographic segmentation');
  if (hasCompanyData && !hasContactData) recommendations.push('Your data can be enriched with contact information using AI enrichment');

  // Calculate scores
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const score = Math.max(0, Math.min(100,
    profile.overallQuality - (errorCount * 20) - (warningCount * 5)
  ));

  const summary = rows.length === 0
    ? 'Empty dataset'
    : `Dataset with ${rows.length} rows and ${headers.length} columns. ` +
      `${hasCompanyData ? 'Contains company data. ' : ''}` +
      `${hasContactData ? 'Contains contact data. ' : ''}` +
      `${matchScore >= 50 ? 'Good platform fit.' : 'Limited platform fit — consider adding company/contact fields.'}`;

  return {
    score,
    platformValueScore: matchScore,
    issues,
    summary,
    platformFit: {
      hasCompanyData,
      hasContactData,
      hasLocationData,
      hasFirmographicData,
      hasTechnographicData,
      matchScore,
      recommendations,
    },
  };
}
