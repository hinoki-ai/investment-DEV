/* eslint-disable @typescript-eslint/no-explicit-any */
// Cloudflare Pages Function - API Routes

export interface Env {
  // Environment variables if needed
}

export const onRequest = async (context: any) => {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };

  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
  if (path === "/api/v1/dashboard/stats" && method === "GET") {
    return new Response(JSON.stringify({
      total_investments: 3,
      total_value: 250000,
      categories: ["land", "stocks", "gold"],
      last_updated: new Date().toISOString()
    }), { headers: corsHeaders });
  }

  // List investments
  if (path === "/api/v1/investments" && method === "GET") {
    return new Response(JSON.stringify({
      items: [
        { id: "1", name: "Beach House", category: "real_estate", value: 150000, status: "active" },
        { id: "2", name: "Apple Stock", category: "stocks", value: 50000, status: "active" },
        { id: "3", name: "Gold Coins", category: "gold", value: 50000, status: "active" }
      ],
      total: 3
    }), { headers: corsHeaders });
  }

  // Create investment
  if (path === "/api/v1/investments" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    return new Response(JSON.stringify({
      id: crypto.randomUUID(),
      name: body.name || "New Investment",
      category: body.category || "other",
      value: body.initial_value || 0,
      created_at: new Date().toISOString()
    }), { headers: corsHeaders, status: 201 });
  }

  // Files list
  if (path === "/api/v1/files" && method === "GET") {
    return new Response(JSON.stringify({
      files: [],
      total: 0
    }), { headers: corsHeaders });
  }

  // Analysis results
  if (path === "/api/v1/analysis/results" && method === "GET") {
    return new Response(JSON.stringify({
      results: [],
      total: 0
    }), { headers: corsHeaders });
  }

  // 404 for unmatched routes
  return new Response(JSON.stringify({
    error: "Not found",
    path: path,
    method: method
  }), { headers: corsHeaders, status: 404 });
};
