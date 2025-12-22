// Extract Job Metadata Edge Function
// Fetches URL and extracts job title, company, and other metadata

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedMetadata {
  title?: string;
  company_name?: string;
  location?: string;
  description?: string;
  source: string;
  error?: string;
  correctedUrl?: string;
}

// Parse HTML to extract meta tags
function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};

  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    meta['title'] = decodeHtmlEntities(titleMatch[1].trim());
  }

  // Extract og: meta tags
  const ogMatches = html.matchAll(/<meta[^>]+property=["']og:([^"']+)["'][^>]+content=["']([^"']+)["'][^>]*>/gi);
  for (const match of ogMatches) {
    meta[`og:${match[1]}`] = decodeHtmlEntities(match[2]);
  }

  // Also try content before property (different order)
  const ogMatches2 = html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:([^"']+)["'][^>]*>/gi);
  for (const match of ogMatches2) {
    meta[`og:${match[2]}`] = decodeHtmlEntities(match[1]);
  }

  // Extract twitter: meta tags
  const twitterMatches = html.matchAll(/<meta[^>]+name=["']twitter:([^"']+)["'][^>]+content=["']([^"']+)["'][^>]*>/gi);
  for (const match of twitterMatches) {
    meta[`twitter:${match[1]}`] = decodeHtmlEntities(match[2]);
  }

  // Extract standard meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  if (descMatch) {
    meta['description'] = decodeHtmlEntities(descMatch[1]);
  }

  return meta;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

// Parse LinkedIn job title format: "Job Title - Company Name | LinkedIn"
function parseLinkedInTitle(title: string): { jobTitle?: string; company?: string } {
  // Pattern: "Company hiring Job Title in Location | LinkedIn"
  // This is common in LinkedIn search results
  const hiringMatch = title.match(/^(.+?)\s+hiring\s+(.+?)(?:\s+in\s+.+?)?\s*\|/i);
  if (hiringMatch) {
    return { company: hiringMatch[1].trim(), jobTitle: hiringMatch[2].trim() };
  }

  // Pattern: "Job Title - Company | LinkedIn" or "Job Title at Company | LinkedIn"
  const patterns = [
    /^(.+?)\s+-\s+(.+?)\s*\|\s*LinkedIn$/i,
    /^(.+?)\s+at\s+(.+?)\s*\|\s*LinkedIn$/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return { jobTitle: match[1].trim(), company: match[2].trim() };
    }
  }

  // Try simpler pattern without LinkedIn suffix
  const simpleMatch = title.match(/^(.+?)\s+(?:at|-)\s+(.+?)$/i);
  if (simpleMatch) {
    return { jobTitle: simpleMatch[1].trim(), company: simpleMatch[2].trim() };
  }

  return {};
}

// Parse Indeed job title format
function parseIndeedTitle(title: string): { jobTitle?: string; company?: string; location?: string } {
  // Pattern: "Job Title - Company - Location | Indeed.com"
  const match = title.match(/^(.+?)\s+-\s+(.+?)\s+-\s+(.+?)\s*\|/i);
  if (match) {
    return {
      jobTitle: match[1].trim(),
      company: match[2].trim(),
      location: match[3].trim()
    };
  }
  return {};
}

// Parse Glassdoor job title format
function parseGlassdoorTitle(title: string): { jobTitle?: string; company?: string } {
  // Pattern: "Company Job Title Job in Location | Glassdoor"
  const match = title.match(/^(.+?)\s+(.+?)\s+Job\s+in/i);
  if (match) {
    return { company: match[1].trim(), jobTitle: match[2].trim() };
  }
  return {};
}

// Try to extract LinkedIn job ID from various URL formats
function extractLinkedInJobId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;

    // Direct job URL: /jobs/view/1234567890
    const viewMatch = pathname.match(/\/jobs\/view\/(\d+)/);
    if (viewMatch) return viewMatch[1];

    // Job ID in query params: ?currentJobId=1234567890
    const currentJobId = parsed.searchParams.get('currentJobId');
    if (currentJobId) return currentJobId;

    // Other query param variations
    const jobId = parsed.searchParams.get('jobId') || parsed.searchParams.get('job_id');
    if (jobId) return jobId;

    // Check for job ID in refId or other params
    const refId = parsed.searchParams.get('refId');
    if (refId && /^\d{10,}$/.test(refId)) return refId;

    return null;
  } catch {
    return null;
  }
}

// Construct correct LinkedIn job URL from ID
function getLinkedInDirectUrl(jobId: string): string {
  return `https://www.linkedin.com/jobs/view/${jobId}`;
}

