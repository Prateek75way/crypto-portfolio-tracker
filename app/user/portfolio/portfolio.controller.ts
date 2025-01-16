import { Request, Response } from "express";
import * as portfolioService from "./portfolio.service";
import { createResponse } from "../../common/helper/response.hepler";

/**
 * Adds or updates a cryptocurrency in the user's portfolio.
 * @param req The express request object.
 * @param res The express response object.
 * @returns A JSON response with a success message and the updated portfolio item.
 * @throws An error if the body is missing 'symbol', 'amount', or 'price', or if the user isn't authenticated.
 */
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


/**
 * Removes a cryptocurrency from the user's portfolio.
 * @param req The express request object containing 'symbol' in the body.
 * @param res The express response object.
 * @returns A JSON response with a success message upon successful removal.
 * @throws An error if the body is missing 'symbol', or if the user isn't authenticated.
 */

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






/**
 * @route GET /portfolio/tax-report
 * @description Generate and retrieve a tax report for the authenticated user.
 * @access Private
 * @returns {Object} 200 - Success response with the tax report data
 * @returns {Object} 401 - Error response if user is not authenticated
 * @returns {Object} 500 - Internal server error response if tax report generation fails
 */

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

