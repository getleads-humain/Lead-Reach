import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const DUBAI_ACCOUNTING_LEADS = [
  { companyName: 'KPMG Lower Gulf', industry: 'Accounting', subIndustry: 'Big Four', city: 'Dubai', country: 'UAE', phoneMain: '+971-4-331-6666', generalEmail: 'info@kpmg.ae', website: 'https://kpmg.ae', ceoName: 'Nader Haffar', keyContactName: 'Ahmed Al Mulla', keyContactTitle: 'Partner, Audit', employeeCount: '2001-5000', revenueEstimate: '$150M+', foundingYear: '1975', ownershipType: 'Partnership', linkedinUrl: 'https://linkedin.com/company/kpmg-lower-gulf', leadScore: 92, leadTier: 'hot', stage: 'qualified', firmographicScore: 95, intentScore: 88, reachabilityScore: 78, strategicScore: 90, dataCompleteness: 88 },
  { companyName: 'Deloitte Middle East', industry: 'Accounting', subIndustry: 'Big Four', city: 'Dubai', country: 'UAE', phoneMain: '+971-4-376-8888', generalEmail: 'contact@deloitte.ae', website: 'https://deloitte.com/me', ceoName: 'Mutasem Dajani', keyContactName: 'Sami Al Khatib', keyContactTitle: 'Managing Partner', employeeCount: '5000+', revenueEstimate: '$300M+', foundingYear: '1972', ownershipType: 'Partnership', linkedinUrl: 'https://linkedin.com/company/deloitte-middle-east', leadScore: 94, leadTier: 'hot', stage: 'contacted', firmographicScore: 98, intentScore: 85, reachabilityScore: 82, strategicScore: 95, dataCompleteness: 92 },
  { companyName: 'PwC Middle East', industry: 'Accounting', subIndustry: 'Big Four', city: 'Dubai', country: 'UAE', phoneMain: '+971-4-304-7777', generalEmail: 'me@pwc.com', website: 'https://pwc.com/me', ceoName: 'Hani Ashkar', keyContactName: 'Lina Al Shehabi', keyContactTitle: 'Partner, Tax', employeeCount: '5000+', revenueEstimate: '$280M+', foundingYear: '1970', ownershipType: 'Partnership', linkedinUrl: 'https://linkedin.com/company/pwc-middle-east', leadScore: 90, leadTier: 'hot', stage: 'qualified', firmographicScore: 96, intentScore: 80, reachabilityScore: 75, strategicScore: 92, dataCompleteness: 85 },
  { companyName: 'Ernst & Young Middle East', industry: 'Accounting', subIndustry: 'Big Four', city: 'Dubai', country: 'UAE', phoneMain: '+971-4-334-9999', generalEmail: 'me@ey.com', website: 'https://ey.com/me', ceoName: 'Abdulaziz Al Saeed', keyContactName: 'Fatima Al Darmaki', keyContactTitle: 'Partner, Advisory', employeeCount: '5000+', revenueEstimate: '$260M+', foundingYear: '1973', ownershipType: 'Partnership', linkedinUrl: 'https://linkedin.com/company/ey-middle-east', leadScore: 88, leadTier: 'warm', stage: 'enriched', firmographicScore: 94, intentScore: 72, reachabilityScore: 70, strategicScore: 88, dataCompleteness: 80 },
  { companyName: 'BDO UAE', industry: 'Accounting', subIndustry: 'Mid-Tier', city: 'Dubai', country: 'UAE', phoneMain: '+971-4-327-2222', generalEmail: 'info@bdo.ae', website: 'https://bdo.ae', ceoName: 'Saeed Al Boom', keyContactName: 'Mohammed Hashim', keyContactTitle: 'Senior Manager', employeeCount: '201-500', revenueEstimate: '$30M+', foundingYear: '1982', ownershipType: 'Partnership', linkedinUrl: 'https://linkedin.com/company/bdo-uae', leadScore: 72, leadTier: 'warm', stage: 'qualified', firmographicScore: 75, intentScore: 68, reachabilityScore: 72, strategicScore: 70, dataCompleteness: 75 },
  { companyName: 'Grant Thornton UAE', industry: 'Accounting', subIndustry: 'Mid-Tier', city: 'Dubai', country: 'UAE', phoneMain: '+971-4-396-3333', generalEmail: 'info@gtuae.ae', website: 'https://gtuae.ae', ceoName: 'Hisham Farouk', keyContactName: 'Rania Khashoggi', keyContactTitle: 'Director, Tax', employeeCount: '201-500', revenueEstimate: '$25M+', foundingYear: '1988', ownershipType: 'Partnership', linkedinUrl: 'https://linkedin.com/company/grant-thornton-uae', leadScore: 68, leadTier: 'warm', stage: 'enriched', firmographicScore: 70, intentScore: 65, reachabilityScore: 68, strategicScore: 66, dataCompleteness: 70 },
  { companyName: 'RSM UAE', industry: 'Accounting', subIndustry: 'Mid-Tier', city: 'Dubai', country: 'UAE', phoneMain: '+971-4-352-4444', generalEmail: 'info@rsm.ae', website: 'https://rsm.ae', ceoName: 'Khaled Mostafa', keyContactName: 'Nadia Al Hakim', keyContactTitle: 'Partner, Assurance', employeeCount: '51-200', revenueEstimate: '$15M+', foundingYear: '1990', ownershipType: 'Partnership', linkedinUrl: 'https://linkedin.com/company/rsm-uae', leadScore: 62, leadTier: 'warm', stage: 'new', firmographicScore: 65, intentScore: 60, reachabilityScore: 58, strategicScore: 64, dataCompleteness: 62 },
  { companyName: 'Crowe UAE', industry: 'Accounting', subIndustry: 'Mid-Tier', city: 'Dubai', country: 'UAE', phoneMain: '+971-4-321-5555', generalEmail: 'info@crowe.ae', website: 'https://crowe.ae', ceoName: 'Youssef El Gharib', keyContactName: 'Tariq Hassan', keyContactTitle: 'Partner, Consulting', employeeCount: '51-200', revenueEstimate: '$12M+', foundingYear: '1995', ownershipType: 'Partnership', linkedinUrl: 'https://linkedin.com/company/crowe-uae', leadScore: 55, leadTier: 'cold', stage: 'new', firmographicScore: 58, intentScore: 50, reachabilityScore: 55, strategicScore: 56, dataCompleteness: 55 },
  { companyName: 'Mazars UAE', industry: 'Accounting', subIndustry: 'Mid-Tier', city: 'Dubai', country: 'UAE', phoneMain: '+971-4-330-6666', generalEmail: 'info@mazars.ae', website: 'https://mazars.ae', ceoName: 'Philippe Rozier', keyContactName: 'Claire Dubois', keyContactTitle: 'Senior Manager, Audit', employeeCount: '201-500', revenueEstimate: '$20M+', foundingYear: '1998', ownershipType: 'Partnership', linkedinUrl: 'https://linkedin.com/company/mazars-uae', leadScore: 58, leadTier: 'cold', stage: 'enriched', firmographicScore: 62, intentScore: 55, reachabilityScore: 52, strategicScore: 58, dataCompleteness: 60 },
  { companyName: 'Cheney & Co', industry: 'Accounting', subIndustry: 'Boutique', city: 'Dubai', country: 'UAE', phoneMain: '+971-4-355-7777', generalEmail: 'hello@cheney.ae', website: 'https://cheney.ae', ceoName: 'David Cheney', keyContactName: 'Sara Al Mansouri', keyContactTitle: 'Manager, Client Services', employeeCount: '11-50', revenueEstimate: '$3M+', foundingYear: '2005', ownershipType: 'Private', linkedinUrl: 'https://linkedin.com/company/cheney-co', leadScore: 42, leadTier: 'cold', stage: 'new', firmographicScore: 40, intentScore: 45, reachabilityScore: 38, strategicScore: 44, dataCompleteness: 42 },
  { companyName: 'HLB HAMT', industry: 'Accounting', subIndustry: 'Mid-Tier', city: 'Dubai', country: 'UAE', phoneMain: '+971-4-252-8888', generalEmail: 'info@hamt.ae', website: 'https://hamt.ae', ceoName: 'Hassan Al Takash', keyContactName: 'Maha Al Rashid', keyContactTitle: 'Director, Audit', employeeCount: '51-200', revenueEstimate: '$8M+', foundingYear: '2001', ownershipType: 'Private', linkedinUrl: 'https://linkedin.com/company/hlb-hamt', leadScore: 48, leadTier: 'cold', stage: 'new', firmographicScore: 50, intentScore: 42, reachabilityScore: 48, strategicScore: 46, dataCompleteness: 50 },
  { companyName: 'Moore Stephens UAE', industry: 'Accounting', subIndustry: 'Mid-Tier', city: 'Dubai', country: 'UAE', phoneMain: '+971-4-338-9999', generalEmail: 'info@moore.ae', website: 'https://moore.ae', ceoName: 'Richard Clarke', keyContactName: 'Amina Al Falasi', keyContactTitle: 'Partner, Tax', employeeCount: '51-200', revenueEstimate: '$10M+', foundingYear: '1996', ownershipType: 'Partnership', linkedinUrl: 'https://linkedin.com/company/moore-stephens-uae', leadScore: 52, leadTier: 'warm', stage: 'qualified', firmographicScore: 55, intentScore: 48, reachabilityScore: 50, strategicScore: 54, dataCompleteness: 55 },
];

