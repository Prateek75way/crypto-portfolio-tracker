import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../../user/user.schema";
import { IUser } from "../../user/user.dto";

/**
 * Extends the Express Request object to include a user property.
 */
export interface AuthenticatedRequest extends Request {
    user?: Omit<IUser, "password">; // Exclude the password field from the user object
}

/**
 * Middleware to authenticate the user using a JWT stored in cookies.
 *
 * @param {AuthenticatedRequest} req - The incoming request object, extended to include user details after authentication.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 * @returns {void}
 */
export const authenticateUser = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Retrieve the JWT from the cookies
        const token = req.headers.authorization?.replace("Bearer ", ""); // Use the correct cookie name
        if (!token) {
            // If no token is provided, respond with 401 Unauthorized
            throw new Error("Authorization token is required");
        }
 
        // Verify the JWT using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            id: string; 
            role: string; 
        }; 
 
        // Look for the user associated with the decoded token's ID in the database
        const user = await User.findById(decoded.id);
        if (!user) {
            // If the user is not found, respond with 404 Not Found
            throw new Error("User not found")
        }

        // Attach user details to the request object, excluding the password field
        req.user = {
            _id: user._id.toString(),
            role: user.role,
            name: user.name, // Include name
            email: user.email, // Include email
            createdAt: user.createdAt, // Include createdAt timestamp
            updatedAt: user.updatedAt // Include updatedAt timestamp
        };

        // Proceed to the next middleware or route handler
        next();
    } catch (error: any) {
        // Handle errors and respond with a generic server error message
        throw new Error(error.message || "Failed to authenticate user");
    }
}; 
