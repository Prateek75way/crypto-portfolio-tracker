import { type BaseSchema } from "../common/dto/base.dto";

export interface IUser extends BaseSchema {
    name: string;
    email: string;
    active?: boolean;
    role: "USER" | "ADMIN";
    password: string;
    refreshToken?: string;

    // Optional fields for portfolio and user settings
    portfolio?: Array<{
        symbol: string; // Cryptocurrency symbol, e.g., 'bitcoin'
        amount: number; // Total amount held
    }>;
    defaultCurrency?: string; // User's preferred fiat currency, e.g., 'usd'
    transactionCount?: number; // Total number of transactions
    alertPreferences?: {
        enableAlerts: boolean; // Whether alerts are enabled
        priceThresholds?: Array<{
            symbol: string; // Cryptocurrency symbol
            threshold: number; // Price threshold for alerts
        }>;
    };
}
