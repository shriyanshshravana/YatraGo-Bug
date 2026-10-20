const Notification = require('../models/Notification');

/**
 * Creates an in-app notification safely.
 * Non-blocking: logs warnings on failure rather than aborting the main request.
 */
const sendNotification = async ({ user, title, message, type = 'system', link = '' }) => {
  try {
    if (!user) return null;
    return await Notification.create({
      user,
      title,
      message,
      type,
      link,
    });
  } catch (err) {
    console.warn('[Notification Error]', err.message);
    return null;
  }
};

module.exports = { sendNotification };
