// Main application worker
// Serves the investment dashboard application

const PAGES_URL = "https://753f1c6c.investment-aramac.pages.dev";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Log request
    console.log(`${request.method} ${url.pathname}`);
    
    // Handle API requests directly on this worker
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, url);
    }
    
    // Proxy all other requests to Pages
    const targetUrl = new URL(url.pathname + url.search, PAGES_URL);
    
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    });
    
    const response = await fetch(modifiedRequest);
    
    // Create new response with CORS headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
    
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('X-Proxied-By', 'investment-worker');
    
    return newResponse;
  }
};

async function handleAPI(request, url) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const path = url.pathname;
  
  // Health check
  if (path === "/api/health" || path === "/api/") {
    return new Response(JSON.stringify({
      status: "healthy",
      service: "investment-api",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    }), { headers: corsHeaders });
  }

  // Dashboard stats
  if (path === "/api/v1/dashboard/stats") {
    return new Response(JSON.stringify({
      total_investments: 3,
      total_value: 250000,
      categories: ["land", "stocks", "gold"],
      last_updated: new Date().toISOString()
    }), { headers: corsHeaders });
  }

  // List investments
  if (path === "/api/v1/investments") {
    return new Response(JSON.stringify({
      items: [
        { id: "1", name: "Beach House", category: "real_estate", value: 150000, status: "active" },
        { id: "2", name: "Apple Stock", category: "stocks", value: 50000, status: "active" },
        { id: "3", name: "Gold Coins", category: "gold", value: 50000, status: "active" }
      ],
      total: 3
    }), { headers: corsHeaders });
  }

  // 404
  return new Response(JSON.stringify({ error: "Not found", path }), { 
    headers: corsHeaders, 
    status: 404 
  });
}
