import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const token = req.cookies.access_token ||
    (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7));

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
