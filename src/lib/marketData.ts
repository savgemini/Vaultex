import type { Asset } from '@/types';

// Demo market data — clearly labeled as development data.
// In production, replace with a real market-data provider (e.g., CoinGecko, CoinAPI, exchange WebSocket).

export const DEMO_ASSETS: Asset[] = [
  {
    id: 'demo-btc', name: 'Bitcoin', symbol: 'BTC', network: 'Bitcoin', decimals: 8,
    status: 'active', deposit_enabled: true, withdrawal_enabled: true, trading_enabled: true,
    min_deposit: 0.0001, min_withdrawal: 0.001, withdrawal_fee: 0.0004,
    current_price: 67284.50, price_change_24h: 2.34, market_cap: 1325000000000,
    volume_24h: 28500000000, high_24h: 67800.00, low_24h: 65400.00, category: 'major', display_order: 1,
  },
  {
    id: 'demo-eth', name: 'Ethereum', symbol: 'ETH', network: 'Ethereum', decimals: 8,
    status: 'active', deposit_enabled: true, withdrawal_enabled: true, trading_enabled: true,
    min_deposit: 0.005, min_withdrawal: 0.01, withdrawal_fee: 0.005,
    current_price: 3245.80, price_change_24h: 1.87, market_cap: 390000000000,
    volume_24h: 15200000000, high_24h: 3280.00, low_24h: 3180.00, category: 'major', display_order: 2,
  },
  {
    id: 'demo-sol', name: 'Solana', symbol: 'SOL', network: 'Solana', decimals: 8,
    status: 'active', deposit_enabled: true, withdrawal_enabled: true, trading_enabled: true,
    min_deposit: 0.1, min_withdrawal: 0.5, withdrawal_fee: 0.01,
    current_price: 168.42, price_change_24h: 4.12, market_cap: 78000000000,
    volume_24h: 3200000000, high_24h: 172.00, low_24h: 161.50, category: 'layer1', display_order: 3,
  },
  {
    id: 'demo-usdt', name: 'Tether', symbol: 'USDT', network: 'Ethereum', decimals: 8,
    status: 'active', deposit_enabled: true, withdrawal_enabled: true, trading_enabled: true,
    min_deposit: 10, min_withdrawal: 10, withdrawal_fee: 1,
    current_price: 1.0001, price_change_24h: 0.02, market_cap: 119000000000,
    volume_24h: 45000000000, high_24h: 1.0010, low_24h: 0.9995, category: 'stablecoin', display_order: 4,
  },
  {
    id: 'demo-usdc', name: 'USD Coin', symbol: 'USDC', network: 'Ethereum', decimals: 8,
    status: 'active', deposit_enabled: true, withdrawal_enabled: true, trading_enabled: true,
    min_deposit: 10, min_withdrawal: 10, withdrawal_fee: 1,
    current_price: 0.9998, price_change_24h: -0.01, market_cap: 34000000000,
    volume_24h: 8200000000, high_24h: 1.0005, low_24h: 0.9990, category: 'stablecoin', display_order: 5,
  },
  {
    id: 'demo-xrp', name: 'XRP', symbol: 'XRP', network: 'Ripple', decimals: 8,
    status: 'active', deposit_enabled: true, withdrawal_enabled: true, trading_enabled: true,
    min_deposit: 10, min_withdrawal: 20, withdrawal_fee: 0.5,
    current_price: 0.5234, price_change_24h: -1.23, market_cap: 29000000000,
    volume_24h: 1100000000, high_24h: 0.5340, low_24h: 0.5180, category: 'major', display_order: 6,
  },
  {
    id: 'demo-ada', name: 'Cardano', symbol: 'ADA', network: 'Cardano', decimals: 8,
    status: 'active', deposit_enabled: true, withdrawal_enabled: true, trading_enabled: true,
    min_deposit: 10, min_withdrawal: 10, withdrawal_fee: 0.5,
    current_price: 0.3856, price_change_24h: 3.45, market_cap: 13500000000,
    volume_24h: 480000000, high_24h: 0.3920, low_24h: 0.3710, category: 'layer1', display_order: 7,
  },
];

export function getDemoAsset(symbol: string): Asset | undefined {
  return DEMO_ASSETS.find(a => a.symbol === symbol);
}

