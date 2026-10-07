import Notification from "../models/Notification.js";

export async function listNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    return res.json({ success: true, notifications });
  } catch (error) {
    return next(error);
  }
}