function extractJobMetadata(url: string, meta: Record<string, string>, correctedUrl?: string): ExtractedMetadata {
  const hostname = new URL(url).hostname.toLowerCase();
  const pathname = new URL(url).pathname.toLowerCase();
  const result: ExtractedMetadata = { source: hostname };

  // Get title from og:title or page title
  const pageTitle = meta['og:title'] || meta['title'] || '';
  const description = meta['og:description'] || meta['description'] || '';

  // Detect login walls / blocked content
  const isLoginWall = description.includes('Login to LinkedIn') ||
    description.includes('Sign in') ||
    pageTitle.includes('Login') ||
    pageTitle.includes('Sign In');

  // LinkedIn
  if (hostname.includes('linkedin.com')) {
    // Check if it's a direct job posting URL
    const isDirectJobUrl = pathname.includes('/jobs/view/');

    if (!isDirectJobUrl) {
      // Try to extract job ID from the URL
      const jobId = extractLinkedInJobId(url);
      if (jobId) {
        // Return with corrected URL hint
        result.source = 'LinkedIn';
        result.correctedUrl = getLinkedInDirectUrl(jobId);
        result.error = 'redirect';
        return result;
      }

      // No job ID found - can't help
      result.source = 'LinkedIn';
      result.error = 'Please use a direct job URL (linkedin.com/jobs/view/...)';
      return result;
    }

    if (isLoginWall) {
      result.source = 'LinkedIn';
      result.error = 'LinkedIn requires login - please fill details manually';
      return result;
    }

    const parsed = parseLinkedInTitle(pageTitle);
    result.title = parsed.jobTitle;
    result.company_name = parsed.company;
    result.description = description;
    result.source = 'LinkedIn';
    if (correctedUrl) {
      result.correctedUrl = correctedUrl;
    }
  }
  // Indeed
  else if (hostname.includes('indeed.com')) {
    const parsed = parseIndeedTitle(pageTitle);
    result.title = parsed.jobTitle;
    result.company_name = parsed.company;
    result.location = parsed.location;
    result.description = meta['og:description'] || meta['description'];
    result.source = 'Indeed';
  }
  // Glassdoor
  else if (hostname.includes('glassdoor.com')) {
    const parsed = parseGlassdoorTitle(pageTitle);
    result.title = parsed.jobTitle;
    result.company_name = parsed.company;
    result.description = meta['og:description'] || meta['description'];
    result.source = 'Glassdoor';
  }
  // Bayt (Middle East)
  else if (hostname.includes('bayt.com')) {
    // Bayt format: "Job Title Job in Location - Company | Bayt.com"
    const match = pageTitle.match(/^(.+?)\s+Job\s+in\s+(.+?)\s+-\s+(.+?)\s*\|/i);
    if (match) {
      result.title = match[1].trim();
      result.location = match[2].trim();
      result.company_name = match[3].trim();
    }
    result.description = meta['og:description'] || meta['description'];
    result.source = 'Bayt';
  }
  // GulfTalent
  else if (hostname.includes('gulftalent.com')) {
    result.title = meta['og:title'];
    result.description = meta['og:description'] || meta['description'];
    result.source = 'GulfTalent';
  }
  // Naukrigulf
  else if (hostname.includes('naukrigulf.com')) {
    result.title = meta['og:title'];
    result.description = meta['og:description'] || meta['description'];
    result.source = 'Naukrigulf';
  }
  // Generic fallback
  else {
    result.title = meta['og:title'] || pageTitle;
    result.company_name = meta['og:site_name'];
    result.description = meta['og:description'] || meta['description'];
  }

  // Clean up extracted values
  if (result.title) {
    // Remove common suffixes
    result.title = result.title
      .replace(/\s*\|\s*LinkedIn$/i, '')
      .replace(/\s*\|\s*Indeed\.com$/i, '')
      .replace(/\s*-\s*Jobs$/i, '')
      .trim();
  }

  // Clean up description - remove LinkedIn prefixes and suffixes
  if (result.description) {
    result.description = result.description
      // Remove prefixes
      .replace(/^Posted\s+\d{1,2}:\d{2}:\d{2}\s*[AP]M\.?\s*/i, '')
      .replace(/^About The Role\s*/i, '')
      .replace(/^About the job\s*/i, '')
      .replace(/^Job Description\s*/i, '')
      // Remove suffixes
      .replace(/\.{0,3}\s*See this and similar jobs on LinkedIn\.?\s*$/i, '')
      .replace(/\s*Show more\s*Show less\s*$/i, '')
      .trim();
  }

  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the page
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let html: string;
    try {
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            error: 'Failed to fetch URL',
            status: response.status,
            metadata: { source: parsedUrl.hostname }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      html = await response.text();
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      return new Response(
        JSON.stringify({
          error: 'Could not fetch URL - site may be blocking requests',
          metadata: { source: parsedUrl.hostname }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract metadata
    const meta = extractMetaTags(html);
    let extracted = extractJobMetadata(url, meta);

    // If we got a redirect hint (job ID found in wrong URL format), fetch the correct URL
    if (extracted.error === 'redirect' && extracted.correctedUrl) {
      const correctedUrl = extracted.correctedUrl;
      console.log('Redirecting to corrected URL:', correctedUrl);

      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 10000);

        const response2 = await fetch(correctedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: controller2.signal,
          redirect: 'follow',
        });
        clearTimeout(timeoutId2);

        if (response2.ok) {
          const html2 = await response2.text();
          const meta2 = extractMetaTags(html2);
          extracted = extractJobMetadata(correctedUrl, meta2, correctedUrl);
          // Remove the redirect error since we successfully fetched
          if (extracted.error === 'redirect') {
            delete extracted.error;
          }
        }
      } catch (e) {
        console.error('Error fetching corrected URL:', e);
        // Keep the original extraction with correctedUrl hint
        extracted.error = 'Found job ID but could not fetch details - use this URL instead';
      }
    }

    return new Response(
      JSON.stringify({ metadata: extracted, raw_meta: meta }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
