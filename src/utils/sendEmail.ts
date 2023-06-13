import { transporter } from "../index.js";

/**Sends an email with nodemailer
 * @param recipient - the email address of the recipient
 * @param subject - the subject of the email
 * @param text - the text of the email
 * @returns void
 */
const sendEmail = (recipient: string, subject: string, text: string) => {
    const mailOptions = {
        from: process.env.DEFAULT_EMAIL,
        to: recipient,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, (err: any, info: any) => {
        if (err) {
            console.log(err);
        }
    });
};

export default sendEmail;