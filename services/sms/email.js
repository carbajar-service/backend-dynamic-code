const nodemailer = require("nodemailer");
const config = require("../../config/index");

module.exports.SMTP = {
    service: "gmail",
    port: 587,
    auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS
    },
};

module.exports.sendEmail = async ({
    from,
    to,
    bcc,
    subject,
    html,
    attachments,
}) => {
    const transporter = nodemailer.createTransport(this.SMTP);
    return transporter.sendMail({
        from,
        to,
        bcc,
        subject,
        html,
        attachments,
    });
};
