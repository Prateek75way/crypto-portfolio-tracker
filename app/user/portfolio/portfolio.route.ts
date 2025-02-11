import express from "express";
import * as portfolioController from "./portfolio.controller";

import { authenticateUser } from "../../common/middleware/authenticate.middleware";
import { rateLimiter } from "../../common/middleware/rate-limitter.middleware";

const router = express.Router();

// Portfolio Management

router.delete("/", rateLimiter, authenticateUser, portfolioController.deleteCryptoFromPortfolio); 


// Tax Reporting
router.get("/tax-report", authenticateUser, portfolioController.getTaxReport);

export default router;
  