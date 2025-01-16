import express from "express";
import userRoutes from "./user/user.route";
import cryptoRoutes from "./crypto/crypto.route";

// routes
const router = express.Router();

router.use("/users", userRoutes);
router.use("/crypto", cryptoRoutes);

export default router;