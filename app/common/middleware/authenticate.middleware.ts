import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../../user/user.schema";
import { IUser } from "../../user/user.dto";

export interface AuthenticatedRequest extends Request {
    user?: Omit<IUser , "password">;
}

export const authenticateUser  = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.AccessToken; // Use the correct cookie name
        if (!token) {
            return res.status(401).json({ message: "Authorization token is required" });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role: string };

        // Find the user in the database
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: "User  not found" });
        }

        // Attach user details to the request 
        req.user = {
            _id: user._id.toString(),
            role: user.role,
            name: user.name, // Include name
            email: user.email, // Include email
            createdAt: user.createdAt, // Include createdAt
            updatedAt: user.updatedAt // Include updatedAt
        };
        next();
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};