import axios from "axios";
import Transaction from "./crypto.schema";
import userSchema from "../user/user.schema";
const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price";

// In-memory cache for prices
let priceCache: Record<string, any> = {};

/**
 * Fetch cryptocurrency prices from CoinGecko API.
 * @param {string[]} symbols - Array of cryptocurrency symbols (e.g., ['bitcoin', 'ethereum']).
 * @param {string} [currency='usd'] - The target fiat currency (e.g., 'usd').
 * @returns {Promise<any>} - The fetched price data from CoinGecko API.
 * @throws {Error} - Throws an error if unable to fetch prices.
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
 * @returns {Record<string, any>} - Cached price data.
 */
export const getCachedPrices = () => {
    return priceCache;
};

/**
 * Start periodic price polling to update the cache.
 * @param {number} [interval=60000] - Polling interval in milliseconds (default: 1 minute).
 * @returns {void} - This function has no return value.
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
 * Calculate the user's profit and loss based on transactions.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<{currentValue: number, costBasis: number, profitOrLoss: number}>} - An object containing the user's P&L data.
 * @throws {Error} - Throws an error if the user does not have any transactions.
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

/**
 * Create a new transaction (BUY, SELL, or TRANSFER).
 * @param {string} userId - The ID of the user.
 * @param {Object} transactionData - The data for the transaction.
 * @param {string} transactionData.symbol - The symbol of the cryptocurrency (e.g., 'bitcoin').
 * @param {string} transactionData.type - The type of transaction ('BUY' or 'SELL').
 * @param {number} transactionData.amount - The amount of cryptocurrency.
 * @returns {Promise<any>} - The created transaction object.
 * @throws {Error} - Throws an error if required fields are missing or the price is unavailable.
 */
export const createTransaction = async (userId: string, transactionData: any) => {
    const { symbol, type, amount } = transactionData;

    if (!symbol || !type || !amount) {
        throw new Error("Missing required fields (symbol, type, amount)");
    }

    // Fetch the real-time price from CoinGecko API
    let price;
    try {
        const { data } = await axios.get(COINGECKO_API, {
            params: {
                ids: symbol, // Example: 'bitcoin'
                vs_currencies: "usd", // Example: 'usd'
            },
        });

        // Check if the price for the symbol is available
        if (!data[symbol] || !data[symbol].usd) {
            throw new Error(`Price not available for symbol ${symbol}`);
        }
        price = data[symbol].usd; // Set the price from the API response
        price = price * amount;
    } catch (error: any) {
        throw new Error(`Error fetching price from CoinGecko: ${error.message}`);
    }

    // Save the transaction
    const transaction = await Transaction.create({
        userId, symbol, type, amount, price, date: new Date(),
    });

    // Update the user's portfolio
    const user = await userSchema.findById(userId);
    if (!user) throw new Error("User not found");

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
    if (user.transactionCount === undefined) {
        user.transactionCount = 0; // Initialize it if it's undefined
    }

    user.transactionCount += 1;
    await user.save();

    return transaction;
};

/**
 * Transfer cryptocurrency between two users.
 * @param {string} senderId - The ID of the sender.
 * @param {string} receiverId - The ID of the receiver.
 * @param {string} symbol - The symbol of the cryptocurrency (e.g., 'bitcoin').
 * @param {number} amount - The amount of cryptocurrency to transfer.
 * @returns {Promise<Object>} - The result of the transfer with portfolio updates.
 * @throws {Error} - Throws an error if sender or receiver is not found, or if there are insufficient funds.
 */
export const transferCrypto = async (
    senderId: string,
    receiverId: string,
    symbol: string,
    amount: number
  ) => {
    // Check if sender and receiver exist
    const sender = await userSchema.findById(senderId);
    const receiver = await userSchema.findById(receiverId);
  
    if (!sender) throw new Error("Sender not found");
    if (!receiver) throw new Error("Receiver not found");
  
    // Fetch the current price of the cryptocurrency (e.g., Bitcoin)
    let price;
    try {
      const { data } = await axios.get(COINGECKO_API, {
        params: {
          ids: symbol, // Example: 'bitcoin'
          vs_currencies: "usd", // Example: 'usd'
        },
      });
  
      // Check if the price for the symbol is available
      if (!data[symbol] || !data[symbol].usd) {
        throw new Error(`Price not available for symbol ${symbol}`);
      }
      price = data[symbol].usd; // Get the price for the crypto symbol
    } catch (error: any) {
      throw new Error(`Error fetching price from CoinGecko: ${error.message}`);
    }
  
    // Check if sender has enough balance
    const senderPortfolio = sender.portfolio?.find((item) => item.symbol === symbol);
    if (!senderPortfolio || senderPortfolio.amount < amount) {
      throw new Error("Insufficient funds in sender's portfolio");
    }
  
    // Update sender's portfolio (decrease amount)
    senderPortfolio.amount -= amount;
    await sender.save();
  
    // Update receiver's portfolio (increase amount)
    const receiverPortfolio = receiver.portfolio?.find((item) => item.symbol === symbol);
    if (receiverPortfolio) {
      receiverPortfolio.amount += amount;
    } else {
      receiver.portfolio?.push({ symbol, amount });
    }
    await receiver.save();
  
    // Record the transaction with the current price
    const transaction = new Transaction({
      senderId: sender._id,
      receiverId: receiver._id,
      symbol,
      type: "TRANSFER",
      amount,
      price,  // Include the current price of the crypto
    });
  
    await transaction.save();
  
    return {
      message: "Transfer successful",
      senderPortfolio: senderPortfolio,
      receiverPortfolio: receiverPortfolio,
      transactionPrice: price,  // Optional: return the price at the time of transfer
    };
  };
