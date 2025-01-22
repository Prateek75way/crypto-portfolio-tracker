import axios from "axios";
import {Transaction} from "./crypto.entity";
import userSchema from "../user/user.schema";
import { getRepository } from "typeorm";
import { User } from "../user/user.entity";
import { AppDataSource } from "../common/services/database.service";
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
        return data; // Return the fetched data
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
    const transactionRepository = getRepository(Transaction);
    
    // Fetch user's transactions where the user is either the sender or the receiver
    const transactions = await transactionRepository.find({
        where: [
            { sender: { id: userId } },
            { receiver: { id: userId } }
        ],
        relations: ["sender", "receiver"],
    });

    if (transactions.length === 0) {
        return { currentValue: 0, costBasis: 0, profitOrLoss: 0 };
    }

    const holdings: Record<string, { amount: number; costBasis: number }> = {};

    transactions.forEach((transaction) => {
        const { symbol, type, amount, price } = transaction;

        if (!symbol) throw new Error("Symbol not found");
        if (!amount) throw new Error("Amount not found");
        if (!price) throw new Error("Price not found");

        // Parse and sanitize the amount to ensure it's a valid number
        const parsedAmount = parseFloat(amount.toString());
        if (isNaN(parsedAmount)) {
            throw new Error(`Invalid amount value: ${amount}`);
        }

        // Initialize the holding record if it doesn't exist
        if (!holdings[symbol]) {
            holdings[symbol] = { amount: 0, costBasis: 0 };
        }

        // Process the transaction based on its type (BUY/SELL)
        if (type === "BUY") {
            holdings[symbol].amount += parsedAmount;
            holdings[symbol].costBasis += parsedAmount * price;
        } else if (type === "SELL") {
            holdings[symbol].amount -= parsedAmount;
            holdings[symbol].costBasis -= parsedAmount * price;
        }
    });

    // Fetch current prices for all held cryptocurrencies
    const symbols = Object.keys(holdings);
    const currentPrices = await fetchCryptoPrices(symbols);

    // Debugging: Log symbols and current prices
    console.log('Fetched symbols:', symbols);
    console.log('Fetched prices:', currentPrices);

    let currentValue = 0;
    let costBasis = 0;

    // Calculate the current value and cost basis for each symbol
    symbols.forEach((symbol) => {
        const holding = holdings[symbol];
        const currentPrice = currentPrices[symbol]?.usd || 0;

        console.log(`Symbol: ${symbol}, Holding: ${JSON.stringify(holding)}, Current Price: ${currentPrice}`);

        currentValue += holding.amount * currentPrice;
        costBasis += holding.costBasis;
    });

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
    let price: number;
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
    } catch (error: any) {
        throw new Error(`Error fetching price from CoinGecko: ${error.message}`);
    }

    // Save the transaction
    const transactionRepository = getRepository(Transaction);
    const transaction = transactionRepository.create({
        sender: { id: userId }, // Assuming you have a sender relation in the Transaction entity
        symbol,
        type,
        amount,
        price,
        date: new Date(),
    });
    await transactionRepository.save(transaction);

    // Update the user's portfolio
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
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
    if (user.transactionCount === undefined) {
        user.transactionCount = 0; // Initialize it if it's undefined
    }

    user.transactionCount += 1;
    await userRepository.save(user); // Save the updated user object

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
// export const transferCrypto = async (
//     senderId: string,
//     receiverId: string,
//     symbol: string,
//     amount: number
// ) => {
//     const userRepository = getRepository(User);
//     const transactionRepository = getRepository(Transaction);

//     // Fetch sender and receiver
//     const sender = await userRepository.findOne({ where: { id: senderId } });
//     const receiver = await userRepository.findOne({ where: { id: receiverId } });

//     if (!sender) throw new Error("Sender not found");
//     if (!receiver) throw new Error("Receiver not found");

//     // Fetch the current price of the cryptocurrency
//     let price: number;
//     try {
//         const { data } = await axios.get(COINGECKO_API, {
//             params: { ids: symbol, vs_currencies: "usd" },
//         });

//         if (!data[symbol] || !data[symbol].usd) {
//             throw new Error(`Price not available for symbol ${symbol}`);
//         }

//         price = data[symbol].usd;
//     } catch (error: any) {
//         throw new Error(`Error fetching price from CoinGecko: ${error.message}`);
//     }

//     // Check sender's balance
//     const senderPortfolio = sender.portfolio?.find((item: any) => item.symbol === symbol);
//     if (!senderPortfolio || senderPortfolio.amount < amount) {
//         throw new Error("Insufficient funds in sender's portfolio");
//     }

//     // Update sender's portfolio
//     senderPortfolio.amount -= amount;

//     // Update receiver's portfolio
//     const receiverPortfolio = receiver.portfolio?.find((item: any) => item.symbol === symbol);
//     if (receiverPortfolio) {
//         receiverPortfolio.amount += amount;
//     } else {
//         if (!receiver.portfolio) receiver.portfolio = [];
//         receiver.portfolio.push({ symbol, amount });
//     }

//     // Save updated users
//     await userRepository.save(sender);
//     await userRepository.save(receiver);

//     // Create and save the transaction
//     const transaction = transactionRepository.create({
//         senderId,
//         receiverId,
//         symbol,
//         type: "TRANSFER",
//         amount,
//         price,
//     });
//     await transactionRepository.save(transaction);

//     return {
//         message: "Transfer successful", 
//         transaction,
//     };
// };