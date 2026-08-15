/**
 * Smart Data Analysis API
 * =======================
 * POST /api/enrichment/analyze
 *
 * Accepts a CSV/Excel file, performs deep statistical analysis,
 * type detection, and generates visualization specifications
 * for auto-rendering charts on the frontend.
 */

import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ============================================================
// Types
// ============================================================

type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'email' | 'url' | 'currency' | 'percentage' | 'phone' | 'enum';

interface ColumnProfile {
  name: string;
  type: FieldType;
  totalCount: number;
  filledCount: number;
  nullCount: number;
  uniqueCount: number;
  completeness: number;
  sample: string[];
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stddev?: number;
  quartiles?: { q1: number; q2: number; q3: number };
  topValues?: Array<{ value: string; count: number; pct: number }>;
  distribution?: Array<{ bin: string; count: number }>;
}

interface ChartSpec {
  id: string;
  type: 'bar' | 'pie' | 'line' | 'area' | 'scatter';
  title: string;
  description: string;
  dataKey: string;
  data: Array<Record<string, unknown>>;
  config: Record<string, { label: string; color: string }>;
  xKey?: string;
  yKeys?: string[];
}

// ============================================================
// Type Detection
// ============================================================

function detectType(values: string[]): FieldType {
  const nonEmpty = values.filter(v => v.trim() !== '');
  if (nonEmpty.length === 0) return 'string';
  const sample = nonEmpty.slice(0, Math.min(100, nonEmpty.length));

  if (sample.filter(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)).length > sample.length * 0.7) return 'email';
  if (sample.filter(v => /^https?:\/\/.+/i.test(v)).length > sample.length * 0.7) return 'url';
  if (sample.filter(v => /^[\d\s\-\+\(\)\.]{7,}$/.test(v.trim())).length > sample.length * 0.7) return 'phone';
  if (sample.filter(v => /^[\-]?\d+\.?\d*%$/.test(v.trim())).length > sample.length * 0.7) return 'percentage';
  if (sample.filter(v => /^[\$€£¥][\d,]+\.?\d*$/.test(v.trim()) || /^[\d,]+\.?\d*\s*(USD|EUR|GBP|CAD|AUD)$/i.test(v.trim())).length > sample.length * 0.5) return 'currency';
  if (sample.filter(v => !isNaN(Date.parse(v)) && v.length >= 6).length > sample.length * 0.7) return 'date';
  if (sample.filter(v => ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(v.toLowerCase().trim())).length > sample.length * 0.7) return 'boolean';
  const numericCount = sample.filter(v => !isNaN(Number(v.replace(/[,]/g, '')))).length;
  if (numericCount > sample.length * 0.7) return 'number';
  const unique = new Set(sample.map(v => v.toLowerCase().trim()));
  if (unique.size <= Math.min(20, sample.length * 0.3) && unique.size >= 2) return 'enum';

  return 'string';
}

// ============================================================
// Numeric Stats
// ============================================================

function numericStats(values: string[]): Partial<ColumnProfile> {
  const nums = values
    .filter(v => v.trim() !== '')
    .map(v => Number(v.replace(/[,]/g, '')))
    .filter(n => !isNaN(n));
  if (nums.length === 0) return {};

  nums.sort((a, b) => a - b);
  const sum = nums.reduce((s, n) => s + n, 0);
  const mean = sum / nums.length;
  const variance = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
  const stddev = Math.sqrt(variance);
  const q1Idx = Math.floor(nums.length * 0.25);
  const q2Idx = Math.floor(nums.length * 0.5);
  const q3Idx = Math.floor(nums.length * 0.75);

  const min = nums[0];
  const max = nums[nums.length - 1];
  const binCount = Math.min(10, Math.ceil(Math.sqrt(nums.length)));
  const binWidth = (max - min) / binCount || 1;
  const bins: Array<{ bin: string; count: number }> = [];
  for (let i = 0; i < binCount; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const count = nums.filter(n => n >= binStart && (i === binCount - 1 ? n <= binEnd : n < binEnd)).length;
    bins.push({
      bin: binWidth >= 1 ? `${Math.round(binStart)}` : `${binStart.toFixed(1)}`,
      count,
    });
  }

  return {
    min, max, mean,
    median: nums[q2Idx],
    stddev,
    quartiles: { q1: nums[q1Idx], q2: nums[q2Idx], q3: nums[q3Idx] },
    distribution: bins,
  };
}

