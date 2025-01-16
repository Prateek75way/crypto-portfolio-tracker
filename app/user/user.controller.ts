
import * as userService from "./user.service";
import { createResponse } from "../common/helper/response.hepler";
import asyncHandler from "express-async-handler";
import { type Request, type Response } from 'express'
import bcrypt from "bcrypt";
import userSchema from "./user.schema";
// Assuming a utility for formatting responses

export const createUser = asyncHandler(async (req: Request, res: Response) => {

        const result = await userService.createUser(req.body);
        res.status(201).send(createResponse(result, "User created successfully"));
     
        
    
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    
        const result = await userService.loginUser(email, password);

        // Set the access token as an HTTP-only cookie
        res.cookie("AccessToken", result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Only for HTTPS in production
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.status(200).send(createResponse(result, "Login successful"));
    
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    try {
        const { accessToken, refreshToken: newRefreshToken } = await userService.refreshTokens(refreshToken);

        // Set the new access token as an HTTP-only cookie
        res.cookie("AccessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Use HTTPS in production
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.status(200).send(
            createResponse(
                { accessToken, refreshToken: newRefreshToken },
                "Tokens refreshed successfully"
            )
        );
    } catch (error: any) {
        throw new Error(error.message);
    }
});

// export const updateUser = asyncHandler(async (req: Request, res: Response) => {
//     const result = await userService.updateUser(req.params.id, req.body);
//     res.send(createResponse(result, "User updated sucssefully"))
// });

// export const editUser = asyncHandler(async (req: Request, res: Response) => {
//     const result = await userService.editUser(req.params.id, req.body);
//     res.send(createResponse(result, "User updated sucssefully"))
// });

// export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
//     const result = await userService.deleteUser(req.params.id);
//     res.send(createResponse(result, "User deleted sucssefully"))
// });


// export const getUserById = asyncHandler(async (req: Request, res: Response) => {
//     const result = await userService.getUserById(req.params.id);
//     res.send(createResponse(result))
// });


// export const getAllUser = asyncHandler(async (req: Request, res: Response) => {
//     const result = await userService.getAllUser();
//     res.send(createResponse(result))
// });
