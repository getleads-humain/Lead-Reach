#!/usr/bin/env python3
"""
LeadReach AI IFSC Corp. — 3-Year Cash Flow Projections Generator
Generates a properly structured CSV and multiple investor-grade charts.

Key Assumptions:
- Platform is in final stages of development (pre-launch)
- Revenue is ZERO during pre-launch (Months 1-4)
- Soft launch begins Month 5 with minimal revenue
- Conservative customer acquisition ramp post-launch
- Seed-Plus round of $5,000,000 received Month 1
- Opening cash balance: $487,200 (from interim balance sheet)
- Company: LeadReach AI IFSC Corp., incorporated in Ontario, Canada
"""

import csv
import os
import math

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import matplotlib.ticker as mticker
import numpy as np

# ─── Font Setup ───
fm.fontManager.addfont('/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['Noto Serif SC', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False
plt.rcParams['figure.dpi'] = 150

OUTPUT_DIR = '/home/z/my-project/download'
CSV_DIR = '/home/z/my-project/docs/investor-docs/1.0_Core_Investment_Thesis'

# ═══════════════════════════════════════════════════════════════
#  PRICING MODEL (Monthly per-seat / per-account)
# ═══════════════════════════════════════════════════════════════
PRICING = {
    'Launchpad (Free)': 0,
    'Scout Plan': 149,
    'Command Plan': 349,
    'Enterprise Plan': 999,
    'Founders Pass': 199,   # Limited-time early adopter offer
    'Setter Plan': 49,
    'Closer Plan': 89,
    'Agency Plan': 249,
}

# ═══════════════════════════════════════════════════════════════
#  CUSTOMER ACQUISITION RAMP (Conservative, B2B SaaS)
# ═══════════════════════════════════════════════════════════════
# Months 1-4: Pre-launch (zero customers)
# Month 5: Soft launch
# Month 6+: Gradual growth with accelerating adoption

def customer_ramp(max_month, launch_month=5, initial=0, growth_rate=1.15):
    """Generate a realistic customer count ramp."""
    counts = []
    for m in range(1, max_month + 1):
        if m < launch_month:
            counts.append(0)
        else:
            months_since_launch = m - launch_month + 1
            count = initial * (growth_rate ** (months_since_launch - 1))
            counts.append(max(0, int(round(count))))
    return counts

# Per-tier customer counts (very conservative)
CUSTOMERS = {
    'Launchpad (Free)':   [0,0,0,0, 8,15,25,38,55,75,100,130, 160,195,235,280,330,385,445,510,580,655,735,820, 910,1005,1105,1210,1320,1435,1555,1680,1810,1945,2085,2230],
    'Scout Plan':         [0,0,0,0, 2,4,7,10,14,19,25,32, 40,49,60,72,86,102,120,140,162,186,213,243, 276,312,352,396,444,497,555,618,687,762,844,933],
    'Command Plan':       [0,0,0,0, 1,2,3,5,7,10,14,18, 23,29,36,44,53,63,75,88,103,120,139,161, 186,214,246,282,323,369,421,479,544,617,699,792],
    'Enterprise Plan':    [0,0,0,0, 0,0,1,1,2,3,4,5, 6,8,10,12,14,17,20,24,28,33,38,44, 51,58,66,75,85,96,108,122,137,154,172,192],
    'Founders Pass':      [0,0,0,0, 3,5,8,10,12,14,16,18, 0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0],  # Limited offer: Months 5-12 only
    'Setter Plan':        [0,0,0,0, 4,7,11,16,22,30,39,50, 62,76,92,111,133,158,186,218,254,295,341,393, 451,516,590,674,768,874,993,1126,1275,1441,1626,1832],
    'Closer Plan':        [0,0,0,0, 2,4,7,10,14,19,25,33, 42,52,64,78,94,113,135,160,189,222,260,304, 354,411,476,551,637,735,847,974,1118,1282,1467,1678],
    'Agency Plan':        [0,0,0,0, 0,1,1,2,3,4,5,7, 9,11,14,17,21,25,30,36,43,51,60,71, 83,97,113,131,152,176,203,234,269,309,354,406],
}

# ═══════════════════════════════════════════════════════════════
#  REVENUE CALCULATION
# ═══════════════════════════════════════════════════════════════
def calc_revenue(tier_name, months=36):
    """Calculate monthly revenue for a subscription tier."""
    price = PRICING[tier_name]
    customers = CUSTOMERS[tier_name][:months]
    return [c * price for c in customers]

# Usage/Overage Revenue (starts small, grows with user base)
USAGE_OVERAGE = [0,0,0,0, 50,120,250,450,750,1200,1800,2700,
                 3800,5200,7000,9200,11800,15000,18800,23300,28500,34600,41700,50000,
                 59500,70500,83000,97200,113200,131200,151500,174300,200000,228500,260200,295500]

# Professional Services Revenue (consulting, onboarding, customization)
PROF_SERVICES = [0,0,0,0, 0,0,0,500,1000,1800,2800,4000,
                 5000,6500,8000,10000,12000,14500,17000,20000,23000,26500,30000,34000,
                 38500,43500,49000,55000,61500,68500,76000,84000,92500,101500,111000,121000]

# ═══════════════════════════════════════════════════════════════
#  COST CALCULATION
# ═══════════════════════════════════════════════════════════════

# --- Cost of Revenue ---
def ai_inference_costs(months=36):
    """AI/LLM costs: low during dev, ramps with usage post-launch."""
    costs = []
    for m in range(1, months + 1):
        if m <= 4:
            costs.append(3000 + m * 200)  # Dev/testing: $3,200-$3,800
        else:
            base = 4500
            ramp = (m - 4) * 1800
            costs.append(min(base + ramp, 85000))
    return costs

def cloud_infrastructure(months=36):
    """AWS/GCP costs: moderate during dev, scales with users."""
    costs = []
    for m in range(1, months + 1):
        if m <= 4:
            costs.append(2000 + m * 100)  # Dev infrastructure: $2,100-$2,400
        else:
            base = 3000
            ramp = (m - 4) * 800
            costs.append(min(base + ramp, 30000))
    return costs

def data_provider_apis(months=36):
    """Third-party data API costs (ZoomInfo, Apollo, etc.)."""
    costs = []
    for m in range(1, months + 1):
        if m <= 4:
            costs.append(1500 + m * 100)  # Dev access: $1,600-$1,900
        else:
            base = 2500
            ramp = (m - 4) * 1200
            costs.append(min(base + ramp, 55000))
    return costs

def customer_support_tools(months=36):
    """Support tools (Intercom, Zendesk, etc.). Zero pre-launch, ramps post-launch."""
    costs = []
    for m in range(1, months + 1):
        if m <= 4:
            costs.append(0)  # No support needed pre-launch
        else:
            base = 300
            ramp = (m - 5) * 150
            costs.append(min(base + ramp, 6000))
    return costs

# --- Operating Expenses ---
def engineering_salaries(months=36):
    """Core engineering team, scales with hiring."""
    costs = []
    for m in range(1, months + 1):
        if m <= 6:
            costs.append(40000)   # 2-3 engineers pre-launch
        elif m <= 12:
            costs.append(50000)   # Add 1-2 after seed
        elif m <= 18:
            costs.append(60000)   # Expand team
        elif m <= 24:
            costs.append(70000)
        elif m <= 30:
            costs.append(80000)
        else:
            costs.append(90000)
    return costs

def sales_marketing_salaries(months=36):
    """Sales & marketing hires. Minimal pre-launch, ramps post-launch."""
    costs = []
    for m in range(1, months + 1):
        if m <= 4:
            costs.append(0)      # No sales team pre-launch
        elif m <= 6:
            costs.append(8000)   # First sales hire
        elif m <= 12:
            costs.append(15000)
        elif m <= 18:
            costs.append(25000)
        elif m <= 24:
            costs.append(35000)
        elif m <= 30:
            costs.append(45000)
        else:
            costs.append(55000)
    return costs

def ga_salaries(months=36):
    """G&A: Finance, HR, Operations."""
    costs = []
    for m in range(1, months + 1):
        if m <= 6:
            costs.append(6000)
        elif m <= 12:
            costs.append(8000)
        elif m <= 18:
            costs.append(10000)
        elif m <= 24:
            costs.append(12000)
        elif m <= 30:
            costs.append(15000)
        else:
            costs.append(18000)
    return costs

def paid_acquisition(months=36):
    """Paid marketing (Google Ads, LinkedIn, content syndication). Zero pre-launch."""
    costs = []
    for m in range(1, months + 1):
        if m <= 4:
            costs.append(0)
        elif m <= 6:
            costs.append(3000)
        elif m <= 9:
            costs.append(6000)
        elif m <= 12:
            costs.append(10000)
        elif m <= 15:
            costs.append(15000)
        elif m <= 18:
            costs.append(20000)
        elif m <= 21:
            costs.append(26000)
        elif m <= 24:
            costs.append(33000)
        elif m <= 27:
            costs.append(40000)
        elif m <= 30:
            costs.append(48000)
        elif m <= 33:
            costs.append(57000)
        else:
            costs.append(67000)
    return costs

def content_brand_marketing(months=36):
    """Content creation, SEO, brand building."""
    costs = []
    for m in range(1, months + 1):
        if m <= 4:
            costs.append(1500)   # Minimal pre-launch content
        elif m <= 8:
            costs.append(3000)
        elif m <= 12:
            costs.append(4000)
        elif m <= 18:
            costs.append(6000)
        elif m <= 24:
            costs.append(8000)
        elif m <= 30:
            costs.append(10000)
        else:
            costs.append(12000)
    return costs

def tools_subscriptions(months=36):
    """SaaS tools (GitHub, Jira, Figma, Slack, etc.)."""
    costs = []
    for m in range(1, months + 1):
        if m <= 4:
            costs.append(2000)
        elif m <= 8:
            costs.append(2500)
        elif m <= 12:
            costs.append(3000)
        elif m <= 18:
            costs.append(3500)
        elif m <= 24:
            costs.append(4500)
        elif m <= 30:
            costs.append(5500)
        else:
            costs.append(6500)
    return costs

def legal_professional(months=36):
    """Legal, accounting, advisory fees."""
    costs = []
    for m in range(1, months + 1):
        if m == 1:
            costs.append(8000)   # Seed round legal costs
        elif m <= 4:
            costs.append(2000)
        elif m <= 8:
            costs.append(2500)
        elif m == 12:
            costs.append(5000)   # Annual audit
        elif m <= 12:
            costs.append(2000)
        elif m <= 16:
            costs.append(2500)
        elif m == 24:
            costs.append(5000)
        elif m <= 24:
            costs.append(2000)
        elif m <= 28:
            costs.append(2500)
        elif m == 36:
            costs.append(5000)
        else:
            costs.append(2000)
    return costs

def office_operations(months=36):
    """Office/remote work stipend, utilities."""
    costs = []
    for m in range(1, months + 1):
        if m <= 12:
            costs.append(1200)
        elif m <= 24:
            costs.append(1800)
        else:
            costs.append(2500)
    return costs

def recruiting_hr(months=36):
    """Recruiting costs, HR tools, benefits administration."""
    costs = []
    for m in range(1, months + 1):
        if m <= 4:
            costs.append(1500)   # Minimal pre-launch
        elif m <= 8:
            costs.append(3000)
        elif m <= 12:
            costs.append(4000)
        elif m <= 18:
            costs.append(6000)
        elif m <= 24:
            costs.append(8000)
        elif m <= 30:
            costs.append(10000)
        else:
            costs.append(12000)
    return costs

# ═══════════════════════════════════════════════════════════════
#  INVESTING ACTIVITIES
# ═══════════════════════════════════════════════════════════════
def equipment_hardware(months=36):
    """Laptop purchases, dev hardware, office equipment."""
    costs = [0] * 36
    costs[0] = 5000    # Initial equipment for dev team (Month 1)
    costs[7] = 4000    # Additional hires (Month 8)
    costs[11] = 3000   # Year 1 refresh
    costs[17] = 5000   # Year 2 hiring
    costs[23] = 4000   # Year 2 refresh
    costs[29] = 6000   # Year 3 hiring
    costs[35] = 5000   # Year 3 refresh
    return costs

def security_compliance(months=36):
    """SOC 2, ISO 27001, GDPR compliance costs."""
    costs = [0] * 36
    costs[3] = 8000    # SOC 2 Type I prep (Month 4)
    costs[8] = 12000   # SOC 2 Type I audit (Month 9)
    costs[14] = 5000   # SOC 2 Type II monitoring (Month 15)
    costs[19] = 15000  # SOC 2 Type II audit (Month 20)
    costs[23] = 5000   # ISO 27001 gap analysis
    costs[29] = 10000  # ISO 27001 certification
    costs[35] = 8000   # Annual compliance renewal
    return costs

# ═══════════════════════════════════════════════════════════════
#  FINANCING ACTIVITIES
# ═══════════════════════════════════════════════════════════════
SEED_PLUS_ROUND = 5000000  # $5M Seed-Plus round

# ═══════════════════════════════════════════════════════════════
#  BUILD ALL DATA
# ═══════════════════════════════════════════════════════════════
M = 36

# Revenue by tier
rev_launchpad = calc_revenue('Launchpad (Free)', M)
rev_scout = calc_revenue('Scout Plan', M)
rev_command = calc_revenue('Command Plan', M)
rev_enterprise = calc_revenue('Enterprise Plan', M)
rev_founders = calc_revenue('Founders Pass', M)
rev_setter = calc_revenue('Setter Plan', M)
rev_closer = calc_revenue('Closer Plan', M)
rev_agency = calc_revenue('Agency Plan', M)
rev_usage = USAGE_OVERAGE[:M]
rev_prof = PROF_SERVICES[:M]

# Total inflows
total_inflows = [rev_launchpad[i] + rev_scout[i] + rev_command[i] + rev_enterprise[i] +
                 rev_founders[i] + rev_setter[i] + rev_closer[i] + rev_agency[i] +
                 rev_usage[i] + rev_prof[i] for i in range(M)]

# Cost of Revenue
cor_ai = ai_inference_costs(M)
cor_cloud = cloud_infrastructure(M)
cor_data = data_provider_apis(M)
cor_support = customer_support_tools(M)
total_cor = [cor_ai[i] + cor_cloud[i] + cor_data[i] + cor_support[i] for i in range(M)]

# Operating Expenses
opx_eng = engineering_salaries(M)
opx_sales = sales_marketing_salaries(M)
opx_ga = ga_salaries(M)
opx_cac = paid_acquisition(M)
opx_content = content_brand_marketing(M)
opx_tools = tools_subscriptions(M)
opx_legal = legal_professional(M)
opx_office = office_operations(M)
opx_recruit = recruiting_hr(M)
total_opx = [opx_eng[i] + opx_sales[i] + opx_ga[i] + opx_cac[i] +
             opx_content[i] + opx_tools[i] + opx_legal[i] + opx_office[i] +
             opx_recruit[i] for i in range(M)]

# Total Operating Cash Outflows
total_outflows = [total_cor[i] + total_opx[i] for i in range(M)]

# Net Operating Cash Flow
net_operating = [total_inflows[i] - total_outflows[i] for i in range(M)]

# Investing Activities
inv_equipment = equipment_hardware(M)
inv_security = security_compliance(M)
total_investing = [-(inv_equipment[i] + inv_security[i]) for i in range(M)]

# Financing Activities
financing = [0] * M
financing[0] = SEED_PLUS_ROUND  # Seed-Plus round received in Month 1
total_financing = financing[:]

# Net Change in Cash
net_change = [net_operating[i] + total_investing[i] + total_financing[i] for i in range(M)]

# Cumulative Cash Position (starting from opening balance)
OPENING_CASH = 487200
cumulative = []
running = OPENING_CASH
for i in range(M):
    running += net_change[i]
    cumulative.append(running)

# ═══════════════════════════════════════════════════════════════
#  YEARLY TOTALS
# ═══════════════════════════════════════════════════════════════
def yearly_total(data, year):
    """Sum monthly data for a given year (1, 2, or 3)."""
    start = (year - 1) * 12
    end = year * 12
    return sum(data[start:end])

# ═══════════════════════════════════════════════════════════════
#  GENERATE CSV
# ═══════════════════════════════════════════════════════════════
def generate_csv():
    headers = ['Category', 'Subcategory']
    for m in range(1, M + 1):
        headers.append(f'Month {m}')
    headers.extend(['Year 1 Total', 'Year 2 Total', 'Year 3 Total', '3-Year Total'])

    rows = []

    def add_row(category, subcategory, data, is_cumulative=False):
        row = [category, subcategory]
        row.extend(data)
        if is_cumulative:
            # For cumulative/balance rows, show ending balance (not sum)
            y1 = data[11]   # End of Year 1
            y2 = data[23]   # End of Year 2
            y3 = data[35]   # End of Year 3
            row.extend([y1, y2, y3, y3])  # 3-Year = final position
        else:
            y1 = yearly_total(data, 1)
            y2 = yearly_total(data, 2)
            y3 = yearly_total(data, 3)
            row.extend([y1, y2, y3, y1 + y2 + y3])
        rows.append(row)

    def add_section_header(title):
        """Add a section header row with no numeric data."""
        row = [title, '']
        row.extend([''] * M)
        row.extend(['', '', '', ''])
        rows.append(row)

    def add_separator():
        rows.append([''] * len(headers))

    # ─── HEADER: Operating Cash Inflows ───
    add_separator()
    add_section_header('OPERATING CASH INFLOWS')

    # B2B Subscription Revenue
    add_row('Subscription Revenue - B2B', 'Launchpad (Free)', rev_launchpad)
    add_row('Subscription Revenue - B2B', 'Scout Plan ($149/mo)', rev_scout)
    add_row('Subscription Revenue - B2B', 'Command Plan ($349/mo)', rev_command)
    add_row('Subscription Revenue - B2B', 'Enterprise Plan ($999/mo)', rev_enterprise)
    add_row('Subscription Revenue - B2B', 'Founders Pass ($199/mo, limited)', rev_founders)

    # B2C Subscription Revenue
    add_row('Subscription Revenue - B2C', 'Setter Plan ($49/mo)', rev_setter)
    add_row('Subscription Revenue - B2C', 'Closer Plan ($89/mo)', rev_closer)
    add_row('Subscription Revenue - B2C', 'Agency Plan ($249/mo)', rev_agency)

    # Other Revenue
    add_row('Usage & Overage Revenue', '', rev_usage)
    add_row('Professional Services', '', rev_prof)

    # Total Inflows
    add_row('Total Operating Cash Inflows', '', total_inflows)

    add_separator()

    # ─── HEADER: Operating Cash Outflows ───
    add_section_header('OPERATING CASH OUTFLOWS')

    # Cost of Revenue
    add_row('Cost of Revenue', 'AI/LLM Inference Costs', cor_ai)
    add_row('Cost of Revenue', 'Cloud Infrastructure (AWS/GCP)', cor_cloud)
    add_row('Cost of Revenue', 'Data Provider API Costs', cor_data)
    add_row('Cost of Revenue', 'Customer Support Tools', cor_support)
    add_row('Total Cost of Revenue', '', total_cor)

    add_separator()

    # Operating Expenses
    add_row('Operating Expenses', 'Engineering Salaries', opx_eng)
    add_row('Operating Expenses', 'Sales & Marketing Salaries', opx_sales)
    add_row('Operating Expenses', 'G&A Salaries', opx_ga)
    add_row('Operating Expenses', 'Paid Acquisition (CAC)', opx_cac)
    add_row('Operating Expenses', 'Content & Brand Marketing', opx_content)
    add_row('Operating Expenses', 'Tools & Software Subscriptions', opx_tools)
    add_row('Operating Expenses', 'Legal & Professional Fees', opx_legal)
    add_row('Operating Expenses', 'Office & Operations', opx_office)
    add_row('Operating Expenses', 'Recruiting & HR', opx_recruit)
    add_row('Total Operating Expenses', '', total_opx)

    add_separator()

    # Total Outflows
    add_row('Total Operating Cash Outflows', '', total_outflows)

    add_separator()

    # ─── NET OPERATING CASH FLOW ───
    add_row('NET OPERATING CASH FLOW', '', net_operating)

    add_separator()

    # ─── INVESTING ACTIVITIES ───
    add_section_header('INVESTING ACTIVITIES')
    add_row('Capital Expenditure', 'Equipment & Hardware', [-x for x in inv_equipment])
    add_row('Capital Expenditure', 'Security & Compliance Certifications', [-x for x in inv_security])
    add_row('Total Investing Cash Flow', '', total_investing)

    add_separator()

    # ─── FINANCING ACTIVITIES ───
    add_section_header('FINANCING ACTIVITIES')
    add_row('Equity Proceeds', 'Seed-Plus Round ($5M)', financing)
    add_row('Total Financing Cash Flow', '', total_financing)

    add_separator()

    # ─── NET CHANGE & CUMULATIVE ───
    add_row('NET CHANGE IN CASH', '', net_change)
    add_row('OPENING CASH BALANCE', '', [OPENING_CASH] + [0]*(M-1))
    add_row('CUMULATIVE CASH POSITION', '', cumulative, is_cumulative=True)

    # Write CSV
    csv_path = os.path.join(CSV_DIR, '3-Yr-CashFlow-Projections.csv')
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Metadata header rows
        writer.writerow(['LeadReach AI IFSC Corp. — 3-Year Cash Flow Projections'])
        writer.writerow(['Incorporated in the Province of Ontario, Canada'])
        writer.writerow([f'Projection Period: 36 months from date of seed funding'])
        writer.writerow([f'Opening Cash Balance: ${OPENING_CASH:,}'])
        writer.writerow([f'Seed-Plus Round: ${SEED_PLUS_ROUND:,}'])
        writer.writerow(['Pre-Launch Period: Months 1-4 (Zero Revenue — Platform in Final Development Stage)'])
        writer.writerow(['Soft Launch: Month 5'])
        writer.writerow(['Currency: USD'])
        writer.writerow([])
        
        writer.writerow(headers)
        for row in rows:
            # Format numbers with commas for readability
            formatted_row = []
            for i, val in enumerate(row):
                if i >= 2 and isinstance(val, (int, float)):
                    formatted_row.append(int(val))
                else:
                    formatted_row.append(val)
            writer.writerow(formatted_row)

    print(f"CSV saved to: {csv_path}")
    return csv_path

# ═══════════════════════════════════════════════════════════════
#  GENERATE CHARTS
# ═══════════════════════════════════════════════════════════════
def generate_charts():
    months = list(range(1, M + 1))
    quarters = [f'Q{(i-1)//3+1}' for i in months]
    year_labels = [f'Y1\nM{m}' if m <= 12 else f'Y2\nM{m}' if m <= 24 else f'Y3\nM{m}' for m in months]

    # Color palette (professional, consistent)
    COLORS = {
        'primary': '#2563EB',      # Blue
        'secondary': '#7C3AED',    # Purple
        'success': '#059669',      # Green
        'warning': '#D97706',      # Amber
        'danger': '#DC2626',       # Red
        'info': '#0891B2',         # Cyan
        'light_blue': '#93C5FD',
        'light_purple': '#C4B5FD',
        'light_green': '#6EE7B7',
        'light_amber': '#FCD34D',
        'bg': '#F8FAFC',
        'grid': '#E2E8F0',
    }

    tier_colors = {
        'Scout Plan': '#2563EB',
        'Command Plan': '#7C3AED',
        'Enterprise Plan': '#059669',
        'Founders Pass': '#D97706',
        'Setter Plan': '#0891B2',
        'Closer Plan': '#DC2626',
        'Agency Plan': '#EC4899',
    }

    # ─── CHART 1: Monthly Revenue vs. Expenses (Line Chart) ───
    fig, ax = plt.subplots(figsize=(16, 7))
    ax.set_facecolor(COLORS['bg'])
    fig.patch.set_facecolor('white')

    ax.plot(months, [x/1000 for x in total_inflows], color=COLORS['success'], linewidth=2.5,
            label='Total Revenue', marker='o', markersize=3, zorder=5)
    ax.plot(months, [x/1000 for x in total_outflows], color=COLORS['danger'], linewidth=2.5,
            label='Total Expenses', marker='s', markersize=3, zorder=5)
    ax.plot(months, [x/1000 for x in net_operating], color=COLORS['primary'], linewidth=2,
            label='Net Operating Cash Flow', linestyle='--', marker='^', markersize=2, zorder=4)

    # Mark pre-launch zone
    ax.axvspan(0.5, 4.5, alpha=0.08, color='gray', label='Pre-Launch Phase')
    ax.axvline(x=4.5, color='gray', linestyle=':', alpha=0.5)
    ax.text(2.5, max(total_outflows)/1000 * 0.95, 'Pre-Launch\n(Zero Revenue)', ha='center',
            fontsize=9, color='gray', fontstyle='italic')

    # Mark break-even point
    for i in range(M):
        if net_operating[i] >= 0:
            ax.annotate(f'Break-even\nMonth {i+1}', xy=(i+1, net_operating[i]/1000),
                       xytext=(i+4, net_operating[i]/1000 + 30),
                       arrowprops=dict(arrowstyle='->', color=COLORS['primary']),
                       fontsize=9, color=COLORS['primary'], fontweight='bold')
            break

    ax.set_title('LeadReach AI IFSC Corp. — Monthly Revenue vs. Expenses (3-Year Projection)',
                fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel('Month', fontsize=11)
    ax.set_ylabel('Amount ($K)', fontsize=11)
    ax.legend(loc='upper left', fontsize=9, framealpha=0.9)
    ax.grid(True, alpha=0.3, linestyle='--')
    ax.set_xlim(1, 36)

    # Add year separators
    for ym in [12.5, 24.5]:
        ax.axvline(x=ym, color='gray', linestyle='-', alpha=0.2)

    plt.tight_layout()
    path1 = os.path.join(OUTPUT_DIR, 'chart_01_revenue_vs_expenses.png')
    fig.savefig(path1, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"Chart 1 saved: {path1}")

    # ─── CHART 2: Revenue Breakdown by Tier (Stacked Area Chart) ───
    fig, ax = plt.subplots(figsize=(16, 7))
    ax.set_facecolor(COLORS['bg'])
    fig.patch.set_facecolor('white')

    tier_data = {
        'Scout Plan': rev_scout,
        'Command Plan': rev_command,
        'Enterprise Plan': rev_enterprise,
        'Founders Pass': rev_founders,
        'Setter Plan': rev_setter,
        'Closer Plan': rev_closer,
        'Agency Plan': rev_agency,
    }

    stack_data = [np.array([d/1000 for d in tier_data[tier]]) for tier in tier_data]
    stack_labels = list(tier_data.keys())
    stack_colors = [tier_colors[t] for t in stack_labels]

    ax.stackplot(months, *stack_data, labels=stack_labels, colors=stack_colors, alpha=0.85)

    ax.axvspan(0.5, 4.5, alpha=0.1, color='gray')
    ax.axvline(x=4.5, color='gray', linestyle=':', alpha=0.5)
    ax.text(2.5, max(total_inflows)/1000 * 0.9, 'Pre-Launch', ha='center',
            fontsize=9, color='gray', fontstyle='italic')

    ax.set_title('LeadReach AI IFSC Corp. — Revenue Breakdown by Subscription Tier',
                fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel('Month', fontsize=11)
    ax.set_ylabel('Monthly Revenue ($K)', fontsize=11)
    ax.legend(loc='upper left', fontsize=8, ncol=2, framealpha=0.9)
    ax.grid(True, alpha=0.3, linestyle='--')
    ax.set_xlim(1, 36)

    for ym in [12.5, 24.5]:
        ax.axvline(x=ym, color='gray', linestyle='-', alpha=0.2)

    plt.tight_layout()
    path2 = os.path.join(OUTPUT_DIR, 'chart_02_revenue_by_tier.png')
    fig.savefig(path2, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"Chart 2 saved: {path2}")

    # ─── CHART 3: Cumulative Cash Position (Area Chart) ───
    fig, ax = plt.subplots(figsize=(16, 7))
    ax.set_facecolor(COLORS['bg'])
    fig.patch.set_facecolor('white')

    cum_k = [c/1000 for c in cumulative]
    ax.fill_between(months, cum_k, alpha=0.3, color=COLORS['primary'])
    ax.plot(months, cum_k, color=COLORS['primary'], linewidth=2.5, zorder=5)

    # Add horizontal line at opening cash
    ax.axhline(y=OPENING_CASH/1000, color=COLORS['warning'], linestyle='--', alpha=0.7,
               label=f'Opening Cash (${OPENING_CASH/1000:.0f}K)')

    # Annotate key milestones
    ax.annotate(f'${cum_k[0]:.0f}K', xy=(1, cum_k[0]), xytext=(3, cum_k[0]+200),
               fontsize=8, color=COLORS['primary'],
               arrowprops=dict(arrowstyle='->', color=COLORS['primary'], alpha=0.7))
    ax.annotate(f'${cum_k[-1]:.0f}K', xy=(36, cum_k[-1]), xytext=(33, cum_k[-1]+200),
               fontsize=8, color=COLORS['primary'],
               arrowprops=dict(arrowstyle='->', color=COLORS['primary'], alpha=0.7))

    # Find lowest point
    min_idx = cum_k.index(min(cum_k))
    ax.annotate(f'Low: ${cum_k[min_idx]:.0f}K\n(Month {min_idx+1})',
               xy=(min_idx+1, cum_k[min_idx]),
               xytext=(min_idx+5, cum_k[min_idx]-300),
               fontsize=8, color=COLORS['danger'],
               arrowprops=dict(arrowstyle='->', color=COLORS['danger'], alpha=0.7))

    ax.set_title('LeadReach AI IFSC Corp. — Cumulative Cash Position (3-Year Projection)',
                fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel('Month', fontsize=11)
    ax.set_ylabel('Cash Position ($K)', fontsize=11)
    ax.legend(loc='best', fontsize=9, framealpha=0.9)
    ax.grid(True, alpha=0.3, linestyle='--')
    ax.set_xlim(1, 36)

    for ym in [12.5, 24.5]:
        ax.axvline(x=ym, color='gray', linestyle='-', alpha=0.2)

    plt.tight_layout()
    path3 = os.path.join(OUTPUT_DIR, 'chart_03_cumulative_cash.png')
    fig.savefig(path3, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"Chart 3 saved: {path3}")

    # ─── CHART 4: Quarterly Net Operating Cash Flow (Bar Chart) ───
    fig, ax = plt.subplots(figsize=(14, 7))
    ax.set_facecolor(COLORS['bg'])
    fig.patch.set_facecolor('white')

    quarterly_net = []
    quarterly_labels = []
    for y in range(3):
        for q in range(4):
            start = y * 12 + q * 3
            end = start + 3
            total = sum(net_operating[start:end])
            quarterly_net.append(total / 1000)
            quarterly_labels.append(f'Y{y+1}Q{q+1}')

    bar_colors = [COLORS['success'] if v >= 0 else COLORS['danger'] for v in quarterly_net]
    bars = ax.bar(range(len(quarterly_labels)), quarterly_net, color=bar_colors, alpha=0.85,
                  edgecolor='white', linewidth=0.5)

    # Add value labels on bars
    for bar, val in zip(bars, quarterly_net):
        ypos = bar.get_height() if val >= 0 else bar.get_height()
        offset = 5 if val >= 0 else -15
        ax.text(bar.get_x() + bar.get_width()/2, ypos + offset,
               f'${val:.0f}K', ha='center', va='bottom' if val >= 0 else 'top',
               fontsize=7, fontweight='bold',
               color=COLORS['success'] if val >= 0 else COLORS['danger'])

    ax.set_xticks(range(len(quarterly_labels)))
    ax.set_xticklabels(quarterly_labels, fontsize=8)
    ax.axhline(y=0, color='black', linewidth=0.8)

    ax.set_title('LeadReach AI IFSC Corp. — Quarterly Net Operating Cash Flow',
                fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel('Quarter', fontsize=11)
    ax.set_ylabel('Net Operating Cash Flow ($K)', fontsize=11)
    ax.grid(True, alpha=0.3, linestyle='--', axis='y')

    # Add year separators
    for x in [3.5, 7.5]:
        ax.axvline(x=x, color='gray', linestyle='-', alpha=0.3)

    plt.tight_layout()
    path4 = os.path.join(OUTPUT_DIR, 'chart_04_quarterly_net_cashflow.png')
    fig.savefig(path4, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"Chart 4 saved: {path4}")

    # ─── CHART 5: Expense Breakdown (Pie Charts - Year 1, 2, 3) ───
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    fig.patch.set_facecolor('white')

    expense_categories = [
        ('Engineering', opx_eng),
        ('Sales & Marketing', opx_sales),
        ('G&A', opx_ga),
        ('Paid Acquisition', opx_cac),
        ('Content & Brand', opx_content),
        ('Tools & Software', opx_tools),
        ('Legal & Professional', opx_legal),
        ('Office & Ops', opx_office),
        ('Recruiting & HR', opx_recruit),
        ('AI/LLM Inference', cor_ai),
        ('Cloud Infra', cor_cloud),
        ('Data APIs', cor_data),
        ('Support Tools', cor_support),
    ]

    pie_colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#0891B2',
                  '#DC2626', '#EC4899', '#6366F1', '#14B8A6', '#F59E0B',
                  '#8B5CF6', '#10B981', '#F97316']

    for idx, year in enumerate([1, 2, 3]):
        ax = axes[idx]
        ax.set_facecolor(COLORS['bg'])
        start = (year - 1) * 12
        end = year * 12

        values = []
        labels = []
        for cat_name, cat_data in expense_categories:
            total = sum(cat_data[start:end])
            if total > 0:
                values.append(total)
                labels.append(cat_name)

        # Sort by value descending
        sorted_pairs = sorted(zip(values, labels), reverse=True)
        values = [p[0] for p in sorted_pairs]
        labels = [p[1] for p in sorted_pairs]
        colors_used = pie_colors[:len(values)]

        wedges, texts, autotexts = ax.pie(
            values, labels=None, autopct='%1.1f%%',
            colors=colors_used, startangle=90,
            pctdistance=0.8, wedgeprops=dict(linewidth=1, edgecolor='white')
        )

        for autotext in autotexts:
            autotext.set_fontsize(6)
        ax.set_title(f'Year {year} Expense Breakdown\n(Total: ${sum(values)/1000:.0f}K)',
                    fontsize=11, fontweight='bold')

    # Add legend
    fig.legend(labels, loc='lower center', ncol=5, fontsize=8, framealpha=0.9,
              bbox_to_anchor=(0.5, -0.02))

    plt.tight_layout(rect=[0, 0.08, 1, 1])
    path5 = os.path.join(OUTPUT_DIR, 'chart_05_expense_breakdown_pie.png')
    fig.savefig(path5, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"Chart 5 saved: {path5}")

    # ─── CHART 6: B2B vs B2C Revenue Split (Stacked Bar - Annual) ───
    fig, ax = plt.subplots(figsize=(12, 7))
    ax.set_facecolor(COLORS['bg'])
    fig.patch.set_facecolor('white')

    b2b_tiers = [rev_scout, rev_command, rev_enterprise, rev_founders]
    b2c_tiers = [rev_setter, rev_closer, rev_agency]
    other_rev = [rev_usage, rev_prof]

    years = ['Year 1', 'Year 2', 'Year 3']
    b2b_yr = [sum(sum(t[(y-1)*12:y*12]) for t in b2b_tiers) for y in [1,2,3]]
    b2c_yr = [sum(sum(t[(y-1)*12:y*12]) for t in b2c_tiers) for y in [1,2,3]]
    other_yr = [sum(sum(t[(y-1)*12:y*12]) for t in other_rev) for y in [1,2,3]]

    x = np.arange(len(years))
    width = 0.5

    p1 = ax.bar(x, [v/1000 for v in b2b_yr], width, label='B2B Subscriptions',
                color=COLORS['primary'], alpha=0.85)
    p2 = ax.bar(x, [v/1000 for v in b2c_yr], width, bottom=[v/1000 for v in b2b_yr],
                label='B2C Subscriptions', color=COLORS['secondary'], alpha=0.85)
    p3 = ax.bar(x, [v/1000 for v in other_yr], width,
                bottom=[(a+b)/1000 for a,b in zip(b2b_yr, b2c_yr)],
                label='Usage & Services', color=COLORS['success'], alpha=0.85)

    # Add value labels
    for i in range(3):
        total = (b2b_yr[i] + b2c_yr[i] + other_yr[i]) / 1000
        ax.text(x[i], total + 20, f'${total:.0f}K', ha='center', fontsize=10, fontweight='bold')

    ax.set_xticks(x)
    ax.set_xticklabels(years, fontsize=11)
    ax.set_title('LeadReach AI IFSC Corp. — Annual Revenue by Segment',
                fontsize=14, fontweight='bold', pad=15)
    ax.set_ylabel('Revenue ($K)', fontsize=11)
    ax.legend(loc='upper left', fontsize=9, framealpha=0.9)
    ax.grid(True, alpha=0.3, linestyle='--', axis='y')

    plt.tight_layout()
    path6 = os.path.join(OUTPUT_DIR, 'chart_06_annual_revenue_segments.png')
    fig.savefig(path6, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"Chart 6 saved: {path6}")

    # ─── CHART 7: Monthly Burn Rate & Runway ───
    fig, ax1 = plt.subplots(figsize=(16, 7))
    ax1.set_facecolor(COLORS['bg'])
    fig.patch.set_facecolor('white')

    # Monthly burn (negative net operating)
    monthly_burn = [-x/1000 for x in net_operating]
    burn_colors = [COLORS['danger'] if b > 0 else COLORS['success'] for b in monthly_burn]

    ax1.bar(months, monthly_burn, color=burn_colors, alpha=0.6, label='Monthly Net Burn/Gain')
    ax1.axhline(y=0, color='black', linewidth=0.8)
    ax1.set_ylabel('Net Burn / Gain ($K)', fontsize=11, color=COLORS['primary'])
    ax1.tick_params(axis='y', labelcolor=COLORS['primary'])

    # Runway in months (on secondary axis)
    ax2 = ax1.twinx()
    runway_months = []
    for i in range(M):
        if net_operating[i] < 0:
            # How many months at current burn rate
            monthly_avg_burn = abs(net_operating[i])
            runway = cumulative[i] / monthly_avg_burn if monthly_avg_burn > 0 else 999
            runway_months.append(min(runway, 60))
        else:
            runway_months.append(60)  # Effectively infinite once profitable

    ax2.plot(months, runway_months, color=COLORS['warning'], linewidth=2,
            label='Runway (months)', linestyle='--', marker='o', markersize=2)
    ax2.set_ylabel('Runway (months)', fontsize=11, color=COLORS['warning'])
    ax2.tick_params(axis='y', labelcolor=COLORS['warning'])
    ax2.set_ylim(0, 65)

    ax1.set_title('LeadReach AI IFSC Corp. — Monthly Cash Burn & Runway',
                fontsize=14, fontweight='bold', pad=15)
    ax1.set_xlabel('Month', fontsize=11)

    # Combine legends
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper right', fontsize=9, framealpha=0.9)

    ax1.grid(True, alpha=0.3, linestyle='--')
    ax1.set_xlim(1, 36)

    for ym in [12.5, 24.5]:
        ax1.axvline(x=ym, color='gray', linestyle='-', alpha=0.2)

    plt.tight_layout()
    path7 = os.path.join(OUTPUT_DIR, 'chart_07_burn_rate_runway.png')
    fig.savefig(path7, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"Chart 7 saved: {path7}")

    # ─── CHART 8: Customer Growth Trajectory (Multi-line) ───
    fig, ax = plt.subplots(figsize=(16, 7))
    ax.set_facecolor(COLORS['bg'])
    fig.patch.set_facecolor('white')

    for tier_name, color in tier_colors.items():
        data = CUSTOMERS[tier_name]
        if max(data) > 0:  # Only plot tiers with customers
            ax.plot(months, data, color=color, linewidth=2, label=tier_name,
                   marker='o', markersize=2)

    # Total paying customers
    total_customers = []
    for i in range(M):
        total = sum(CUSTOMERS[t][i] for t in CUSTOMERS if t != 'Launchpad (Free)')
        total_customers.append(total)
    ax.plot(months, total_customers, color='black', linewidth=2.5, label='Total Paying',
           linestyle='--', marker='s', markersize=2)

    ax.axvspan(0.5, 4.5, alpha=0.08, color='gray')
    ax.axvline(x=4.5, color='gray', linestyle=':', alpha=0.5)
    ax.text(2.5, max(total_customers) * 0.95, 'Pre-Launch', ha='center',
            fontsize=9, color='gray', fontstyle='italic')

    ax.set_title('LeadReach AI IFSC Corp. — Customer Growth Trajectory by Tier',
                fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel('Month', fontsize=11)
    ax.set_ylabel('Number of Customers', fontsize=11)
    ax.legend(loc='upper left', fontsize=8, ncol=2, framealpha=0.9)
    ax.grid(True, alpha=0.3, linestyle='--')
    ax.set_xlim(1, 36)

    for ym in [12.5, 24.5]:
        ax.axvline(x=ym, color='gray', linestyle='-', alpha=0.2)

    plt.tight_layout()
    path8 = os.path.join(OUTPUT_DIR, 'chart_08_customer_growth.png')
    fig.savefig(path8, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"Chart 8 saved: {path8}")

    return [path1, path2, path3, path4, path5, path6, path7, path8]

# ═══════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print("=" * 60)
    print("LeadReach AI IFSC Corp. — 3-Year Cash Flow Projection Generator")
    print("=" * 60)
    print()

    # Key metrics summary
    print("KEY ASSUMPTIONS:")
    print(f"  Opening Cash Balance: ${OPENING_CASH:,}")
    print(f"  Seed-Plus Round: ${SEED_PLUS_ROUND:,}")
    print(f"  Pre-Launch Period: Months 1-4 (Zero Revenue)")
    print(f"  Soft Launch: Month 5")
    print()

    print("YEARLY SUMMARY:")
    for y in [1, 2, 3]:
        rev = yearly_total(total_inflows, y)
        exp = yearly_total(total_outflows, y)
        net = yearly_total(net_operating, y)
        print(f"  Year {y}: Revenue ${rev:,} | Expenses ${exp:,} | Net ${net:,}")

    print()
    print(f"  Final Cash Position (Month 36): ${cumulative[-1]:,}")
    print(f"  3-Year Total Revenue: ${yearly_total(total_inflows,1) + yearly_total(total_inflows,2) + yearly_total(total_inflows,3):,}")
    print()

    # Generate CSV
    csv_path = generate_csv()

    # Generate Charts
    chart_paths = generate_charts()

    print()
    print("=" * 60)
    print("GENERATION COMPLETE")
    print(f"  CSV: {csv_path}")
    print(f"  Charts: {len(chart_paths)} files in {OUTPUT_DIR}")
    print("=" * 60)
