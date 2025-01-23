import User from "../user.schema";
import Transaction from "../../crypto/crypto.schema"
interface PortfolioItem {
    symbol: string;
    amount: number;
}

interface IUser {
    portfolio: PortfolioItem[];
}

/**
 * Add or update a cryptocurrency in the user's portfolio.
 * @param userId - User ID.
 * @param symbol - Cryptocurrency symbol.
 * @param amount - Amount of cryptocurrency.
 * @param price - Buy price of the cryptocurrency.
 */
export const addOrUpdateCrypto = async (userId: string, symbol: string, amount: number, price: number) => {
    const user = await User.findById(userId); // Type assertion
    if (!user) throw new Error("User  not found");

    // Ensure portfolio is defined
    if (!user.portfolio) {
        user.portfolio = []; // Initialize if undefined
    }

    const portfolioItem = user.portfolio.find((item) => item.symbol === symbol);

    if (portfolioItem) {
        portfolioItem.amount += amount;
    } else {
        user.portfolio.push({ symbol, amount });
    }

    await user.save();
    return { message: `${symbol} added/updated in portfolio` };
};

/**
 * Remove a cryptocurrency from the user's portfolio.
 * @param userId - User ID.
 * @param symbol - Cryptocurrency symbol to remove.
 */
export const removeCrypto = async (userId: string, symbol: string) => {
    const user = await User.findById(userId); // Type assertion
    if (!user) throw new Error("User  not found");

    // Ensure portfolio is defined
    if (!user.portfolio) {
        user.portfolio = []; // Initialize if undefined
    }

    user.portfolio = user.portfolio.filter((item) => item.symbol !== symbol);

    await user.save();
    return { message: `${symbol} removed from portfolio` };
};




    /**
     * Generate tax report using FIFO method.
     * @param userId - User ID.
     * @returns Tax report with taxable events in the format of an array of objects with the following properties:
     * - `symbol`: Cryptocurrency symbol.
     * - `amount`: Amount of cryptocurrency sold.
     * - `sellPrice`: Price at which the cryptocurrency was sold.
     * - `buyPrice`: Price at which the cryptocurrency was bought.
     * - `profit`: Profit made from selling the cryptocurrency.
     * - `date`: Date of the sale in ISO string format.
     * @throws {Error} - If insufficient holdings of a cryptocurrency are found to sell the requested amount.
     */
    
    /**
     * Generate tax report using FIFO method.
     * @param userId - User ID.
     * @returns Tax report with taxable events in the format of an array of objects with the following properties:
     * - `symbol`: Cryptocurrency symbol.
     * - `amount`: Amount of cryptocurrency sold.
     * - `sellPrice`: Price at which the cryptocurrency was sold.
     * - `buyPrice`: Price at which the cryptocurrency was bought.
     * - `profit`: Profit made from selling the cryptocurrency.
     * - `date`: Date of the sale in ISO string format.
     * @throws {Error} - If insufficient holdings of a cryptocurrency are found to sell the requested amount.
     */
export const generateTaxReport = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // Fetch transactions for the user from the Transaction collection
    const transactions = await Transaction.find({ userId }).sort({ date: 1 }); // FIFO: Sort by date

    if (!transactions || transactions.length === 0) {
        throw new Error("No transactions found for the user");
    }
    const taxableEvents: Array<{
        symbol: string;
        amount: number;
        sellPrice: number;
        buyPrice: number;
        profit: number;
        date: string;
    }> = [];

    const holdings: Record<string, Array<{ amount: number; buyPrice: number; date: string }>> = {};

    for (const tx of transactions) {
        const { type, symbol, amount, price, date } = tx;
        if(!date){
            throw new Error ("Date is missing")
        }
        if (type === "BUY") {
            // Add to holdings
            if (!holdings[symbol]) holdings[symbol] = [];
            holdings[symbol].push({ amount, buyPrice: price, date: date.toISOString() }); // Convert to string
        } else if (type === "SELL") {
            // Process sales using FIFO
            let remainingAmount = amount;

            while (remainingAmount > 0 && holdings[symbol]?.length > 0) {
                const lot = holdings[symbol][0]; // Take the first lot (FIFO)
                const sellAmount = Math.min(remainingAmount, lot.amount);

                const profit = sellAmount * (price - lot.buyPrice);

                taxableEvents.push({
                    symbol,
                    amount: sellAmount,
                    sellPrice: price,
                    buyPrice: lot.buyPrice,
                    profit,
                    date: date.toISOString(), // Convert to string
                });

                lot.amount -= sellAmount;
                remainingAmount -= sellAmount;

                if (lot.amount <= 0) {
                    // Remove the lot if fully sold
                    holdings[symbol].shift();
                }
            }

            if (remainingAmount > 0) {
                throw new Error(`Insufficient holdings of ${symbol} to sell ${amount}`);
            }
        }
    }

    return { taxableEvents };
};
