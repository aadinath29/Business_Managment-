const nodemailer = require('nodemailer');

/**
 * Creates and returns a nodemailer transporter.
 * This is called each time an email is sent so it always reads the
 * latest environment variables (important after .env changes + restart).
 */
const createTransporter = () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            // Increase timeout to handle slow SMTP servers
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });
    }
    // No SMTP configured – use stream transport (logs to console)
    console.warn('⚠️  SMTP credentials not set. Emails will be printed to the console.');
    return nodemailer.createTransport({ streamTransport: true, newline: 'windows' });
};

const sendResetEmail = async (to, resetUrl) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"Lead Management System" <no-reply@example.com>',
        to,
        subject: 'Password Reset Request',
        text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
                <h2 style="color: #2563eb;">Password Reset Request</h2>
                <p>You requested a password reset for your Lead Management System account.</p>
                <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
                <a href="${resetUrl}" style="display:inline-block; padding: 12px 24px; background:#2563eb; color:#fff; text-decoration:none; border-radius:6px; margin: 16px 0;">
                    Reset My Password
                </a>
                <p style="color:#666; font-size: 13px;">If the button doesn't work, copy and paste this link into your browser:<br>${resetUrl}</p>
                <hr style="border:none; border-top:1px solid #eee; margin-top:24px;"/>
                <p style="color:#999; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
            </div>
        `
    };

    try {
        const transporter = createTransporter();
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Reset email sent successfully to:', to, '| Message ID:', info.messageId);

        // If using stream transport (no SMTP), print the message to console
        if (info.message) {
            console.log('\n--- EMAIL CONTENT (dev mode) ---');
            console.log('TO:', to);
            console.log('RESET LINK:', resetUrl);
            console.log('--------------------------------\n');
        }
    } catch (error) {
        // CRITICAL: Log the error but also print the reset link so it is
        // never lost. This means the user flow still succeeds even if
        // SMTP is misconfigured.
        console.error('❌ Failed to send reset email via SMTP:', error.message);
        console.log('\n=== SMTP FAILED — RESET LINK (copy for testing) ===');
        console.log('TO:', to);
        console.log('LINK:', resetUrl);
        console.log('====================================================\n');
        // Do NOT re-throw – we do not want a misconfigured email server
        // to cause a 500 error for the end user. The token is saved in
        // the DB regardless and the admin can retrieve it from the logs.
    }
};

module.exports = {
    sendResetEmail
};
