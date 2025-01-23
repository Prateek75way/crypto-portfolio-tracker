import nodemailer from "nodemailer";
import http from "http";
import { createResponse } from "./response.hepler";



export const sendEmail = async({
    to, 
    subject,
    text
}: {
    to: string,
    subject: string,
    text: string,
    
}) => {
    try {
        
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        })

        
        

        const mailOptions = {
            from : process.env.MAIL_USER,
            to,
            subject,
            text
        }

        await transporter.sendMail(mailOptions)
        return true
    } catch (err) {
        console.log(err);
        return false
        
    }
}