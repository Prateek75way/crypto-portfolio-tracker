import express from "express";
import * as cryptoController from "./crypto.controller";
import { authenticateUser } from "../common/middleware/authenticate.middleware";
import { rateLimiter } from "../common/middleware/rate-limitter.middleware";

const router = express.Router();

router
    // Route for fetching live prices
    .get("/prices", cryptoController.fetchPrices)

    // Route for fetching cached prices
    .get("/prices/cached", cryptoController.getCachedPrices)
    .get("/portfolio/pnl",authenticateUser, cryptoController.getProfitAndLoss)
    .post("/transactions", rateLimiter,authenticateUser, cryptoController.createTransaction)
    // .post("/transfer", rateLimiter, authenticateUser, cryptoController.transferCrypto);


export default router;
   