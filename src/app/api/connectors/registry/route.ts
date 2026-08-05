/**
 * /api/connectors/registry — Browse available connector templates
 */
import { NextResponse } from 'next/server';
import { CONNECTOR_TEMPLATES, CONNECTOR_CATEGORIES, CONNECTOR_TYPE_LABELS, CONNECTOR_TYPE_COLORS } from '@/lib/connectors/registry';

export async function GET() {
  try {
    return NextResponse.json({
      templates: CONNECTOR_TEMPLATES,
      categories: CONNECTOR_CATEGORIES,
      typeLabels: CONNECTOR_TYPE_LABELS,
      typeColors: CONNECTOR_TYPE_COLORS,
      total: CONNECTOR_TEMPLATES.length,
    });
  } catch (error) {
    console.error('[Connectors Registry] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch registry' }, { status: 500 });
  }
}
