import type {
  DiscoveryPage,
  JobSourceConnector,
  NormalizedJob,
  SourceHealth,
} from '@jobops/shared-types';

export function buildDemoJobs(now: Date = new Date()): NormalizedJob[] {
  const hoursAgo = (h: number) =>
    new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

  return [
    {
      sourceKey: 'upwork',
      externalId: 'upw-1001',
      canonicalUrl: 'https://www.upwork.com/nx/search/jobs/?q=excel%20inventory%20sku',
      title: 'Excel & Google Sheets Inventory SKU Cleanup and Deduplication',
      description:
        'Clean 4,500-row retail SKU export, standardize variant attributes, flag duplicate barcodes, and deliver a clean reconciliation workbook with validation rules. Ongoing weekly updates possible.',
      category: 'inventory_operations',
      skillsRequired: ['Excel', 'Google Sheets', 'Inventory', 'Data Cleaning'],
      employer: {
        name: 'Pacific Goods Retail',
        accountAgeDays: 420,
        totalHires: 14,
        totalSpentUsd: 8400,
        paymentVerified: true,
        businessPresenceVerified: true,
      },
      locationText: 'Worldwide',
      remoteType: 'remote',
      eligibleCountries: ['Worldwide'],
      eligibilityStatus: 'worldwide',
      compensationMin: 12,
      compensationMax: 18,
      compensationCurrency: 'USD',
      compensationType: 'hourly',
      proposalCount: 4,
      competitionStatus: 'known',
      postedAt: hoursAgo(2),
      retrievedAt: now.toISOString(),
      retrievalMethod: 'demo_seed',
      deliverableClarityScore: 9,
      rawData: { sample: true },
    },
    {
      sourceKey: 'freelancer',
      externalId: 'fl-2002',
      canonicalUrl: 'https://www.freelancer.com/jobs/sql/',
      title: 'SQL Customer & Invoice Table Deduplication Script',
      description:
        'Write PostgreSQL queries to identify duplicate vendor records, reconcile mismatched invoice totals, and export an exception report CSV. Clear deliverables and sample schema provided.',
      category: 'database_operations',
      skillsRequired: ['SQL', 'PostgreSQL', 'Data QA'],
      employer: {
        name: 'LedgerFlow Ops',
        accountAgeDays: 260,
        totalHires: 6,
        totalSpentUsd: 3100,
        paymentVerified: true,
        businessPresenceVerified: false,
      },
      locationText: 'Philippines / Remote',
      remoteType: 'remote',
      eligibleCountries: ['Philippines', 'Worldwide'],
      eligibilityStatus: 'philippines',
      compensationMin: 180,
      compensationMax: 250,
      compensationCurrency: 'USD',
      compensationType: 'fixed',
      proposalCount: 8,
      competitionStatus: 'known',
      postedAt: hoursAgo(5),
      retrievedAt: now.toISOString(),
      retrievalMethod: 'demo_seed',
      deliverableClarityScore: 8,
      rawData: { sample: true },
    },
    {
      sourceKey: 'onlinejobs_ph',
      externalId: 'ojp-3003',
      canonicalUrl: 'https://www.onlinejobs.ph/jobseekers/jobsearch',
      title: 'Part-Time E-Commerce Product & Order Reconciliation Assistant',
      description:
        'Maintain Shopify product variants, update supplier stock sheets, and track shipment exceptions daily. Low-call async role.',
      category: 'ecommerce_operations',
      skillsRequired: ['Shopify', 'Inventory', 'Spreadsheets', 'Order Tracking'],
      employer: {
        name: 'NorthStar Home',
        accountAgeDays: 180,
        totalHires: 3,
        totalSpentUsd: null,
        paymentVerified: null,
        businessPresenceVerified: true,
      },
      locationText: 'Philippines',
      remoteType: 'remote',
      eligibleCountries: ['Philippines'],
      eligibilityStatus: 'philippines',
      compensationMin: 600,
      compensationMax: 800,
      compensationCurrency: 'USD',
      compensationType: 'monthly',
      proposalCount: null,
      competitionStatus: 'not_disclosed',
      postedAt: hoursAgo(4),
      retrievedAt: now.toISOString(),
      retrievalMethod: 'demo_seed',
      deliverableClarityScore: 8,
      rawData: { sample: true },
    },
    {
      sourceKey: 'upwork',
      externalId: 'upw-1004',
      canonicalUrl: 'https://www.upwork.com/nx/search/jobs/?q=pdf%20invoice%20extraction',
      title: 'PDF Supplier Invoice Extraction to Structured Spreadsheet',
      description:
        'Extract line items from 120 monthly PDF supplier invoices into a standardized Google Sheet with automated sum checks.',
      category: 'document_processing',
      skillsRequired: ['PDF Extraction', 'Google Sheets', 'Data Entry'],
      employer: {
        name: 'New Venture Co',
        accountAgeDays: 12,
        totalHires: 0,
        totalSpentUsd: 0,
        paymentVerified: false,
        businessPresenceVerified: false,
      },
      locationText: 'Worldwide',
      remoteType: 'remote',
      eligibleCountries: ['Worldwide'],
      eligibilityStatus: 'worldwide',
      compensationMin: 100,
      compensationMax: 150,
      compensationCurrency: 'USD',
      compensationType: 'fixed',
      proposalCount: 14,
      competitionStatus: 'known',
      postedAt: hoursAgo(9),
      retrievedAt: now.toISOString(),
      retrievalMethod: 'demo_seed',
      deliverableClarityScore: 7,
      rawData: { sample: true },
    },
    {
      sourceKey: 'upwork',
      externalId: 'upw-1005',
      canonicalUrl: 'https://www.upwork.com/nx/search/jobs/?q=crm%20cleanup',
      title: 'High-Competition Data Entry Role (28 proposals)',
      description: 'Routine CRM cleanup.',
      category: 'crm_operations',
      skillsRequired: ['CRM', 'Spreadsheets'],
      employer: { name: 'Acme Corp', paymentVerified: true, totalHires: 5 },
      locationText: 'Worldwide',
      remoteType: 'remote',
      eligibleCountries: ['Worldwide'],
      eligibilityStatus: 'worldwide',
      compensationMin: 10,
      compensationMax: 12,
      compensationCurrency: 'USD',
      compensationType: 'hourly',
      proposalCount: 28,
      competitionStatus: 'known',
      postedAt: hoursAgo(3),
      retrievedAt: now.toISOString(),
      retrievalMethod: 'demo_seed',
      rawData: { sample: true },
    },
    {
      sourceKey: 'freelancer',
      externalId: 'fl-2006',
      canonicalUrl: 'https://www.freelancer.com/jobs/',
      title: 'Complete 20-page unpaid sample audit before contract',
      description: 'Unpaid test assignment required before interview.',
      category: 'quality_operations',
      skillsRequired: ['Data QA'],
      employer: { name: 'Unknown Client', paymentVerified: false, totalHires: 0 },
      locationText: 'Worldwide',
      remoteType: 'remote',
      eligibleCountries: ['Worldwide'],
      eligibilityStatus: 'worldwide',
      compensationMin: 50,
      compensationMax: 50,
      compensationCurrency: 'USD',
      compensationType: 'fixed',
      proposalCount: 2,
      competitionStatus: 'known',
      postedAt: hoursAgo(1),
      retrievedAt: now.toISOString(),
      retrievalMethod: 'demo_seed',
      hasUnpaidTest: true,
      rawData: { sample: true },
    },
  ];
}

