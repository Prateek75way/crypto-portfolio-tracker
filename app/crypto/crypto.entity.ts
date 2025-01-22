import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    OneToMany,
} from "typeorm";
import { User } from "../user/user.entity";

export enum TransactionType {
    BUY = "BUY",
    SELL = "SELL",
    TRANSFER = "TRANSFER",
}

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn("uuid")
    id?: string;

    @ManyToOne(() => User, (user) => user.sentTransactions, { nullable: true })
    sender?: User;

    @ManyToOne(() => User, (user) => user.receivedTransactions, { nullable: true })
    receiver?: User;

    @Column({ type: "varchar", length: 50, nullable: false })
    symbol?: string;

    @Column({ type: "enum", enum: TransactionType, nullable: false })
    type?: TransactionType;

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
    amount?: number;

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
    price?: number;

    @CreateDateColumn()
    date?: Date;
}

