import nodemailer from 'nodemailer';

export class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to, resetUrl, token) {
    try {
      const mailOptions = {
        from: `"Your App" <${process.env.SMTP_USER}>`,
        to: to,
        subject: 'Reset Your Password',
        html: this.generatePasswordResetHTML(to, resetUrl, token),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  /**
   * Generate HTML template for password reset email
   */
  generatePasswordResetHTML(email, resetUrl, token) {
    return `
   <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #fff8f0;
            color: #333;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border-radius: 10px;
            overflow: hidden;
        }

        .header {
            background-color: #ff7a00;
            color: #fff;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 24px;
        }

        .content {
            padding: 30px;
        }

        .content p {
            margin: 0 0 15px;
        }

        .button {
            display: inline-block;
            background-color: #ff7a00;
            color: #fff;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            transition: background 0.3s ease;
        }

        .button:hover {
            background-color: #e76b00;
        }

        .link-box {
            word-break: break-all;
            background: #fff3e0;
            padding: 12px;
            border-radius: 5px;
            font-size: 14px;
            border-left: 4px solid #ff9800;
        }

        .warning {
            background-color: #fff4e5;
            border: 1px solid #ffe0b2;
            padding: 15px;
            border-radius: 6px;
            margin: 30px 0 15px;
        }

        .warning strong {
            display: block;
            margin-bottom: 8px;
            color: #e65100;
        }

        .footer {
            background-color: #f5f5f5;
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #888;
        }
    </style>
</head>

<body>

    <div class="container">

        <div class="header">
            <h1>Password Reset Request</h1>
        </div>

        <div class="content">
            <p>Hello,</p>

            <p>We received a request to reset the password for your account associated with <strong>${email}</strong>.</p>

            <p>Click the button below to reset your password:</p>

            <a href="${resetUrl}" class="button">Reset Password</a>

            <p>If the button above doesn't work, copy and paste this link into your browser:</p>

            <div class="link-box">${resetUrl}</div>

            <div class="warning">
                <strong>Security Notice:</strong>
                <ul>
                    <li>This link will expire in 15 minutes for your security.</li>
                    <li>If you didn't request a password reset, you can safely ignore this email.</li>
                    <li>Do not share this link with anyone.</li>
                </ul>
            </div>

            <p>If you have any questions or need help, please contact our support team.</p>

            <p>Best regards,<br><strong>Your App Team</strong></p>
        </div>

        <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
            <p>Token: ${token.substring(0, 8)}... (for debugging)</p>
        </div>

    </div>

</body>

</html>

    `;
  }

  /**
   * Test email configuration
   */
  async testEmailConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error);
      return false;
    }
  }
}