export class DemoSeedConnector implements JobSourceConnector {
  sourceKey = 'demo_seed';

  async discover(): Promise<DiscoveryPage> {
    const now = new Date();
    return {
      sourceKey: this.sourceKey,
      jobs: buildDemoJobs(now),
      fetchedAt: now.toISOString(),
    };
  }

  normalize(raw: unknown): NormalizedJob {
    return raw as NormalizedJob;
  }

  async healthCheck(): Promise<SourceHealth> {
    return {
      sourceKey: this.sourceKey,
      healthy: true,
      checkedAt: new Date().toISOString(),
      message: 'Demo seed connector operational',
    };
  }
}

export class UpworkConnector implements JobSourceConnector {
  sourceKey = 'upwork';
  private accessToken?: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken;
  }

  async discover(input: {
    keywords: string[];
    categories: string[];
    since?: string;
    cursor?: string;
  }): Promise<DiscoveryPage> {
    if (!this.accessToken) {
      throw new Error(
        'UPWORK_ACCESS_TOKEN not configured; permitted API access required.'
      );
    }

    const query = input.keywords.join(' OR ') || 'spreadsheet OR sql OR inventory';
    const res = await fetch('https://api.upwork.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query SearchJobs($q: String!) {
          marketplaceJobPostings(marketPlaceJobFilter: { searchTerm_eq: { andTerms_all: [$q] } }) {
            edges { node { id title description createdDateTime totalApplicants } }
          }
        }`,
        variables: { q: query },
      }),
    });

    if (!res.ok) {
      throw new Error(`Upwork API error: ${res.status}`);
    }

    const json = (await res.json()) as {
      data?: { marketplaceJobPostings?: { edges?: Array<{ node: unknown }> } };
    };
    const edges = json.data?.marketplaceJobPostings?.edges ?? [];
    return {
      sourceKey: this.sourceKey,
      jobs: edges.map((e) => this.normalize(e.node)),
      fetchedAt: new Date().toISOString(),
    };
  }

  normalize(raw: unknown): NormalizedJob {
    const r = (raw ?? {}) as Record<string, unknown>;
    const id = String(r.id ?? '');
    const applicants =
      typeof r.totalApplicants === 'number' ? r.totalApplicants : null;
    return {
      sourceKey: this.sourceKey,
      externalId: id || null,
      canonicalUrl: `https://www.upwork.com/jobs/${id}`,
      title: String(r.title ?? 'Untitled Upwork Job'),
      description: String(r.description ?? ''),
      category: 'administrative_operations',
      skillsRequired: Array.isArray(r.skills) ? r.skills.map(String) : [],
      employer: {
        name: typeof r.clientName === 'string' ? r.clientName : null,
        paymentVerified:
          typeof r.paymentVerified === 'boolean' ? r.paymentVerified : null,
      },
      locationText:
        typeof r.location === 'string' ? r.location : null,
      remoteType: 'remote',
      eligibleCountries: [],
      eligibilityStatus: 'unknown',
      compensationMin: null,
      compensationMax: null,
      compensationCurrency: 'USD',
      compensationType: 'unknown',
      proposalCount: applicants,
      competitionStatus: applicants !== null ? 'known' : 'not_disclosed',
      postedAt:
        typeof r.createdDateTime === 'string' ? r.createdDateTime : null,
      retrievedAt: new Date().toISOString(),
      retrievalMethod: 'official_api',
      rawData: r,
    };
  }

  async healthCheck(): Promise<SourceHealth> {
    return {
      sourceKey: this.sourceKey,
      healthy: Boolean(this.accessToken),
      checkedAt: new Date().toISOString(),
      message: this.accessToken
        ? 'Official API token configured'
        : 'UPWORK_ACCESS_TOKEN missing',
    };
  }
}

