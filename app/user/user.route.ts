
import { Router } from "express";
import { catchError } from "../common/middleware/cath-error.middleware";
import * as userController from "./user.controller";
import * as userValidator from "./user.validation";
import { authenticateUser } from "../common/middleware/authenticate.middleware";
import { rateLimiter } from "../common/middleware/rate-limitter.middleware";

const router = Router();

router
        .get("/", userController.getAllUsers)
        .post("/", rateLimiter,userValidator.createUser, catchError, userController.createUser)   
        .post("/login",rateLimiter, userValidator.loginUser, catchError, userController.loginUser)  
        .post("/refresh", rateLimiter, userValidator.refreshToken, catchError, userController.refresh) 
        .post("/alerts",rateLimiter, authenticateUser, userController.addOrUpdateAlert)
        .get("/portfolio", authenticateUser, userController.getPortfolio)
        .post("/logout", rateLimiter, authenticateUser, userController.logoutController)
        .post("/forgot-password", userController.forgotPassword)
        .post("/reset-password", userController.resetPassword);
        // .get("/", userController.getAllUser)
        // .get("/:id", userController.getUserById) 
        // .delete("/:id", userController.deleteUser)
        // .put("/:id", userValidator.updateUser, catchError, userController.updateUser)
        // .patch("/:id", userValidator.editUser, catchError, userController.editUser)

export default router; 

