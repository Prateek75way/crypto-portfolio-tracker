import { Request, Response } from "express";
import * as portfolioService from "./portfolio.service";
import { createResponse } from "../../common/helper/response.hepler";

export const addCryptoToPortfolio = async (req: Request, res: Response) => {
    try {
        const { symbol, amount, price } = req.body;
        const userId = req.user?._id as string;

        const result = await portfolioService.addOrUpdateCrypto(userId, symbol, amount, price);
        return res.status(200).send(createResponse(result, "Crypto added/updated successfully"));
    } catch (error: any) {
        console.error(error.message);
        throw new Error("Failed to add/update crypto");
    }
};

export const deleteCryptoFromPortfolio = async (req: Request, res: Response) => {
    try {
        const { symbol } = req.body;
        const userId = req.user?._id as string;

        const result = await portfolioService.removeCrypto(userId, symbol);
        return res.status(200).send(createResponse(result, "Crypto removed successfully"));
    } catch (error: any) {
        console.error(error.message);
        throw new Error("Failed to remove crypto");
    }
};






export const getTaxReport = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id as string;

        const report = await portfolioService.generateTaxReport(userId);
        return res.status(200).send(createResponse(report, "Tax report generated successfully"));
    } catch (error: any) {
        console.error(error.message);
        throw new Error("Failed to generate tax report");
    }
};

