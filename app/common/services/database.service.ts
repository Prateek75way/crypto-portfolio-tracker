import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../../user/user.entity"; // Adjust path based on your project structure
import { Transaction } from "../../crypto/crypto.entity"; // Adjust path based on your project structure

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost", // Use environment variables for sensitive info
    port: 5432,
    username: "postgres",
    password: "1234",
    database: "crypto-tracker",
    synchronize: true, // Set to false in production to avoid unexpected schema changes
    logging: false, // Enable for debugging database queries
    entities: [User, Transaction], // Add all your entities here
    migrations: ["src/migrations/*.ts"], // Optional: Include path to your migrations
    subscribers: [],
});
