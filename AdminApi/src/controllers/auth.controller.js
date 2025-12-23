const jwt = require('jsonwebtoken');
const { AdminUserDTO } = require('@payment-app/apiModels');

class AuthController {
  async login(req, res, next) {
    try {
      const AdminUser = req.db.getModel('AdminUser');
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      
      const user = await AdminUser.scope('withPassword').findOne({ 
        where: { email } 
      });
      
      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials or user inactive'
        });
      }
      
      const isValidPassword = await user.validPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      await user.update({ last_login: new Date() });
      
      const accessToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          name: user.name 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES || '1h' }
      );
      
      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
      );
      
      const userDTO = AdminUserDTO.fromSequelize(user);
      
      res.json({
        success: true,
        data: {
          user: userDTO.toApiResponse(),
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 3600
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      res.json({
        success: true,
        data: req.user
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token required'
        });
      }
      
      const decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET
      );
      const AdminUser = req.db.getModel('AdminUser');
      const user = await AdminUser.findByPk(decoded.id);
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }
      
      const newAccessToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          name: user.name 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES || '1h' }
      );
      
      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          expiresIn: 3600
        }
      });
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  async logout(req, res, next) {
    try {
      // В простой реализации просто сообщаем клиенту удалить токены
      // В production можно добавить blacklist токенов
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();