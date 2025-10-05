import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        openMeteoAPI: await checkExternalService('https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true'),
        airQualityAPI: await checkExternalService('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=52.52&longitude=13.41&current=us_aqi'),
        azureAI: {
          configured: !!(process.env.AZURE_AI_ENDPOINT && process.env.AZURE_AI_API_KEY),
          endpoint: process.env.AZURE_AI_ENDPOINT ? 'configured' : 'missing'
        }
      }
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

async function checkExternalService(url: string): Promise<{ status: string; responseTime?: number }> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, { 
      signal: controller.signal,
      method: 'GET'
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.ok ? 'healthy' : `error_${response.status}`,
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'unhealthy',
      responseTime
    };
  }
}