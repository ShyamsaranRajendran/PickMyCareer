const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'shyamsaran0206@gmail.com',
        pass: 'vyki efil wiww ybav',
    }
});

async function sendEmail(to, subject, text, html) {

    const mailOptions = {
        from: 'shyamsaran0206@gmail.com',
        to: to, 
        subject: subject, 
        text: text, 
        html: html 
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return 'Email sent successfully';
    } catch (error) {
        console.error(error);
        throw new Error('Error sending email');
    }
}

module.exports = sendEmail;