export class FreelancerConnector implements JobSourceConnector {
  sourceKey = 'freelancer';
  private oauthToken?: string;

  constructor(oauthToken?: string) {
    this.oauthToken = oauthToken;
  }

  async discover(input: {
    keywords: string[];
    categories: string[];
    since?: string;
    cursor?: string;
  }): Promise<DiscoveryPage> {
    if (!this.oauthToken) {
      throw new Error(
        'FREELANCER_OAUTH_TOKEN not configured; permitted API access required.'
      );
    }

    const q = encodeURIComponent(input.keywords.join(' ') || 'excel sql');
    const res = await fetch(
      `https://www.freelancer.com/api/projects/0.1/projects/active/?query=${q}&limit=20&full_description=true`,
      {
        headers: {
          'freelancer-oauth-v1': this.oauthToken,
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Freelancer API error: ${res.status}`);
    }
    const json = (await res.json()) as {
      result?: { projects?: unknown[] };
    };
    const projects = json.result?.projects ?? [];
    return {
      sourceKey: this.sourceKey,
      jobs: projects.map((p) => this.normalize(p)),
      fetchedAt: new Date().toISOString(),
    };
  }

  normalize(raw: unknown): NormalizedJob {
    const r = (raw ?? {}) as Record<string, unknown>;
    const id = String(r.id ?? '');
    const bidStats = (r.bid_stats ?? {}) as Record<string, unknown>;
    const bidCount =
      typeof bidStats.bid_count === 'number' ? bidStats.bid_count : null;
    const budget = (r.budget ?? {}) as Record<string, unknown>;
    const submitDate =
      typeof r.submitdate === 'number'
        ? new Date(r.submitdate * 1000).toISOString()
        : null;

    return {
      sourceKey: this.sourceKey,
      externalId: id || null,
      canonicalUrl: `https://www.freelancer.com/projects/${String(r.seo_url ?? id)}`,
      title: String(r.title ?? 'Untitled Freelancer Project'),
      description: String(r.description ?? r.preview_description ?? ''),
      category: 'administrative_operations',
      skillsRequired: [],
      employer: {
        name: null,
        paymentVerified: null,
      },
      locationText: 'Worldwide',
      remoteType: 'remote',
      eligibleCountries: ['Worldwide'],
      eligibilityStatus: 'worldwide',
      compensationMin:
        typeof budget.minimum === 'number' ? budget.minimum : null,
      compensationMax:
        typeof budget.maximum === 'number' ? budget.maximum : null,
      compensationCurrency: 'USD',
      compensationType: r.type === 'hourly' ? 'hourly' : 'fixed',
      proposalCount: bidCount,
      competitionStatus: bidCount !== null ? 'known' : 'not_disclosed',
      postedAt: submitDate,
      retrievedAt: new Date().toISOString(),
      retrievalMethod: 'official_api',
      rawData: r,
    };
  }

  async healthCheck(): Promise<SourceHealth> {
    return {
      sourceKey: this.sourceKey,
      healthy: Boolean(this.oauthToken),
      checkedAt: new Date().toISOString(),
      message: this.oauthToken
        ? 'Official API token configured'
        : 'FREELANCER_OAUTH_TOKEN missing',
    };
  }
}

export class OnlineJobsPhConnector implements JobSourceConnector {
  sourceKey = 'onlinejobs_ph';
  private feedUrl?: string;

  constructor(feedUrl?: string) {
    this.feedUrl = feedUrl;
  }

  async discover(): Promise<DiscoveryPage> {
    if (!this.feedUrl) {
      throw new Error(
        'ONLINEJOBS_FEED_URL not configured; permitted feed access required.'
      );
    }
    const res = await fetch(this.feedUrl);
    if (!res.ok) {
      throw new Error(`OnlineJobs.ph feed error: ${res.status}`);
    }
    const data = (await res.json()) as { items?: unknown[] };
    return {
      sourceKey: this.sourceKey,
      jobs: (data.items ?? []).map((item) => this.normalize(item)),
      fetchedAt: new Date().toISOString(),
    };
  }

  normalize(raw: unknown): NormalizedJob {
    const r = (raw ?? {}) as Record<string, unknown>;
    const url = String(r.url ?? 'https://www.onlinejobs.ph/');
    return {
      sourceKey: this.sourceKey,
      externalId: r.id ? String(r.id) : null,
      canonicalUrl: url,
      title: String(r.title ?? 'Untitled OnlineJobs.ph Listing'),
      description: String(r.description ?? ''),
      category: 'administrative_operations',
      skillsRequired: Array.isArray(r.skills) ? r.skills.map(String) : [],
      employer: { name: typeof r.employer === 'string' ? r.employer : null },
      locationText: 'Philippines',
      remoteType: 'remote',
      eligibleCountries: ['Philippines'],
      eligibilityStatus: 'philippines',
      compensationMin:
        typeof r.salaryMin === 'number' ? r.salaryMin : null,
      compensationMax:
        typeof r.salaryMax === 'number' ? r.salaryMax : null,
      compensationCurrency: 'USD',
      compensationType: 'monthly',
      // Blueprint §5.1: OnlineJobs.ph does not expose applicant counts; never infer zero
      proposalCount: null,
      competitionStatus: 'not_disclosed',
      postedAt: typeof r.postedAt === 'string' ? r.postedAt : null,
      retrievedAt: new Date().toISOString(),
      retrievalMethod: 'authorized_feed',
      rawData: r,
    };
  }

  async healthCheck(): Promise<SourceHealth> {
    return {
      sourceKey: this.sourceKey,
      healthy: Boolean(this.feedUrl),
      checkedAt: new Date().toISOString(),
      message: this.feedUrl
        ? 'Authorized feed configured'
        : 'ONLINEJOBS_FEED_URL missing',
    };
  }
}

function parseEligibility(locationText: string): {
  status: NormalizedJob['eligibilityStatus'];
  countries: string[];
} {
  const lower = locationText.toLowerCase().trim();
  if (!lower) return { status: 'unknown', countries: [] };
  if (
    lower.includes('anywhere') ||
    lower.includes('worldwide') ||
    lower.includes('global')
  ) {
    return { status: 'worldwide', countries: ['Worldwide'] };
  }
  if (lower.includes('philippines')) {
    return { status: 'philippines', countries: ['Philippines'] };
  }
  return { status: 'restricted', countries: [locationText.trim()] };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);
}

export class RemotiveConnector implements JobSourceConnector {
  sourceKey = 'remotive';

