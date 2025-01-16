import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import * as cryptoService from "./crypto.service";
import { createResponse } from "../common/helper/response.hepler";

/**
 * Controller to fetch live cryptocurrency prices.
 * @route GET /api/prices
 */
export const fetchPrices = asyncHandler(async (req: Request, res: Response) => {
    const { symbols, currency } = req.query;

    if (!symbols || typeof symbols !== "string") {
        throw new Error("Query parameter 'symbols' is required and must be a comma-separated string.");
    }

    const symbolList = symbols.split(",");
    const fiatCurrency = (currency as string) || "usd";

    const prices = await cryptoService.fetchCryptoPrices(symbolList, fiatCurrency);
    res.status(200).send(createResponse(prices, "Fetched live prices successfully"));
});

/**
 * Controller to get cached cryptocurrency prices.
 * @route GET /api/prices/cached
 */
export const getCachedPrices = asyncHandler(async (req: Request, res: Response) => {
    const prices = cryptoService.getCachedPrices();
    res.status(200).send(createResponse(prices, "Fetched cached prices successfully"));
});

/**
 * Controller to calculate and fetch user's profit and loss.
 * @route GET /api/portfolio/pnl
 */
export const getProfitAndLoss = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id; // Assume userId is attached to the request after authentication

    if (!userId) {
        throw new Error("User ID is required");
    }

    const pnl = await cryptoService.calculateProfitAndLoss(userId);
    res.status(200).send(createResponse(pnl, "Fetched profit and loss successfully"));
});


export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id; // Assume authentication middleware attaches the user to the request
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const { symbol, type, amount, price } = req.body;

    if (!symbol || !type || !amount || !price) {
        throw new Error("All fields (symbol, type, amount, price) are required");
    }

    const transaction = await cryptoService.createTransaction(userId, { symbol, type, amount, price });
    res.status(201).send(createResponse(transaction, "Transaction created successfully"));
});