// ============================================================
// Categorical Stats
// ============================================================

function categoricalStats(values: string[], total: number): Partial<ColumnProfile> {
  const nonEmpty = values.filter(v => v.trim() !== '');
  const counts = new Map<string, number>();
  for (const v of nonEmpty) {
    const key = v.trim();
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const topValues = sorted.map(([value, count]) => ({
    value, count, pct: Math.round((count / total) * 100),
  }));
  const distribution = sorted.slice(0, 10).map(([value, count]) => ({
    bin: value.length > 20 ? value.slice(0, 18) + '…' : value,
    count,
  }));
  return { topValues, distribution };
}

// ============================================================
// Visualization Recommender
// ============================================================

function recommendCharts(columns: ColumnProfile[]): ChartSpec[] {
  const charts: ChartSpec[] = [];
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];

  // 1. Field Completeness Bar Chart
  const completenessData = [...columns]
    .sort((a, b) => b.completeness - a.completeness)
    .map(col => ({
      field: col.name.length > 15 ? col.name.slice(0, 13) + '…' : col.name,
      completeness: col.completeness,
    }));
  charts.push({
    id: 'field-completeness',
    type: 'bar',
    title: 'Field Completeness',
    description: 'Percentage of records with each field populated',
    dataKey: 'field',
    data: completenessData,
    xKey: 'field',
    yKeys: ['completeness'],
    config: { completeness: { label: 'Completeness %', color: '#10B981' } },
  });

  // 2. Data Type Distribution Pie
  const typeCounts = new Map<string, number>();
  for (const col of columns) typeCounts.set(col.type, (typeCounts.get(col.type) || 0) + 1);
  const typeData = Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count }));
  charts.push({
    id: 'type-distribution',
    type: 'pie',
    title: 'Column Type Distribution',
    description: 'Detected data types across all columns',
    dataKey: 'type',
    data: typeData,
    config: Object.fromEntries(typeData.map((d, i) => [d.type, { label: d.type, color: COLORS[i % COLORS.length] }])),
  });

  // 3. Numeric distribution histograms
  for (const col of columns) {
    if ((col.type === 'number' || col.type === 'currency') && col.distribution && col.distribution.length > 1) {
      charts.push({
        id: `dist-${col.name}`,
        type: 'bar',
        title: `Distribution: ${col.name}`,
        description: `Value distribution (min: ${col.min?.toLocaleString()}, max: ${col.max?.toLocaleString()}, mean: ${col.mean?.toFixed(1)})`,
        dataKey: 'bin',
        data: col.distribution,
        xKey: 'bin',
        yKeys: ['count'],
        config: { count: { label: 'Count', color: COLORS[columns.indexOf(col) % COLORS.length] } },
      });
    }
  }

  // 4. Categorical top values
  for (const col of columns) {
    if ((col.type === 'enum' || col.type === 'string') && col.topValues && col.topValues.length >= 2 && col.uniqueCount <= 30) {
      charts.push({
        id: `top-${col.name}`,
        type: 'bar',
        title: `Top Values: ${col.name}`,
        description: `Most frequent values (${col.uniqueCount} unique)`,
        dataKey: 'value',
        data: col.topValues.slice(0, 10).map(v => ({ value: v.value.length > 20 ? v.value.slice(0, 18) + '…' : v.value, count: v.count })),
        xKey: 'value',
        yKeys: ['count'],
        config: { count: { label: 'Count', color: COLORS[(columns.indexOf(col) + 3) % COLORS.length] } },
      });
    }
  }

  // 5. Completeness Category Pie
  const high = columns.filter(c => c.completeness >= 70).length;
  const med = columns.filter(c => c.completeness >= 40 && c.completeness < 70).length;
  const low = columns.filter(c => c.completeness < 40).length;
  charts.push({
    id: 'completeness-categories',
    type: 'pie',
    title: 'Data Quality Distribution',
    description: 'Fields grouped by completeness level',
    dataKey: 'category',
    data: [
      { category: 'High (≥70%)', count: high },
      { category: 'Medium (40-69%)', count: med },
      { category: 'Low (<40%)', count: low },
    ].filter(d => d.count > 0),
    config: {
      'High (≥70%)': { label: 'High', color: '#10B981' },
      'Medium (40-69%)': { label: 'Medium', color: '#F59E0B' },
      'Low (<40%)': { label: 'Low', color: '#EF4444' },
    },
  });

  return charts;
}