  async discover(input: {
    keywords: string[];
    categories: string[];
  }): Promise<DiscoveryPage> {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=25');
    if (!res.ok) {
      throw new Error(`Remotive API error: ${res.status}`);
    }
    const json = (await res.json()) as { jobs?: unknown[] };
    const jobs = (json.jobs ?? []).map((j) => this.normalize(j));
    return {
      sourceKey: this.sourceKey,
      jobs,
      fetchedAt: new Date().toISOString(),
    };
  }

  normalize(raw: unknown): NormalizedJob {
    const r = (raw ?? {}) as Record<string, unknown>;
    const location = String(r.candidate_required_location ?? '');
    const elig = parseEligibility(location);
    const posted =
      typeof r.publication_date === 'string'
        ? new Date(
            r.publication_date.endsWith('Z')
              ? r.publication_date
              : `${r.publication_date}Z`
          ).toISOString()
        : null;

    return {
      sourceKey: this.sourceKey,
      externalId: r.id ? String(r.id) : null,
      canonicalUrl: String(r.url ?? 'https://remotive.com/remote-jobs'),
      title: String(r.title ?? 'Remote Opportunity'),
      description: stripHtml(String(r.description ?? '')),
      category: String(r.category ?? 'administrative_operations')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_'),
      skillsRequired: Array.isArray(r.tags) ? r.tags.map(String).slice(0, 6) : [],
      employer: {
        name: typeof r.company_name === 'string' ? r.company_name : null,
        businessPresenceVerified: true,
      },
      locationText: location || null,
      remoteType: 'remote',
      eligibleCountries: elig.countries,
      eligibilityStatus: elig.status,
      compensationMin: null,
      compensationMax: null,
      compensationCurrency: 'USD',
      compensationType: 'unknown',
      proposalCount: null,
      competitionStatus: 'not_disclosed',
      postedAt: posted,
      retrievedAt: new Date().toISOString(),
      retrievalMethod: 'official_api',
      rawData: r,
    };
  }

