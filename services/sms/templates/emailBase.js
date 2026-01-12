module.exports.emailBaseTemplate = ({ title, content }) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, Helvetica, sans-serif;">
    
    <!-- Wrapper -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px 0;">
        <tr>
            <td align="center">

                <!-- Main Container -->
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background:#2563eb; padding:24px; text-align:center;">
                            <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:600;">
                                ${title}
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding:28px; color:#333333; font-size:15px; line-height:1.7;">
                            ${content}
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding:0 28px;">
                            <hr style="border:none; border-top:1px solid #e5e7eb;" />
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:18px; text-align:center; font-size:12px; color:#6b7280;">
                            © ${new Date().getFullYear()} <strong>CarBajar</strong>. All rights reserved.
                            <br/>
                            This is an automated message, please do not reply.
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
    `;
};
