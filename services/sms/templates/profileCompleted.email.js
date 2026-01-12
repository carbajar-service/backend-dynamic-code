const { emailBaseTemplate } = require("./emailBase");

module.exports.profileCompletedEmail = ({ driverName }) => {
    return emailBaseTemplate({
        title: "Profile Completed 🎉",
        content: `
            <p style="font-size:16px;">
                Hi <strong>${driverName || "Driver"}</strong>,
            </p>

            <p>
                Great news! 🎉 Your profile has been successfully completed and
                submitted for verification.
            </p>

            <p>
                Our team is currently reviewing your details. Once the verification
                process is completed, you will receive a confirmation notification.
            </p>

            <p>
                You don’t need to take any further action at this moment.
                If we require additional information, we’ll reach out to you.
            </p>

            <p>
                For any questions or assistance, feel free to contact our support team.
                We’re always happy to help.
            </p>

            <p style="margin-top:24px;">
                Warm regards,<br/>
                <strong>CarBajar Rental Cab Team</strong>
            </p>
        `
    });
};
