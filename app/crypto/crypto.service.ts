import axios from "axios";
import Transaction from "./crypto.schema";
import userSchema from "../user/user.schema";
const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price";

// In-memory cache for prices
let priceCache: Record<string, any> = {};

/**
 * Fetch cryptocurrency prices from CoinGecko API.
 * @param symbols Array of cryptocurrency symbols (e.g., ['bitcoin', 'ethereum']).
 * @param currency The target fiat currency (e.g., 'usd').
 * @returns The fetched price data.
 */
export const fetchCryptoPrices = async (symbols: string[], currency: string = "usd") => {
    try {
        const params = {
            ids: symbols.join(","),
            vs_currencies: currency,
        };
        const { data } = await axios.get(COINGECKO_API, { params });
        priceCache = data; // Update the cache with the latest data
        return data;
    } catch (error: any) {
        console.error("Error fetching crypto prices:", error.message);
        throw new Error("Unable to fetch prices");
    }
};

/**
 * Get the cached cryptocurrency prices.
 * @returns Cached price data.
 */
export const getCachedPrices = () => {
    return priceCache;
};

/**
 * Start periodic price polling to update the cache.
 * @param interval Polling interval in milliseconds (default: 1 minute).
 */
export const startPricePolling = (interval: number = 60000) => {
    setInterval(async () => {
        try {
            await fetchCryptoPrices(["bitcoin", "ethereum",]); // Add more symbols as needed
            console.log("Prices updated:", priceCache);
        } catch (error: any) {
            console.error("Error updating prices:", error.message);
        }
    }, interval);
};


/**
 * Calculate the user's profit and loss.
 * @param userId The ID of the user.
 * @returns An object containing P&L data.
 */
export const calculateProfitAndLoss = async (userId: string) => {
    // Fetch user's transactions
    const transactions = await Transaction.find({ userId });

    if (transactions.length === 0) {
        return { currentValue: 0, costBasis: 0, profitOrLoss: 0 };
    }

    // Group transactions by cryptocurrency symbol
    const holdings: Record<string, { amount: number; costBasis: number }> = {};
    transactions.forEach((transaction: any) => {
        const { symbol, type, amount, price } = transaction;

        if (!holdings[symbol]) {
            holdings[symbol] = { amount: 0, costBasis: 0 };
        }

        if (type === "BUY") {
            holdings[symbol].amount += amount;
            holdings[symbol].costBasis += amount * price;
        } else if (type === "SELL") {
            holdings[symbol].amount -= amount;
            holdings[symbol].costBasis -= amount * price;
        }
    });

    // Fetch current prices for all held cryptocurrencies
    const symbols = Object.keys(holdings);
    const currentPrices = await fetchCryptoPrices(symbols);

    // Calculate current value and total cost basis
    let currentValue = 0;
    let costBasis = 0;

    symbols.forEach((symbol) => {
        const holding = holdings[symbol];
        const currentPrice = currentPrices[symbol]?.usd || 0;

        currentValue += holding.amount * currentPrice;
        costBasis += holding.costBasis;
    });

    // Calculate profit or loss
    const profitOrLoss = currentValue - costBasis;

    return { currentValue, costBasis, profitOrLoss };
};

export const createTransaction = async (userId: string, transactionData: any) => {
    const { symbol, type, amount, price } = transactionData;

    // Save the transaction
    const transaction = await Transaction.create({ userId, symbol, type, amount, price, date: new Date() });

    // Update the user's portfolio
    const user = await userSchema.findById(userId);
    if (!user) throw new Error("User  not found");

    // Ensure portfolio is defined
    if (!user.portfolio) {
        user.portfolio = []; // Initialize it if it's undefined
    }

    const portfolioItem = user.portfolio.find((item) => item.symbol === symbol);

    if (type === "BUY") {
        if (portfolioItem) {
            portfolioItem.amount += amount;
        } else {
            user.portfolio.push({ symbol, amount });
        }
    } else if (type === "SELL") {
        if (!portfolioItem || portfolioItem.amount < amount) {
            throw new Error("Insufficient balance for sale");
        }
        portfolioItem.amount -= amount;

        // Remove the symbol if amount becomes zero
        if (portfolioItem.amount === 0) {
            user.portfolio = user.portfolio.filter((item) => item.symbol !== symbol);
        }
    }

    // Update transaction count
    // Ensure transactionCount is defined
    if (user.transactionCount === undefined) {
        user.transactionCount = 0; // Initialize it if it's undefined
    }

    // Update transaction count
    user.transactionCount += 1;

    await user.save();
    return transaction;
};