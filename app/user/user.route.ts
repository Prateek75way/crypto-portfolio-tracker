
import { Router } from "express";
import { catchError } from "../common/middleware/cath-error.middleware";
import * as userController from "./user.controller";
import * as userValidator from "./user.validation";

const router = Router();

router
        .post("/", userValidator.createUser, catchError, userController.createUser)
        .post("/login", userValidator.loginUser, catchError, userController.loginUser)
        // .get("/", userController.getAllUser)
        // .get("/:id", userController.getUserById)
        // .delete("/:id", userController.deleteUser)
        // .put("/:id", userValidator.updateUser, catchError, userController.updateUser)
        // .patch("/:id", userValidator.editUser, catchError, userController.editUser)

export default router;