// Generate realistic-looking price history for charts
export function generatePriceHistory(currentPrice: number, days: number, volatility = 0.02): { time: string; price: number }[] {
  const points: { time: string; price: number }[] = [];
  const now = Date.now();
  const interval = (days * 24 * 60 * 60 * 1000) / Math.min(days * 24, 200);
  let price = currentPrice * (1 - (Math.random() * 0.1 - 0.05));

  for (let i = 0; i <= Math.min(days * 24, 200); i++) {
    const change = (Math.random() - 0.48) * volatility * price;
    price = Math.max(price + change, 0.01);
    if (i % Math.max(1, Math.floor((days * 24) / 60)) === 0 || i === Math.min(days * 24, 200)) {
      points.push({
        time: new Date(now - (Math.min(days * 24, 200) - i) * interval).toISOString(),
        price: Number(price.toFixed(currentPrice > 100 ? 2 : 4)),
      });
    }
  }
  // Ensure last point is the current price
  if (points.length > 0) {
    points[points.length - 1].price = currentPrice;
  }
  return points;
}

// Generate candlestick data for trading charts
export function generateCandlesticks(currentPrice: number, count = 60, volatility = 0.015): {
  time: string; open: number; high: number; low: number; close: number; volume: number;
}[] {
  const candles: { time: string; open: number; high: number; low: number; close: number; volume: number }[] = [];
  const now = Date.now();
  const interval = 60 * 60 * 1000; // 1 hour candles
  let prevClose = currentPrice * (1 - (Math.random() * 0.05));

  for (let i = count; i >= 0; i--) {
    const open = prevClose;
    const change = (Math.random() - 0.48) * volatility * open;
    const close = Math.max(open + change, 0.01);
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    const volume = Math.random() * 1000 + 100;
    candles.push({
      time: new Date(now - i * interval).toISOString(),
      open: Number(open.toFixed(currentPrice > 100 ? 2 : 4)),
      high: Number(high.toFixed(currentPrice > 100 ? 2 : 4)),
      low: Number(low.toFixed(currentPrice > 100 ? 2 : 4)),
      close: Number(close.toFixed(currentPrice > 100 ? 2 : 4)),
      volume: Number(volume.toFixed(2)),
    });
    prevClose = close;
  }
  // Set last close to current price
  if (candles.length > 0) {
    candles[candles.length - 1].close = currentPrice;
  }
  return candles;
}

// Generate order book data
export function generateOrderBook(currentPrice: number, levels = 12): {
  bids: { price: number; amount: number; total: number }[];
  asks: { price: number; amount: number; total: number }[];
} {
  const bids: { price: number; amount: number; total: number }[] = [];
  const asks: { price: number; amount: number; total: number }[] = [];
  let bidTotal = 0, askTotal = 0;

  for (let i = 0; i < levels; i++) {
    const bidPrice = currentPrice * (1 - (i + 1) * 0.0008 - Math.random() * 0.0005);
    const bidAmount = Math.random() * 2 + 0.01;
    bidTotal += bidAmount;
    bids.push({ price: Number(bidPrice.toFixed(2)), amount: Number(bidAmount.toFixed(4)), total: Number(bidTotal.toFixed(4)) });

    const askPrice = currentPrice * (1 + (i + 1) * 0.0008 + Math.random() * 0.0005);
    const askAmount = Math.random() * 2 + 0.01;
    askTotal += askAmount;
    asks.push({ price: Number(askPrice.toFixed(2)), amount: Number(askAmount.toFixed(4)), total: Number(askTotal.toFixed(4)) });
  }
  return { bids, asks };
}

// Generate recent trades
export function generateRecentTrades(currentPrice: number, count = 20): {
  price: number; amount: number; side: 'buy' | 'sell'; time: string;
}[] {
  const trades: { price: number; amount: number; side: 'buy' | 'sell'; time: string }[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const price = currentPrice * (1 + (Math.random() - 0.5) * 0.002);
    const amount = Math.random() * 1.5 + 0.001;
    trades.push({
      price: Number(price.toFixed(2)),
      amount: Number(amount.toFixed(4)),
      side,
      time: new Date(now - i * 30000).toISOString(),
    });
  }
  return trades;
}