// ============================================================
// POST Handler
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const text = await file.text();
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
      dynamicTyping: false,
    });

    if (result.data.length === 0) return NextResponse.json({ error: 'No data rows found' }, { status: 400 });

    const rows = result.data;
    const headers = result.meta.fields || Object.keys(rows[0]);

    // Profile each column
    const columns: ColumnProfile[] = headers.map(header => {
      const values = rows.map(row => row[header] || '');
      const nonEmpty = values.filter(v => v.trim() !== '');
      const unique = new Set(nonEmpty.map(v => v.trim()));
      const totalCount = rows.length;
      const filledCount = nonEmpty.length;
      const completeness = Math.round((filledCount / totalCount) * 100);
      const type = detectType(values);
      const sample = nonEmpty.slice(0, 5);

      const base: ColumnProfile = {
        name: header, type, totalCount, filledCount,
        nullCount: totalCount - filledCount,
        uniqueCount: unique.size, completeness, sample,
      };

      if (type === 'number' || type === 'currency' || type === 'percentage') {
        const numValues = type === 'currency'
          ? values.map(v => v.replace(/[\$€£¥]/g, '').replace(/,/g, ''))
          : type === 'percentage'
          ? values.map(v => v.replace('%', ''))
          : values;
        Object.assign(base, numericStats(numValues));
      } else {
        Object.assign(base, categoricalStats(values, totalCount));
      }
      return base;
    });

    // Detect duplicate rows
    const rowHashes = rows.map(row => headers.map(h => row[h]?.trim() || '').join('|'));
    const duplicateRows = rowHashes.length - new Set(rowHashes).size;

    const overallCompleteness = columns.length > 0
      ? Math.round(columns.reduce((s, c) => s + c.completeness, 0) / columns.length) : 0;

    // Correlations between numeric pairs
    const correlations: Array<{ colA: string; colB: string; coefficient: number }> = [];
    const numericCols = columns.filter(c => c.type === 'number' || c.type === 'currency');
    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const colA = numericCols[i];
        const colB = numericCols[j];
        const valsA = rows.map(r => Number((r[colA.name] || '').replace(/[,]/g, ''))).filter(n => !isNaN(n));
        const valsB = rows.map(r => Number((r[colB.name] || '').replace(/[,]/g, ''))).filter(n => !isNaN(n));
        if (valsA.length > 5 && valsB.length > 5) {
          const len = Math.min(valsA.length, valsB.length);
          const a = valsA.slice(0, len);
          const b = valsB.slice(0, len);
          const meanA = a.reduce((s, v) => s + v, 0) / len;
          const meanB = b.reduce((s, v) => s + v, 0) / len;
          let cov = 0, varA = 0, varB = 0;
          for (let k = 0; k < len; k++) {
            cov += (a[k] - meanA) * (b[k] - meanB);
            varA += (a[k] - meanA) ** 2;
            varB += (b[k] - meanB) ** 2;
          }
          const denom = Math.sqrt(varA * varB);
          if (denom > 0) {
            const r = cov / denom;
            if (Math.abs(r) > 0.3) correlations.push({ colA: colA.name, colB: colB.name, coefficient: Math.round(r * 100) / 100 });
          }
        }
      }
    }

    const recommendedCharts = recommendCharts(columns);

    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      profile: {
        totalRows: rows.length,
        totalColumns: headers.length,
        columns,
        quality: {
          overallCompleteness,
          duplicateRows,
          outlierColumns: columns.filter(c => c.type === 'number' && c.stddev !== undefined && c.mean !== undefined && c.stddev > Math.abs(c.mean) * 2).map(c => c.name),
          highCardinalityColumns: columns.filter(c => c.uniqueCount > rows.length * 0.8).map(c => c.name),
          recommendedCharts,
        },
        correlations,
      },
    });
  } catch (error) {
    console.error('[analyze] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Analysis failed' }, { status: 500 });
  }
}
