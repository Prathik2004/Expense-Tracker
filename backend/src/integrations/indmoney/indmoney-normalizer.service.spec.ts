import { IndmoneyNormalizerService } from './indmoney-normalizer.service';

describe('IndmoneyNormalizerService', () => {
  const svc = new IndmoneyNormalizerService();

  it('normalizes indian stock payload', () => {
    const raw = { holdings: [{ id: 'inst-1', name: 'TCS', symbol: 'TCS', type: 'indian_stock', quantity: '10', avgPrice: '2000', currentPrice: '2100', investedAmount: '20000', currentValue: '21000', currency: 'INR' }] };
    const res = svc.normalizePortfolio(raw);
    expect(res.length).toBe(1);
    expect(res[0].externalId).toBe('inst-1');
    expect(res[0].name).toBe('TCS');
    expect(res[0].quantity).toBe(10);
    expect(res[0].currency).toBe('INR');
  });

  it('handles missing optional fields and zero quantity', () => {
    const raw = { holdings: [{ id: 'mf-1', name: 'Axis MF', schemeName: 'Axis', quantity: '0', currentPrice: null, investedAmount: '0' }] };
    const res = svc.normalizePortfolio(raw);
    expect(res.length).toBe(1);
    expect(res[0].quantity).toBe(0);
    expect(res[0].currentPrice).toBeUndefined();
  });

  it('normalizes USD asset', () => {
    const raw = { holdings: [{ id: 'us-1', name: 'Apple', symbol: 'AAPL', type: 'us_stock', quantity: '5', currentPrice: '320', currency: 'USD' }] };
    const res = svc.normalizePortfolio(raw);
    expect(res[0].currency).toBe('USD');
  });
});
