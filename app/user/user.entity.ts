import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    BeforeInsert,
    BeforeUpdate,
    getRepository,
} from "typeorm";
import bcrypt from "bcrypt";
import { Transaction } from "../crypto/crypto.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id?: string;

    @Column({ nullable: false })
    name?: string;

    @Column({ unique: true, nullable: false })
    email?: string;

    @Column({ default: true })
    active?: boolean;

    @Column({ type: "enum", enum: ["USER", "ADMIN"], default: "USER" })
    role?: "USER" | "ADMIN";

    @Column({ nullable: false })
    password?: string;

    @Column({ nullable: true })
    refreshToken?: string;

    @Column({ nullable: true })
    resetPasswordToken?: string;

    @Column({ type: "timestamp", nullable: true })
    resetPasswordExpires?: Date;

    @OneToMany(() => Transaction, (transaction) => transaction.sender)
    sentTransactions?: Transaction[];

    @OneToMany(() => Transaction, (transaction) => transaction.receiver)
    receivedTransactions?: Transaction[];

    @Column({ type: "json", nullable: true })
    portfolio?: Array<{
        symbol: string;
        amount: number;
    }>;

    @Column({ default: "usd" })
    defaultCurrency?: string;

    @Column({ default: 0 })
    transactionCount?: number;

    @Column({ type: "json", nullable: true })
    alertPreferences?: {
        enableAlerts: boolean;
        priceThresholds?: Array<{
            symbol: string;
            threshold: number;
        }>;
        triggeredAlerts?: Array<{
            symbol: string;
            threshold: number;
            triggeredAt: string;
        }>;
    };

    @CreateDateColumn()
    createdAt?: Date;

    @UpdateDateColumn()
    updatedAt?: Date;

    @BeforeInsert()
    async hashPasswordOnInsert() {
      if (this.password) {
        this.password = await bcrypt.hash(this.password, 12);
      }
    }
    @BeforeUpdate()
    async hashPasswordOnUpdate() {
      // Check if the password has changed
      if (this.password) {
        const userRepository = getRepository(User);
        const existingUser = await userRepository.findOne({
          where: { id: this.id },
          select: ["password"], 
        });
  
        if (existingUser && existingUser.password !== this.password) {
          this.password = await bcrypt.hash(this.password, 12);
        }
      }
    }
}