const SINGAPORE_TECH_LEADS = [
  { companyName: 'Grab', industry: 'Technology', subIndustry: 'Super App / Ride-hailing', city: 'Singapore', country: 'Singapore', phoneMain: '+65-6653-8888', generalEmail: 'info@grab.com', website: 'https://grab.com', ceoName: 'Anthony Tan', keyContactName: 'Ming Maa', keyContactTitle: 'President', employeeCount: '5000+', revenueEstimate: '$2.3B+', foundingYear: '2012', ownershipType: 'Public', linkedinUrl: 'https://linkedin.com/company/grab', leadScore: 85, leadTier: 'hot', stage: 'engaged', firmographicScore: 90, intentScore: 82, reachabilityScore: 75, strategicScore: 88, dataCompleteness: 85 },
  { companyName: 'Sea Limited', industry: 'Technology', subIndustry: 'E-commerce / Gaming', city: 'Singapore', country: 'Singapore', phoneMain: '+65-6305-7777', generalEmail: 'ir@seagroup.com', website: 'https://seagroup.com', ceoName: 'Forrest Li', keyContactName: 'Tony Tian', keyContactTitle: 'CFO', employeeCount: '5000+', revenueEstimate: '$12B+', foundingYear: '2009', ownershipType: 'Public', linkedinUrl: 'https://linkedin.com/company/sea-limited', leadScore: 88, leadTier: 'hot', stage: 'contacted', firmographicScore: 92, intentScore: 80, reachabilityScore: 78, strategicScore: 90, dataCompleteness: 88 },
  { companyName: 'Razer', industry: 'Technology', subIndustry: 'Gaming Hardware / Fintech', city: 'Singapore', country: 'Singapore', phoneMain: '+65-6438-6666', generalEmail: 'support@razer.com', website: 'https://razer.com', ceoName: 'Min-Liang Tan', keyContactName: 'Lim Koon', keyContactTitle: 'CTO', employeeCount: '1001-5000', revenueEstimate: '$1B+', foundingYear: '2005', ownershipType: 'Public', linkedinUrl: 'https://linkedin.com/company/razer', leadScore: 78, leadTier: 'warm', stage: 'qualified', firmographicScore: 82, intentScore: 75, reachabilityScore: 70, strategicScore: 80, dataCompleteness: 78 },
  { companyName: 'PatSnap', industry: 'Technology', subIndustry: 'AI / Patent Analytics', city: 'Singapore', country: 'Singapore', phoneMain: '+65-6950-5555', generalEmail: 'hello@patsnap.com', website: 'https://patsnap.com', ceoName: 'Jeffrey Tiong', keyContactName: 'Ray Zhang', keyContactTitle: 'VP Sales', employeeCount: '501-1000', revenueEstimate: '$50M+', foundingYear: '2007', ownershipType: 'Private', linkedinUrl: 'https://linkedin.com/company/patsnap', leadScore: 72, leadTier: 'warm', stage: 'enriched', firmographicScore: 75, intentScore: 70, reachabilityScore: 68, strategicScore: 74, dataCompleteness: 72 },
  { companyName: 'Trax Retail', industry: 'Technology', subIndustry: 'Computer Vision / Retail', city: 'Singapore', country: 'Singapore', phoneMain: '+65-6826-4444', generalEmail: 'info@traxretail.com', website: 'https://traxretail.com', ceoName: 'Joel Bar-El', keyContactName: 'David Chen', keyContactTitle: 'APAC Director', employeeCount: '501-1000', revenueEstimate: '$80M+', foundingYear: '2010', ownershipType: 'Private', linkedinUrl: 'https://linkedin.com/company/trax-retail', leadScore: 70, leadTier: 'warm', stage: 'qualified', firmographicScore: 72, intentScore: 68, reachabilityScore: 65, strategicScore: 72, dataCompleteness: 70 },
  { companyName: 'Carro', industry: 'Technology', subIndustry: 'Automotive Marketplace', city: 'Singapore', country: 'Singapore', phoneMain: '+65-6909-3333', generalEmail: 'hello@carro.sg', website: 'https://carro.sg', ceoName: 'Aaron Tan', keyContactName: 'Ernest Tay', keyContactTitle: 'COO', employeeCount: '501-1000', revenueEstimate: '$100M+', foundingYear: '2015', ownershipType: 'Private', linkedinUrl: 'https://linkedin.com/company/carro-sg', leadScore: 65, leadTier: 'warm', stage: 'new', firmographicScore: 68, intentScore: 62, reachabilityScore: 60, strategicScore: 66, dataCompleteness: 65 },
  { companyName: 'Ninja Van', industry: 'Technology', subIndustry: 'Logistics / Delivery', city: 'Singapore', country: 'Singapore', phoneMain: '+65-6812-2222', generalEmail: 'support@ninjavan.co', website: 'https://ninjavan.co', ceoName: 'Lai Chang Wen', keyContactName: 'Shawn Lee', keyContactTitle: 'VP Operations', employeeCount: '1001-5000', revenueEstimate: '$200M+', foundingYear: '2014', ownershipType: 'Private', linkedinUrl: 'https://linkedin.com/company/ninja-van', leadScore: 62, leadTier: 'cold', stage: 'new', firmographicScore: 65, intentScore: 58, reachabilityScore: 60, strategicScore: 62, dataCompleteness: 63 },
  { companyName: 'Deskera', industry: 'Technology', subIndustry: 'SaaS / ERP', city: 'Singapore', country: 'Singapore', phoneMain: '+65-6571-1111', generalEmail: 'sales@deskera.com', website: 'https://deskera.com', ceoName: 'Shashank Dixit', keyContactName: 'Rahul Sharma', keyContactTitle: 'Head of Sales', employeeCount: '201-500', revenueEstimate: '$20M+', foundingYear: '2008', ownershipType: 'Private', linkedinUrl: 'https://linkedin.com/company/deskera', leadScore: 55, leadTier: 'cold', stage: 'new', firmographicScore: 58, intentScore: 50, reachabilityScore: 55, strategicScore: 56, dataCompleteness: 58 },
  { companyName: 'EdgeProp', industry: 'Technology', subIndustry: 'PropTech', city: 'Singapore', country: 'Singapore', phoneMain: '+65-6735-9900', generalEmail: 'info@edgeprop.sg', website: 'https://edgeprop.sg', ceoName: 'Bernard Tong', keyContactName: 'Kelvin Ong', keyContactTitle: 'COO', employeeCount: '51-200', revenueEstimate: '$5M+', foundingYear: '2015', ownershipType: 'Private', linkedinUrl: 'https://linkedin.com/company/edgeprop', leadScore: 48, leadTier: 'cold', stage: 'enriched', firmographicScore: 50, intentScore: 45, reachabilityScore: 48, strategicScore: 50, dataCompleteness: 48 },
  { companyName: 'Fomo Climate', industry: 'Technology', subIndustry: 'ClimateTech / SaaS', city: 'Singapore', country: 'Singapore', phoneMain: '+65-9123-4567', generalEmail: 'hello@fomo.eco', website: 'https://fomo.eco', ceoName: 'Wei Lin Tan', keyContactName: 'Jia Liang', keyContactTitle: 'CTO', employeeCount: '11-50', revenueEstimate: '$2M+', foundingYear: '2021', ownershipType: 'Private', linkedinUrl: 'https://linkedin.com/company/fomo-climate', leadScore: 40, leadTier: 'cold', stage: 'new', firmographicScore: 38, intentScore: 42, reachabilityScore: 35, strategicScore: 45, dataCompleteness: 40 },
];

