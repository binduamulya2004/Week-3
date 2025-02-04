module.exports = (allowedRoles) => {
    return (req, res, next) => {
      // Check if the user object is available (it was added in the authenticate middleware)
      if (!req.user || !req.user.role) {
        return res.status(403).json({ message: 'Access denied: No role information' });
      }
  
      // Check if the user’s role matches one of the allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied: You do not have the required role' });
      }
  
      // If the role is valid, proceed to the next middleware or route handler
      next();
    };
  };
  