import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  // For development, use Gmail or any SMTP service
  // For production, use a proper email service like SendGrid, AWS SES, etc.

  if (process.env.NODE_ENV === 'production') {
    // Production configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Development configuration (Gmail example)
    // NOTE: For Gmail, you need to enable "Less secure app access" or use App Password
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
};

/**
 * Send OTP email
 */
export const sendOTPEmail = async (email, otp, type = 'verification') => {
  try {
    const transporter = createTransporter();

    const subject =
      type === 'verification'
        ? 'Email Verification - SmartWash'
        : 'Password Reset - SmartWash';

    const message =
      type === 'verification'
        ? `Your email verification OTP is: <strong>${otp}</strong><br><br>This OTP will expire in 20 minutes.<br><br>If you didn't request this, please ignore this email.`
        : `Your password reset OTP is: <strong>${otp}</strong><br><br>This OTP will expire in 20 minutes.<br><br>If you didn't request this, please contact the administrator.`;

    const mailOptions = {
      from: `SmartWash <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #228B22;">SmartWash Laundry Management</h2>
          <p>Hello,</p>
          <p>${message}</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h1 style="color: #228B22; text-align: center; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email: ' + error.message);
  }
};

/**
 * Send welcome email to new student
 */
export const sendWelcomeEmail = async (email, name, password = null) => {
  try {
    const transporter = createTransporter();

    // Different email content based on whether password is provided
    const passwordSection = password
      ? `
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${password}</p>
        </div>
        <p style="color: #d9534f;"><strong>Important:</strong> Please change your password after your first login.</p>
      `
      : `
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Status:</strong> Email verified successfully</p>
        </div>
        <p>You can now log in to your account using the password provided by your administrator.</p>
      `;

    const mailOptions = {
      from: `SmartWash <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to SmartWash Laundry Management',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #228B22;">Welcome to SmartWash!</h2>
          <p>Hello ${name},</p>
          <p>Your email has been verified successfully. Your account is now active!</p>
          ${passwordSection}
          <p>Thank you,<br>SmartWash Team</p>
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error - welcome email is not critical
    return { success: false, error: error.message };
  }
};
