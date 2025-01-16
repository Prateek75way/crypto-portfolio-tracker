import express from "express";
import userRoutes from "./user/user.route";
import cryptoRoutes from "./crypto/crypto.route";
import portfolioRoutes from "./user/portfolio/portfolio.route";
// routes
const router = express.Router();

router.use("/users", userRoutes);
router.use("/crypto", cryptoRoutes);
router.use("/portfolio", portfolioRoutes);

export default router;