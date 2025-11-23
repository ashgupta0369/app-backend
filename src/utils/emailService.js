import nodemailer from 'nodemailer';
import { ApiError } from './ApiError.js';
import { HTTP_STATUS } from '../constants.js';

const APP_NAME = process.env.APP_NAME || 'Mechanics App'; 

// Create email transporter
const createTransporter = () => {
  // For development, you can use services like Gmail, Outlook, or test services like Ethereal
  // For production, use services like SendGrid, AWS SES, etc.
  console.log('Creating email transporter with user:', process.env.EMAIL_USER);
  console.log('Creating email transporter with pass:', process.env.EMAIL_PASS);
  return nodemailer.createTransport({
    // Gmail configuration (you'll need to enable "Less secure app access" or use App Password)
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS  // Your app password
    }
    
    // Alternative: Using SMTP (more configurable)
    /*
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
    */
    
    // For testing purposes, you can use Ethereal Email
    /*
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal.pass'
    }
    */
  });
};

// Generate OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
};

// Send OTP email
export const sendOTPEmail = async (email, name, otp) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: APP_NAME,
        address: process.env.EMAIL_USER || 'noreply@mechanicsapp.com'
      },
      to: email,
      subject: 'Email Verification - OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .otp-box { 
              background-color: #fff; 
              border: 2px solid #007bff; 
              padding: 20px; 
              text-align: center; 
              margin: 20px 0;
              border-radius: 5px;
            }
            .otp-code { 
              font-size: 32px; 
              font-weight: bold; 
              color: #007bff; 
              letter-spacing: 5px;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for registering with ${APP_NAME}! To complete your registration, please verify your email address using the OTP below:</p>
              
              <div class="otp-box">
                <p><strong>Your Verification Code:</strong></p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <p><strong>Important:</strong></p>
              <ul>
                <li>This OTP is valid for 10 minutes only</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this verification, please ignore this email</li>
              </ul>
              
              <p>If you have any questions, please contact our support team.</p>
              
              <p>Best regards,<br>The ${APP_NAME} Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name},
        
        Thank you for registering with ${APP_NAME}!
        
        Your email verification code is: ${otp}
        
        This OTP is valid for 10 minutes only.
        
        Best regards,
        The ${APP_NAME} Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to send verification email'
    );
  }
};

// Send verification email with a verification link (token)
export const sendVerificationEmail = async (email, name, token) => {
  try {
    const transporter = createTransporter();
    const BASE_URL = process.env.BASE_URL; 
    const version = process.env.V1 || '/api/v1';
    const AGENTS = process.env.AGENTS || 'agents';
    const verificationUrl = `${BASE_URL.replace(/\/$/, '')}${version}/${AGENTS}/verify-email?token=${encodeURIComponent(token)}`;

    const mailOptions = {
      from: {
        name: APP_NAME,
        address: process.env.EMAIL_USER || 'noreply@mechanicsapp.com'
      },
      to: email,
      subject: 'Verify your email address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .btn { display: inline-block; padding: 12px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; }
            .token { font-family: monospace; background: #fff; padding: 6px 8px; border-radius: 4px; display: inline-block; margin-top: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thanks for signing up for ${APP_NAME}. Please verify your email address by clicking the button below:</p>
              <p style="text-align:center;"><a class="btn" href="${verificationUrl}">Verify Email</a></p>
              <p>If the button doesn't work, paste the following link into your browser:</p>
              <p class="token">${verificationUrl}</p>
              <p><strong>Or use this token:</strong></p>
              <p class="token">${token}</p>
              <p><strong>Important:</strong></p>
              <ul>
                <li>The verification link expires in 10 minutes.</li>
                <li>If you didn't request this, please ignore this email.</li>
              </ul>
              <p>Best regards,<br>The ${APP_NAME} Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${name},

      Please verify your email address for ${APP_NAME} by visiting the link below:

      ${verificationUrl}

      If the link doesn't work you can use this token:

      ${token}

      This link/token expires in 10 minutes.

      Best regards,
      The ${APP_NAME} Team`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to send verification email'
    );
  }
};
// Send welcome email after verification
export const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: APP_NAME,
        address: process.env.EMAIL_USER || 'noreply@mechanicsapp.com'
      },
      to: email,
      subject: `Welcome to ${APP_NAME}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ${APP_NAME}! 🎉</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Congratulations! Your email has been successfully verified and your account is now active.</p>
              
              <p><strong>What's next?</strong></p>
              <ul>
                <li>Complete your profile setup</li>
                <li>Browse available mechanics in your area</li>
                <li>Book your first service</li>
              </ul>
              
              <p>If you have any questions or need help getting started, our support team is here to help.</p>
              
              <p>Thank you for choosing ${APP_NAME}!</p>
              
              <p>Best regards,<br>The ${APP_NAME} Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name},
        
        Welcome to ${APP_NAME}!
        
        Your email has been successfully verified and your account is now active.
        
        Thank you for choosing ${APP_NAME}!
        
        Best regards,
        The ${APP_NAME} Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email failure - it's not critical
    console.log('Welcome email failed but user verification was successful');
  }
};