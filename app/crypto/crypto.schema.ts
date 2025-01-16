import mongoose from "mongoose";

const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
    senderId: { type: mongoose.Types.ObjectId, ref: "User"},  // Sender of the transfer
    receiverId: { type: mongoose.Types.ObjectId, ref: "User"}, // Receiver of the transfer
    symbol: { type: String, required: true }, // Cryptocurrency symbol (e.g., 'bitcoin')
    type: { type: String, enum: ["BUY", "SELL", "TRANSFER"], required: true },  // Include TRANSFER type
    amount: { type: Number, required: true }, // Quantity of cryptocurrency
    price: { type: Number, required: true }, // Price per unit at the time of transaction (optional)
    date: { type: Date, default: Date.now }, // Date of the transfer
});

export default mongoose.model("Transaction", TransactionSchema);
