import { transporter } from '../index.js';
/**Sends an email with nodemailer
 * @param recipient - the email address of the recipient
 * @param subject - the subject of the email
 * @param text - the text of the email
 * @returns void
 */
const sendEmail = (recipient, subject, text) => {
    const mailOptions = {
        from: process.env.DEFAULT_EMAIL,
        to: recipient,
        subject: subject,
        text: text
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        }
    });
};
export default sendEmail;