  async healthCheck(): Promise<SourceHealth> {
    return {
      sourceKey: this.sourceKey,
      healthy: true,
      checkedAt: new Date().toISOString(),
      message: 'Public Remotive API',
    };
  }
}

export class JobicyConnector implements JobSourceConnector {
  sourceKey = 'jobicy';

  async discover(): Promise<DiscoveryPage> {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=25');
    if (!res.ok) {
      throw new Error(`Jobicy API error: ${res.status}`);
    }
    const json = (await res.json()) as { jobs?: unknown[] };
    return {
      sourceKey: this.sourceKey,
      jobs: (json.jobs ?? []).map((j) => this.normalize(j)),
      fetchedAt: new Date().toISOString(),
    };
  }

  normalize(raw: unknown): NormalizedJob {
    const r = (raw ?? {}) as Record<string, unknown>;
    const location = String(r.jobGeo ?? '');
    const elig = parseEligibility(location);
    const posted =
      typeof r.pubDate === 'string' ? new Date(r.pubDate).toISOString() : null;

    return {
      sourceKey: this.sourceKey,
      externalId: r.id ? String(r.id) : null,
      canonicalUrl: String(r.url ?? 'https://jobicy.com/'),
      title: String(r.jobTitle ?? 'Remote Opportunity'),
      description: stripHtml(String(r.jobExcerpt ?? r.jobDescription ?? '')),
      category: Array.isArray(r.jobIndustry) && r.jobIndustry.length > 0
        ? String(r.jobIndustry[0]).toLowerCase().replace(/[^a-z0-9]+/g, '_')
        : 'administrative_operations',
      skillsRequired: [],
      employer: {
        name: typeof r.companyName === 'string' ? r.companyName : null,
        businessPresenceVerified: true,
      },
      locationText: location || null,
      remoteType: 'remote',
      eligibleCountries: elig.countries,
      eligibilityStatus: elig.status,
      compensationMin:
        typeof r.annualSalaryMin === 'number' ? r.annualSalaryMin : null,
      compensationMax:
        typeof r.annualSalaryMax === 'number' ? r.annualSalaryMax : null,
      compensationCurrency:
        typeof r.salaryCurrency === 'string' ? r.salaryCurrency : 'USD',
      compensationType:
        typeof r.annualSalaryMin === 'number' ? 'monthly' : 'unknown',
      proposalCount: null,
      competitionStatus: 'not_disclosed',
      postedAt: posted,
      retrievedAt: new Date().toISOString(),
      retrievalMethod: 'official_api',
      rawData: r,
    };
  }

  async healthCheck(): Promise<SourceHealth> {
    return {
      sourceKey: this.sourceKey,
      healthy: true,
      checkedAt: new Date().toISOString(),
      message: 'Public Jobicy API',
    };
  }
}
