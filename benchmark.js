const autocannon = require('autocannon')

const redis = require('./src/config/redis')

// Configuration
const BASE_URL = 'http://localhost:3000';
const DURATION = 30; // seconds
const CONNECTIONS = 50; // concurrent connections

// Benchmark scenarios
const scenarios = [
    {
    name: 'Get Restaurants - Without Cache',
    path: '/api/restaurants',
    headers: { 'x-cache': 'false' }
  },
  {
    name: 'Get Restaurants - With Cache',
    path: '/api/restaurants',
    headers: { 'x-cache': 'true' }
  },
  {
    name: 'Get Restaurant Details - Without Cache',
    path: '/api/restaurants/123',
    headers: { 'x-cache': 'false' }
  },
  {
    name: 'Get Restaurant Details - With Cache',
    path: '/api/restaurants/123',
    headers: { 'x-cache': 'true' }
  },
  {
    name: 'Get Menu Items - Without Cache',
    path: '/api/restaurants/123/menu',
    headers: { 'x-cache': 'false' }
  },
  {
    name: 'Get Menu Items - With Cache',
    path: '/api/restaurants/123/menu',
    headers: { 'x-cache': 'true' }
  }
];

async function runBenchmarks() {
  // await connectRedis();
  
  for (const scenario of scenarios) {
    console.log(`\nRunning: ${scenario.name}`);
    
    const result = await autocannon({
      url: BASE_URL + scenario.path,
      duration: DURATION,
      connections: CONNECTIONS,
      headers: scenario.headers
    });
    
    printResults(result);
  }
}

function printResults(result) {
  console.log(`Throughput: ${result.requests.average} req/sec`);
  console.log(`Latency (avg): ${result.latency.average} ms`);
  console.log(`Latency (p95): ${result.latency.p95} ms`);
  console.log(`Latency (p99): ${result.latency.p99} ms`);
  console.log(`Errors: ${result.errors}`);
}

runBenchmarks().catch(console.error);