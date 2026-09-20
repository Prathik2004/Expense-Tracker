import { Test, TestingModule } from '@nestjs/testing';
import { RateLimiterService } from '../src/mcp/security/rate-limiter.service';

describe('RateLimiterService', () => {
  let service: RateLimiterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimiterService],
    }).compile();

    service = module.get<RateLimiterService>(RateLimiterService);
  });

  it('should allow requests under limit', async () => {
    const limits = { requestsPerMinute: 60, requestsPerDay: 10000 };
    const result = await service.checkRateLimit('test-key', '/test', limits);
    expect(result.allowed).toBe(true);
  });

  it('should block when per-minute limit exceeded', async () => {
    const limits = { requestsPerMinute: 2, requestsPerDay: 10000 };
    const key = 'test-rate-limit-key';
    const endpoint = '/test-endpoint';

    // First request
    let result = await service.checkRateLimit(key, endpoint, limits);
    expect(result.allowed).toBe(true);

    // Second request
    result = await service.checkRateLimit(key, endpoint, limits);
    expect(result.allowed).toBe(true);

    // Third request - should be blocked
    result = await service.checkRateLimit(key, endpoint, limits);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should track per-endpoint limits separately', async () => {
    const limits = { requestsPerMinute: 1, requestsPerDay: 10000 };

    // Hit endpoint A
    await service.checkRateLimit('key', '/endpoint-a', limits);

    // Endpoint A should be blocked
    let result = await service.checkRateLimit('key', '/endpoint-a', limits);
    expect(result.allowed).toBe(false);

    // Endpoint B should still work
    result = await service.checkRateLimit('key', '/endpoint-b', limits);
    expect(result.allowed).toBe(true);
  });

  it('should track different API keys separately', async () => {
    const limits = { requestsPerMinute: 1, requestsPerDay: 10000 };

    // Key 1 uses its limit
    await service.checkRateLimit('key-1', '/test', limits);
    let result = await service.checkRateLimit('key-1', '/test', limits);
    expect(result.allowed).toBe(false);

    // Key 2 should still work
    result = await service.checkRateLimit('key-2', '/test', limits);
    expect(result.allowed).toBe(true);
  });
});