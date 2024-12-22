const nodemailer = require('nodemailer');

// SMTP Server details
const smtpConfig = {
    host: 'smtp.hostinger.com', // Hostinger's SMTP server
    port: 465, // SSL port
    secure: true, // Use SSL
    auth: {
        user: 'prajjawal@quasar-tech.in', // Replace with your Hostinger email
        pass: 'Bbasu@123' // Replace with your email account password
    }
};


// Create a reusable transporter object
const transporter = nodemailer.createTransport(smtpConfig);

// Email options
const mailOptions = {
    from: '"Prajjawal - quasar_tech" <prajjawal@quasar-tech.in>', // Sender address
    to: 'panditprajjawal@gmail.com', // Recipient address
    subject: 'Test Email with Attachment', // Subject line
    text: 'Hello! This email contains an attachment.', // Plain text body
    html: '<p><b>Hello!</b> This email contains an attachment.</p>', // HTML body
    attachments: [
        {
            filename: 'floor plan', // File name displayed in the email
            path: '/Users/prajjawalpandit/Desktop/Personal-git/hotel-management-system/floor plan.jpeg' // File path on the local filesystem
        },
        {
            filename: 'floor plan', // File name displayed in the email
            path: '/Users/prajjawalpandit/Desktop/Personal-git/hotel-management-system/floor plan.jpeg' // File path on the local filesystem
        }
        ]
    };


// Send the email
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.error('Error occurred:', error.message);
    }
    console.log('Email sent successfully: %s', info.messageId);
});