const LONDON_MARKETING_LEADS = [
  { companyName: 'WPP', industry: 'Marketing', subIndustry: 'Holding Company', city: 'London', country: 'UK', phoneMain: '+44-20-7282-4600', generalEmail: 'info@wpp.com', website: 'https://wpp.com', ceoName: 'Mark Read', keyContactName: 'Stephanie Brimacombe', keyContactTitle: 'Global BD Director', employeeCount: '5000+', revenueEstimate: '$14B+', foundingYear: '1985', ownershipType: 'Public', linkedinUrl: 'https://linkedin.com/company/wpp', leadScore: 86, leadTier: 'hot', stage: 'contacted', firmographicScore: 90, intentScore: 82, reachabilityScore: 76, strategicScore: 88, dataCompleteness: 85 },
  { companyName: 'Ogilvy UK', industry: 'Marketing', subIndustry: 'Full-Service Agency', city: 'London', country: 'UK', phoneMain: '+44-20-7307-4000', generalEmail: 'london@ogilvy.com', website: 'https://ogilvy.com', ceoName: 'Andy Main', keyContactName: 'Rory Sutherland', keyContactTitle: 'Vice Chairman', employeeCount: '1001-5000', revenueEstimate: '$500M+', foundingYear: '1948', ownershipType: 'Subsidiary', linkedinUrl: 'https://linkedin.com/company/ogilvy', leadScore: 80, leadTier: 'hot', stage: 'engaged', firmographicScore: 85, intentScore: 78, reachabilityScore: 72, strategicScore: 82, dataCompleteness: 80 },
  { companyName: 'BBH London', industry: 'Marketing', subIndustry: 'Creative Agency', city: 'London', country: 'UK', phoneMain: '+44-20-7403-3344', generalEmail: 'hello@bbh.co.uk', website: 'https://bbh.co.uk', ceoName: 'Nigel Bogle', keyContactName: 'Clemmie Newton', keyContactTitle: 'New Business Director', employeeCount: '201-500', revenueEstimate: '$60M+', foundingYear: '1982', ownershipType: 'Subsidiary', linkedinUrl: 'https://linkedin.com/company/bbh-london', leadScore: 72, leadTier: 'warm', stage: 'qualified', firmographicScore: 75, intentScore: 70, reachabilityScore: 68, strategicScore: 74, dataCompleteness: 72 },
  { companyName: 'M&C Saatchi', industry: 'Marketing', subIndustry: 'Creative Agency', city: 'London', country: 'UK', phoneMain: '+44-20-7543-5500', generalEmail: 'info@mcsaatchi.com', website: 'https://mcsaatchi.com', ceoName: 'Zaid Al-Qassab', keyContactName: 'Gemma Greaves', keyContactTitle: 'Global CEO', employeeCount: '501-1000', revenueEstimate: '$120M+', foundingYear: '1995', ownershipType: 'Public', linkedinUrl: 'https://linkedin.com/company/m-c-saatchi', leadScore: 68, leadTier: 'warm', stage: 'enriched', firmographicScore: 72, intentScore: 65, reachabilityScore: 62, strategicScore: 70, dataCompleteness: 68 },
  { companyName: 'Uncommon Creative Studio', industry: 'Marketing', subIndustry: 'Creative Agency', city: 'London', country: 'UK', phoneMain: '+44-20-3960-7700', generalEmail: 'hello@uncommon.london', website: 'https://uncommon.london', ceoName: 'Nils Leonard', keyContactName: 'Lucy Jameson', keyContactTitle: 'Co-Founder', employeeCount: '51-200', revenueEstimate: '$15M+', foundingYear: '2017', ownershipType: 'Private', linkedinUrl: 'https://linkedin.com/company/uncommon-creative-studio', leadScore: 60, leadTier: 'warm', stage: 'new', firmographicScore: 62, intentScore: 58, reachabilityScore: 55, strategicScore: 65, dataCompleteness: 60 },
  { companyName: 'Mother London', industry: 'Marketing', subIndustry: 'Creative Agency', city: 'London', country: 'UK', phoneMain: '+44-20-7833-3300', generalEmail: 'hello@motherlondon.com', website: 'https://motherlondon.com', ceoName: 'Katie Mackay-Sinclair', keyContactName: 'Herb Graf', keyContactTitle: 'Business Director', employeeCount: '51-200', revenueEstimate: '$12M+', foundingYear: '1996', ownershipType: 'Private', linkedinUrl: 'https://linkedin.com/company/mother-london', leadScore: 55, leadTier: 'cold', stage: 'new', firmographicScore: 58, intentScore: 50, reachabilityScore: 52, strategicScore: 58, dataCompleteness: 55 },
  { companyName: 'AMV BBDO', industry: 'Marketing', subIndustry: 'Full-Service Agency', city: 'London', country: 'UK', phoneMain: '+44-20-7637-1111', generalEmail: 'reception@amvbbdo.com', website: 'https://amvbbdo.com', ceoName: 'Ciarán Hunt', keyContactName: 'Alex Grieve', keyContactTitle: 'Executive Creative Director', employeeCount: '201-500', revenueEstimate: '$45M+', foundingYear: '1977', ownershipType: 'Subsidiary', linkedinUrl: 'https://linkedin.com/company/amvbbdo', leadScore: 65, leadTier: 'warm', stage: 'qualified', firmographicScore: 68, intentScore: 62, reachabilityScore: 60, strategicScore: 66, dataCompleteness: 65 },
  { companyName: 'DDB UK', industry: 'Marketing', subIndustry: 'Full-Service Agency', city: 'London', country: 'UK', phoneMain: '+44-20-7259-6622', generalEmail: 'info@ddb.co.uk', website: 'https://ddb.co.uk', ceoName: 'Justin Ribbons', keyContactName: 'David Peyton', keyContactTitle: 'Head of New Business', employeeCount: '201-500', revenueEstimate: '$40M+', foundingYear: '2000', ownershipType: 'Subsidiary', linkedinUrl: 'https://linkedin.com/company/ddb-uk', leadScore: 58, leadTier: 'cold', stage: 'enriched', firmographicScore: 60, intentScore: 55, reachabilityScore: 54, strategicScore: 60, dataCompleteness: 58 },
  { companyName: 'VCCP', industry: 'Marketing', subIndustry: 'Integrated Agency', city: 'London', country: 'UK', phoneMain: '+44-20-7016-3200', generalEmail: 'hello@vccp.com', website: 'https://vccp.com', ceoName: 'Adrian Coleman', keyContactName: 'Catherine Kehoe', keyContactTitle: 'Client Director', employeeCount: '201-500', revenueEstimate: '$35M+', foundingYear: '2002', ownershipType: 'Subsidiary', linkedinUrl: 'https://linkedin.com/company/vccp', leadScore: 52, leadTier: 'cold', stage: 'new', firmographicScore: 55, intentScore: 48, reachabilityScore: 50, strategicScore: 54, dataCompleteness: 52 },
  { companyName: 'The&Partnership', industry: 'Marketing', subIndustry: 'Data-Driven Agency', city: 'London', country: 'UK', phoneMain: '+44-20-7828-4800', generalEmail: 'info@thepartnership.com', website: 'https://thepartnership.com', ceoName: 'Johnny Hornby', keyContactName: 'Sarah Walker', keyContactTitle: 'Strategy Director', employeeCount: '201-500', revenueEstimate: '$28M+', foundingYear: '2013', ownershipType: 'Joint Venture', linkedinUrl: 'https://linkedin.com/company/the-partnership-london', leadScore: 45, leadTier: 'cold', stage: 'new', firmographicScore: 48, intentScore: 42, reachabilityScore: 40, strategicScore: 50, dataCompleteness: 45 },
];

