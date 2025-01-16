import cron from "node-cron";
import axios from "axios";
import User from "../user.schema";
import { sendEmail } from "../../common/helper/send-mail.helper";

/**
 * @description Checks if any of the users' price thresholds have been reached.
 * This function fetches all users with alerts enabled and checks their price thresholds.
 * If the threshold is crossed, it triggers a notification for the user.
 * The function runs every 10 minutes as per the cron schedule.
 */
const checkPriceThresholds = async () => {
    console.log("Checking price thresholds...");

    // Fetch all users with alerts enabled
    const users = await User.find({ "alertPreferences.enableAlerts": true });

    for (const user of users) {
        // Ensure alertPreferences is defined
        if (!user.alertPreferences || !user.alertPreferences.priceThresholds) {
            console.log(`No alert preferences found for user ${user.name}`);
            continue; // Skip to the next user
        }

        for (const alert of user.alertPreferences.priceThresholds) {
            // Ensure the symbol and threshold are defined
            if (typeof alert.symbol !== 'string' || typeof alert.threshold !== 'number') {
                console.log(`Invalid alert for user ${user.name}: ${JSON.stringify(alert)}`);
                continue; // Skip to the next alert
            }

            // Fetch real-time price (e.g., using CoinGecko API)
            try {
                const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
                    params: {
                        ids: alert.symbol,
                        vs_currencies: user.defaultCurrency || "usd", // Default to "usd" if not defined
                    },
                });

                // Ensure data[alert.symbol] is defined before accessing it
                const currentPrice = data[alert.symbol]?.[user.defaultCurrency as string] || 0; // Default to 0 if not found
                console.log(`Current price for ${alert.symbol}: ${currentPrice}`);

                // Check if the threshold is crossed
                if (currentPrice >= alert.threshold) {
                    console.log(`Alert triggered for ${user.name}: ${alert.symbol} reached ${currentPrice}`);

                    // Notify the user (e.g., email, push notification)
                    await sendNotification(user, alert.symbol, currentPrice);
                }
            } catch (error: any) {
                console.error(`Error fetching price for ${alert.symbol}:`, error.message);
            }
        }
    }
};

// Schedule the task to run every 10 minutes
cron.schedule("*/10 * * * *", checkPriceThresholds); 

/**
 * @description Sends a notification to the user via email when a price alert is triggered.
 * @param {Object} user - The user who is to be notified
 * @param {string} symbol - The cryptocurrency symbol (e.g., "bitcoin")
 * @param {number} price - The current price of the cryptocurrency
 * @returns {Promise<void>} - Sends an email notification to the user
 */
const sendNotification = async (user: any, symbol: string, price: number) => {
    await sendEmail({
        to: user.email,
        subject: `Price Alert for ${symbol}`,
        text: `The price of ${symbol} has reached ${price}`,
    });
    console.log(`Notifying ${user.email} about ${symbol}: Price is ${price}`);
};
