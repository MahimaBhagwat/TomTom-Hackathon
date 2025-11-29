const { panicLogsCollection, usersCollection } = require('../services/firebaseService');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

/**
 * POST /api/panic
 * Trigger emergency alert and notify trusted contacts
 */
async function triggerPanic(req, res) {
  try {
    const { userId, location, message, audioUrl } = req.body;

    if (!userId || !location || !location.lat || !location.lon) {
      return res.status(400).json({ 
        error: 'UserId and location (lat, lon) are required',
        example: {
          userId: 'user123',
          location: { lat: 40.7128, lon: -74.0060 },
          message: 'Emergency! Need help!'
        }
      });
    }

    // Log panic event
    const panicLog = {
      userId,
      location: {
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon)
      },
      message: message || 'Emergency alert triggered',
      audioUrl: audioUrl || null,
      timestamp: new Date()
    };

    await panicLogsCollection.add(panicLog);

    // Get user's trusted contacts
    let trustedContacts = [];
    try {
      const userDoc = await usersCollection.doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        trustedContacts = userData.trustedContacts || [];
      }
    } catch (error) {
      console.error('Error fetching user contacts:', error);
    }

    // Send notifications to trusted contacts
    const notifications = await sendNotifications(trustedContacts, panicLog);

    res.json({
      success: true,
      message: 'Panic alert triggered',
      location: panicLog.location,
      notificationsSent: notifications.length,
      notifications
    });

  } catch (error) {
    console.error('Error triggering panic:', error);
    res.status(500).json({ 
      error: 'Failed to trigger panic alert',
      message: error.message 
    });
  }
}

/**
 * Send notifications to trusted contacts via email/SMS
 */
async function sendNotifications(contacts, panicLog) {
  const results = [];

  for (const contact of contacts) {
    try {
      if (contact.type === 'email' && contact.value) {
        await sendEmail(contact.value, panicLog);
        results.push({ contact: contact.value, method: 'email', status: 'sent' });
      } else if (contact.type === 'sms' && contact.value) {
        await sendSMS(contact.value, panicLog);
        results.push({ contact: contact.value, method: 'sms', status: 'sent' });
      }
    } catch (error) {
      console.error(`Error sending notification to ${contact.value}:`, error);
      results.push({ contact: contact.value, method: contact.type, status: 'failed', error: error.message });
    }
  }

  return results;
}

/**
 * Send email notification
 */
async function sendEmail(email, panicLog) {
  // Configure nodemailer (you'll need to set up SMTP in .env)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const googleMapsLink = `https://www.google.com/maps?q=${panicLog.location.lat},${panicLog.location.lon}`;
  const audioSection = panicLog.audioUrl ? `<p><strong>Audio Recording:</strong> <a href="${panicLog.audioUrl}">Listen to recording</a></p>` : '';

  const mailOptions = {
    from: process.env.SMTP_FROM || 'safewalk@example.com',
    to: email,
    subject: '🚨 SafeWalk Emergency Alert',
    html: `
      <h2>Emergency Alert from SafeWalk</h2>
      <p><strong>Message:</strong> ${panicLog.message}</p>
      <p><strong>Location:</strong> ${panicLog.location.lat}, ${panicLog.location.lon}</p>
      <p><a href="${googleMapsLink}">View on Google Maps</a></p>
      ${audioSection}
      <p><strong>Time:</strong> ${panicLog.timestamp.toISOString()}</p>
    `
  };

  // Only send if SMTP is configured
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    await transporter.sendMail(mailOptions);
  } else {
    console.log('Email not sent - SMTP not configured. Would send:', mailOptions);
  }
}

/**
 * Send SMS notification via Twilio
 */
async function sendSMS(phoneNumber, panicLog) {
  // Only send if Twilio is configured
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log('SMS not sent - Twilio not configured');
    return;
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const googleMapsLink = `https://www.google.com/maps?q=${panicLog.location.lat},${panicLog.location.lon}`;
  const audioText = panicLog.audioUrl ? `\nAudio Recording: ${panicLog.audioUrl}` : '';
  const message = `🚨 SafeWalk Emergency Alert\n\n${panicLog.message}\nLocation: ${googleMapsLink}${audioText}\nTime: ${panicLog.timestamp.toISOString()}`;

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber
  });
}

module.exports = {
  triggerPanic
};