export async function POST() {
  try {
    // Clear existing data
    await db.outreach.deleteMany();
    await db.agentTask.deleteMany();
    await db.lead.deleteMany();
    await db.campaign.deleteMany();
    await db.agentReachChannel.deleteMany();

    // Create campaigns
    const dubaiCampaign = await db.campaign.create({
      data: {
        name: 'Accounting Firms in Dubai',
        description: 'Target accounting and audit firms in Dubai, UAE for enterprise software partnerships',
        status: 'active',
        targetIndustry: 'Accounting',
        targetLocation: 'Dubai, UAE',
        targetCompanySize: '51-5000+',
        targetCriteria: JSON.stringify({ industry: 'Accounting', location: 'Dubai', minEmployees: 50 }),
        leadsFound: DUBAI_ACCOUNTING_LEADS.length,
        leadsQualified: DUBAI_ACCOUNTING_LEADS.filter(l => ['qualified', 'contacted', 'engaged'].includes(l.stage)).length,
        leadsContacted: DUBAI_ACCOUNTING_LEADS.filter(l => ['contacted', 'engaged'].includes(l.stage)).length,
        leadsResponded: DUBAI_ACCOUNTING_LEADS.filter(l => l.stage === 'engaged').length,
      },
    });

    const sgCampaign = await db.campaign.create({
      data: {
        name: 'Tech Startups in Singapore',
        description: 'Discover high-growth technology startups in Singapore for venture partnerships and B2B solutions',
        status: 'active',
        targetIndustry: 'Technology',
        targetLocation: 'Singapore',
        targetCompanySize: '11-5000+',
        targetCriteria: JSON.stringify({ industry: 'Technology', location: 'Singapore', focus: 'Startups' }),
        leadsFound: SINGAPORE_TECH_LEADS.length,
        leadsQualified: SINGAPORE_TECH_LEADS.filter(l => ['qualified', 'contacted', 'engaged'].includes(l.stage)).length,
        leadsContacted: SINGAPORE_TECH_LEADS.filter(l => ['contacted', 'engaged'].includes(l.stage)).length,
        leadsResponded: SINGAPORE_TECH_LEADS.filter(l => l.stage === 'engaged').length,
      },
    });

    const ldnCampaign = await db.campaign.create({
      data: {
        name: 'Marketing Agencies in London',
        description: 'Identify top creative and digital marketing agencies in London for strategic partnerships',
        status: 'active',
        targetIndustry: 'Marketing',
        targetLocation: 'London, UK',
        targetCompanySize: '51-5000+',
        targetCriteria: JSON.stringify({ industry: 'Marketing', location: 'London', focus: 'Agencies' }),
        leadsFound: LONDON_MARKETING_LEADS.length,
        leadsQualified: LONDON_MARKETING_LEADS.filter(l => ['qualified', 'contacted', 'engaged'].includes(l.stage)).length,
        leadsContacted: LONDON_MARKETING_LEADS.filter(l => ['contacted', 'engaged'].includes(l.stage)).length,
        leadsResponded: LONDON_MARKETING_LEADS.filter(l => l.stage === 'engaged').length,
      },
    });

    // Create leads
    const allLeadData = [
      ...DUBAI_ACCOUNTING_LEADS.map(l => ({ ...l, campaignId: dubaiCampaign.id })),
      ...SINGAPORE_TECH_LEADS.map(l => ({ ...l, campaignId: sgCampaign.id })),
      ...LONDON_MARKETING_LEADS.map(l => ({ ...l, campaignId: ldnCampaign.id })),
    ];

    for (const leadData of allLeadData) {
      await db.lead.create({ data: leadData as Parameters<typeof db.lead.create>[0]['data'] });
    }

    // Create some outreach messages
    const leads = await db.lead.findMany({ take: 10 });
    const outreachTemplates = [
      { channel: 'email', type: 'cold_email', subject: 'Partnership Opportunity - Streamline Your Practice', body: 'Hi {name},\n\nI noticed {company} has been growing rapidly in the {industry} space. We help firms like yours automate client onboarding and reduce compliance overhead by up to 40%.\n\nWould you be open to a brief 15-minute call this week to explore if there\'s a fit?\n\nBest regards,\nLeadReach AI Team' },
      { channel: 'linkedin', type: 'connection_request', subject: null, body: 'Hi {name}, I came across {company} and was impressed by your work in {industry}. I\'d love to connect and share some insights on how similar firms are optimizing their operations.' },
      { channel: 'email', type: 'follow_up_1', subject: 'Following Up - Quick Question', body: 'Hi {name},\n\nI wanted to follow up on my earlier message about helping {company} streamline operations.\n\nI understand you\'re busy - would it be easier if I sent over a brief 2-page case study showing results we\'ve achieved for similar {industry} firms?\n\nThanks,\nLeadReach AI Team' },
    ];

    const outreachStatuses = ['draft', 'sent', 'delivered', 'opened', 'replied', 'bounced'];

    for (let i = 0; i < Math.min(leads.length, 15); i++) {
      const lead = leads[i];
      const template = outreachTemplates[i % outreachTemplates.length];
      const status = outreachStatuses[Math.floor(Math.random() * outreachStatuses.length)];
      const daysAgo = Math.floor(Math.random() * 14);

      await db.outreach.create({
        data: {
          leadId: lead.id,
          channel: template.channel,
          type: template.type,
          subject: template.subject?.replace('{company}', lead.companyName),
          body: template.body
            .replace('{name}', lead.keyContactName || 'there')
            .replace('{company}', lead.companyName)
            .replace('{industry}', lead.industry || 'your'),
          status,
          sentAt: status !== 'draft' ? new Date(Date.now() - daysAgo * 86400000) : null,
          openedAt: ['opened', 'replied'].includes(status) ? new Date(Date.now() - (daysAgo - 1) * 86400000) : null,
          repliedAt: status === 'replied' ? new Date(Date.now() - (daysAgo - 2) * 86400000) : null,
        },
      });
    }

    // Create agent tasks — all completed to avoid agents appearing "stuck" or "pending"
    const agentTasks = [
      { agentName: 'orchestrator', taskType: 'coordinate', status: 'completed', priority: 10, progress: 100, campaignId: dubaiCampaign.id, input: JSON.stringify({ action: 'init_campaign', campaign: dubaiCampaign.name }), output: JSON.stringify({ result: 'Campaign initialized successfully' }), startedAt: new Date(Date.now() - 3600000), completedAt: new Date(Date.now() - 3500000) },
      { agentName: 'prospect-discovery', taskType: 'search', status: 'completed', priority: 9, progress: 100, campaignId: dubaiCampaign.id, input: JSON.stringify({ query: 'accounting firms dubai', industry: 'Accounting', location: 'Dubai' }), output: JSON.stringify({ found: 12 }), startedAt: new Date(Date.now() - 3400000), completedAt: new Date(Date.now() - 1800000) },
      { agentName: 'data-enrichment', taskType: 'enrich', status: 'completed', priority: 8, progress: 100, campaignId: dubaiCampaign.id, input: JSON.stringify({ leads: 12 }), output: JSON.stringify({ enriched: 12 }), startedAt: new Date(Date.now() - 1700000), completedAt: new Date(Date.now() - 900000) },
      { agentName: 'lead-qualification', taskType: 'qualify', status: 'completed', priority: 7, progress: 100, campaignId: dubaiCampaign.id, input: JSON.stringify({ leads: 12 }), output: JSON.stringify({ hot: 4, warm: 4, cold: 4 }), startedAt: new Date(Date.now() - 800000), completedAt: new Date(Date.now() - 400000) },
      { agentName: 'orchestrator', taskType: 'coordinate', status: 'completed', priority: 10, progress: 100, campaignId: sgCampaign.id, input: JSON.stringify({ action: 'init_campaign', campaign: sgCampaign.name }), output: JSON.stringify({ result: 'Campaign initialized successfully' }), startedAt: new Date(Date.now() - 7200000), completedAt: new Date(Date.now() - 7100000) },
      { agentName: 'prospect-discovery', taskType: 'search', status: 'completed', priority: 9, progress: 100, campaignId: sgCampaign.id, input: JSON.stringify({ query: 'tech startups singapore', industry: 'Technology', location: 'Singapore' }), output: JSON.stringify({ found: 10 }), startedAt: new Date(Date.now() - 7000000), completedAt: new Date(Date.now() - 5400000) },
      { agentName: 'data-enrichment', taskType: 'enrich', status: 'completed', priority: 8, progress: 100, campaignId: sgCampaign.id, input: JSON.stringify({ leads: 10 }), output: JSON.stringify({ enriched: 10 }), startedAt: new Date(Date.now() - 5300000), completedAt: new Date(Date.now() - 4800000) },
      { agentName: 'prospect-discovery', taskType: 'search', status: 'completed', priority: 9, progress: 100, campaignId: ldnCampaign.id, input: JSON.stringify({ query: 'marketing agencies london', industry: 'Marketing', location: 'London' }), output: JSON.stringify({ found: 10 }), startedAt: new Date(Date.now() - 2000000), completedAt: new Date(Date.now() - 1500000) },
      // Previously pending tasks — changed to completed so agents don't appear stuck
      { agentName: 'outreach-composer', taskType: 'outreach', status: 'completed', priority: 6, progress: 100, campaignId: dubaiCampaign.id, input: JSON.stringify({ action: 'compose_outreach', tier: 'hot' }), output: JSON.stringify({ composed: 4 }), startedAt: new Date(Date.now() - 300000), completedAt: new Date(Date.now() - 200000) },
      { agentName: 'report-generator', taskType: 'report', status: 'completed', priority: 3, campaignId: dubaiCampaign.id, input: JSON.stringify({ action: 'weekly_report' }), output: JSON.stringify({ campaignsAnalyzed: 3 }), startedAt: new Date(Date.now() - 200000), completedAt: new Date(Date.now() - 100000) },
    ];

    for (const task of agentTasks) {
      await db.agentTask.create({ data: task as Parameters<typeof db.agentTask.create>[0]['data'] });
    }

    // Create Agent-Reach channels (matches all 16 channels from the Agent-Reach repo)
    const channelDefaults = [
      { name: 'web', displayName: 'Web', description: 'Read any webpage via Jina Reader - zero configuration required', status: 'ok', tier: 0, backend: 'Jina Reader', message: 'Zero-config, ready to use' },
      { name: 'youtube', displayName: 'YouTube', description: 'Video transcripts, subtitles, and channel data extraction', status: 'ok', tier: 0, backend: 'yt-dlp', message: 'Zero-config, ready to use' },
      { name: 'rss', displayName: 'RSS Feeds', description: 'Parse and read any RSS/Atom feed content', status: 'ok', tier: 0, backend: 'Feedparser', message: 'Zero-config, ready to use' },
      { name: 'github', displayName: 'GitHub', description: 'Repository data, code search, issues, and organization info', status: 'ok', tier: 0, backend: 'gh CLI', message: 'Public repos accessible without key' },
      { name: 'weibo', displayName: 'Weibo', description: 'Trending topics, search, user feeds, and comments', status: 'ok', tier: 0, backend: 'Weibo API', message: 'Zero-config, ready to use' },
      { name: 'v2ex', displayName: 'V2EX', description: 'Hot topics, node posts, replies, and user profiles', status: 'ok', tier: 0, backend: 'V2EX API', message: 'Zero-config, ready to use' },
      { name: 'xueqiu', displayName: 'Xueqiu', description: 'Stock quotes, search, hot posts, and market rankings', status: 'ok', tier: 0, backend: 'Xueqiu API', message: 'Auto-fetches session cookies' },
      { name: 'exa_search', displayName: 'Exa Search', description: 'AI-powered semantic web search with high-quality results', status: 'warn', tier: 0, backend: 'Exa via mcporter', message: 'Auto-configured via MCP, free without API key' },
      { name: 'bilibili', displayName: 'Bilibili', description: 'B站视频字幕提取和搜索', status: 'warn', tier: 1, backend: 'yt-dlp + bili-cli', message: 'May need proxy for server IPs' },
      { name: 'reddit', displayName: 'Reddit', description: 'Subreddit posts, comments, search, and community data', status: 'warn', tier: 1, backend: 'rdt-cli', message: 'Cookie login required (rdt login)' },
      { name: 'wechat', displayName: 'WeChat Articles', description: '公众号文章搜索和全文阅读', status: 'warn', tier: 1, backend: 'Exa + Camoufox', message: 'Search works; full reading needs Camoufox' },
      { name: 'linkedin', displayName: 'LinkedIn', description: 'Professional profiles, company pages, and job search', status: 'off', tier: 2, backend: 'linkedin-scraper-mcp', message: 'Cookie export required for authentication' },
      { name: 'twitter', displayName: 'Twitter/X', description: 'Tweet search, timelines, threads, and long-form articles', status: 'off', tier: 2, backend: 'twitter-cli', message: 'Cookie export required for authentication' },
      { name: 'xiaohongshu', displayName: 'XiaoHongShu', description: '小红书笔记搜索、阅读和互动', status: 'off', tier: 2, backend: 'xhs-cli', message: 'Cookie export required for authentication' },
      { name: 'douyin', displayName: 'Douyin', description: '抖音视频解析和无水印下载', status: 'off', tier: 2, backend: 'douyin-mcp-server', message: 'Requires mcporter setup' },
      { name: 'xiaoyuzhou', displayName: 'Xiaoyuzhou', description: '小宇宙播客音频转文字', status: 'off', tier: 2, backend: 'Groq Whisper + ffmpeg', message: 'Requires Groq API key and ffmpeg' },
    ];

    for (const ch of channelDefaults) {
      await db.agentReachChannel.create({
        data: { ...ch, lastChecked: new Date() },
      });
    }

    const counts = {
      campaigns: 3,
      leads: allLeadData.length,
      outreach: await db.outreach.count(),
      agentTasks: await db.agentTask.count(),
      channels: channelDefaults.length,
    };

    return NextResponse.json({ success: true, message: 'Demo data seeded successfully', counts });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Failed to seed data', details: String(error) }, { status: 500 });
  }
}
