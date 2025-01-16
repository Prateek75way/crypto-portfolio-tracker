import express from "express";
import * as cryptoController from "./crypto.controller";
import { authenticateUser } from "../common/middleware/authenticate.middleware";

const router = express.Router();

router
    // Route for fetching live prices
    .get("/prices", cryptoController.fetchPrices)

    // Route for fetching cached prices
    .get("/prices/cached", cryptoController.getCachedPrices)
    .get("/portfolio/pnl",authenticateUser, cryptoController.getProfitAndLoss)
    .post("/transactions", authenticateUser, cryptoController.createTransaction);


export default router;
 