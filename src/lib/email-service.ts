import nodemailer from "nodemailer";

export async function sendCredentialUpdateEmail(credentials: { username: string; password: string }) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: "mishabvibwdddddes@gmail.com",
            subject: "Security Alert: Admin Credentials Updated - Funoon Fiesta",
            text: `
Hello,

This is a security notification to inform you that the admin credentials for the Funoon Fiesta portal have just been updated.

New Username: ${credentials.username}
New Password: ${credentials.password}

Time of change: ${new Date().toLocaleString()}

If you did not authorize this change, please take immediate action to secure your application.

Best regards,
Funoon Fiesta Security
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log("Credential update email sent successfully.");
    } catch (error) {
        console.error("Failed to send credential update email:", error);
        // We don't throw here to avoid breaking the user flow, but we log it.
    }
}
