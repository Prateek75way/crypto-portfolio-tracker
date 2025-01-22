import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import * as cryptoService from "./crypto.service";
import { createResponse } from "../common/helper/response.hepler";

/**
 * Controller to fetch live cryptocurrency prices.
 * @route GET /api/prices
 * @param {Request} req - The request object containing query parameters
 * @param {Response} res - The response object to send back data
 * @throws {Error} - Throws an error if the 'symbols' query parameter is missing or invalid
 * @returns {Response} - Returns a response with live prices
 */
export const fetchPrices = asyncHandler(async (req: Request, res: Response) => {
    const { symbols, currency } = req.query;

    if (!symbols || typeof symbols !== "string") {
         res.status(400).json({ message: "Query parameter 'symbols' is required and must be a comma-separated string." });
    }
    
    const symbolList = (symbols?.toString())?.split(",");
    const fiatCurrency = (currency as string) || "usd";

    try {
        if (!symbolList) {
            throw new Error("symbolList must be defined");
        }
        const prices = await cryptoService.fetchCryptoPrices(symbolList, fiatCurrency);
         res.status(200).send(createResponse(prices, "Fetched live prices successfully"));
    } catch (error: any) {
        console.error("Error fetching prices:", error.message);
         res.status(500).json({ message: error.message || "Unable to fetch prices" });
    }
});

/**
 * Controller to get cached cryptocurrency prices.
 * @route GET /api/prices/cached
 * @param {Request} req - The request object
 * @param {Response} res - The response object containing cached prices
 * @returns {Response} - Returns cached prices
 */
export const getCachedPrices = asyncHandler(async (req: Request, res: Response) => {
    const prices = cryptoService.getCachedPrices();
    res.status(200).send(createResponse(prices, "Fetched cached prices successfully"));
});

/**
 * Controller to calculate and fetch user's profit and loss.
 * @route GET /api/portfolio/pnl
 * @param {Request} req - The request object containing user information
 * @param {Response} res - The response object to send the profit and loss data
 * @throws {Error} - Throws an error if the user ID is not found
 * @returns {Response} - Returns the profit and loss details for the user
 */
export const getProfitAndLoss = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id; // Assume userId is attached to the request after authentication

    if (!userId) {
        throw new Error("User ID is required");
    }

    const pnl = await cryptoService.calculateProfitAndLoss(userId);
    res.status(200).send(createResponse(pnl, "Fetched profit and loss successfully"));
});

/**
 * Controller to create a transaction.
 * @route POST /api/portfolio/transaction
 * @param {Request} req - The request object containing user authentication and transaction data
 * @param {Response} res - The response object to send back transaction data
 * @throws {Error} - Throws an error if required fields are missing or user is not authenticated
 * @returns {Response} - Returns the created transaction details
 */
export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id; // Assume authentication middleware attaches the user to the request
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const { symbol, type, amount } = req.body;

    if (!symbol || !type || !amount) {
        throw new Error("All fields (symbol, type, amount) are required");
    }

    try {
        const transaction = await cryptoService.createTransaction(userId, { symbol, type, amount });
        res.status(201).send(createResponse(transaction, "Transaction created successfully"));
    } catch (error: any) {
        res.status(500).send({ success: false, message: error.message });
    }
});

/**
 * Controller to transfer cryptocurrency between users.
 * @route POST /api/portfolio/transfer
 * @param {Request} req - The request object containing transfer details (sender, receiver, symbol, amount)
 * @param {Response} res - The response object to send back transfer result
 * @throws {Error} - Throws an error if transfer fails
 * @returns {Response} - Returns transfer result
 */
// export const transferCrypto = async (req: Request, res: Response) => {
//     const { senderId, receiverId, symbol, amount } = req.body;

//     if (!senderId || !receiverId || !symbol || !amount) {
//         return res.status(400).json({
//             error: "All fields are required: senderId, receiverId, symbol, amount",
//         });
//     }

//     try {
//         const result = await cryptoService.transferCrypto(senderId, receiverId, symbol, amount);
//         return res.status(200).json(result);
//     } catch (error: any) {
//         return res.status(400).json({ error: error.message });
//     }
// };
