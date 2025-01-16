
import { Router } from "express";
import { catchError } from "../common/middleware/cath-error.middleware";
import * as userController from "./user.controller";
import * as userValidator from "./user.validation";
import { authenticateUser } from "../common/middleware/authenticate.middleware";

const router = Router();

router
        .get("/", userController.getAllUsers)
        .post("/", userValidator.createUser, catchError, userController.createUser)   
        .post("/login", userValidator.loginUser, catchError, userController.loginUser)  
        .post("/refresh", userValidator.refreshToken, catchError, userController.refresh) 
        .post("/alerts", authenticateUser, userController.addOrUpdateAlert)
        .get("/portfolio", authenticateUser, userController.getPortfolio)
        .post("/logout", authenticateUser, userController.logoutController);
        // .get("/", userController.getAllUser)
        // .get("/:id", userController.getUserById) 
        // .delete("/:id", userController.deleteUser)
        // .put("/:id", userValidator.updateUser, catchError, userController.updateUser)
        // .patch("/:id", userValidator.editUser, catchError, userController.editUser)

export default router; 

