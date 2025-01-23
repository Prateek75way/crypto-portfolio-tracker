import { Types } from "mongoose";

export interface ITransaction {
    senderId?: Types.ObjectId | string; // Sender's ID (optional for buy/sell)
    receiverId?: Types.ObjectId | string; // Receiver's ID (optional for buy/sell)
    symbol: string; // Cryptocurrency symbol (e.g., 'bitcoin')
    type: "BUY" | "SELL" | "TRANSFER"; // Type of transaction
    amount: number; // Quantity of cryptocurrency
    price: number; // Price per unit at the time of transaction
    date?: Date; // ISO string for the date of the transaction
}