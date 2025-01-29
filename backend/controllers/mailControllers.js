const nodemailer=require('nodemailer');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const dotenv = require('dotenv');
const knex = require('../mysql/connection');
const bcrypt=require('bcrypt');


const forgotPassword = async (req,res) => {
    try {
      const { email } = req.body;
      console.log(email);
      const user = await knex('users').where({ email }).first();
      if (!user) {
        return res.status(400).json({error: "User has not signed up yet!"});
      }
   
    const accessToken = jwt.sign({ id: user.user_id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',        // Gmail's SMTP server
        port: 587,                     // Port number for non-secure connection (STARTTLS)
                                        // port: 465,  // SSL/TLS port for Gmail
        secure: false,                 // Indicates whether to use a secure connection (SSL/TLS). For Gmail, use 'false' with port 587 (STARTTLS).
        auth: {
          user: process.env.EMAIL,    // Gmail email address (pulled from environment variables)
          pass: process.env.EMAIL_APP_PASSWORD // Gmail app password (pulled from environment variables)
        },
        debug: true                    // Enables debugging logs for troubleshooting
      });
      
   
      // Verify connection configuration
      transporter.verify(function(error, success) {
        if (error) {
          console.error('Server connection error:', error);
          throw new Error('Email server connection failed');
        }
      });
   
      const link = `http://localhost:4200/reset-password/${user.user_id}/${accessToken}`;
    
      const mailOptions = {
        from: `"Password Reset" <${process.env.EMAIL}>`,
        to: email,
        subject: "Reset Your Password",
        text: "This Email is sent to Reset your password",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Reset Your Password</h2>
            <p>Click the button below to reset your password:</p>
              <a href="${link}"
               style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
            <p style="margin-top: 20px;">If the button doesn't work, copy and paste this link in your browser:</p>
              <p>${link}</p>
            <p style="color: #666;">This link will expire in 15 minutes.</p>
          </div>
        `
      };
   
      await transporter.sendMail(mailOptions);
      console.log(link)
      return res.status(200).json({message: "Reset link sent successfully"});
    } catch (err) {
      console.error('Error sending email:', err);
      return res.status(500).json({error: "Failed to send reset email. Please try again later."});
    }
  }
   
  const resetPassword = async (req,res) => {
    try{
        let {password} =  req.body;
        let {id,accessToken} = req.params;
        console.log('&&&&',id);
        console.log(password);
        
        const token = jwt.verify(accessToken,process.env.JWT_SECRET);
        if (!token) return res.status(400).send({ message: "This Email has expired!" });
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('*******',hashedPassword);

        // const isValidPassword = await bcrypt.compare(password, );
        // console.log(isValidPassword);


        await knex('users').where({ user_id:id }).update({ password: hashedPassword });
        return res.status(200).json({ message: "Password updated successfully" });
    }
    catch(err){
        console.log(err.message);
        return res.status(500).json({"error":"Internal Server Error"});
    }

  }
  module.exports={
    forgotPassword,
    resetPassword

  }
