import express from 'express';
import cors from 'cors';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Login endpoint
app.post('/api/auth/login', async (req, res): Promise<any> => {
  const { email, password } = req.body;
  
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }
    
    // Verify password
    const isPasswordValid = await argon2.verify(user.password, password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'Аккаунт деактивирован' });
    }
    
    // Generate tokens
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );
    
    const refreshToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      'your-super-secret-refresh-jwt-key-change-this-in-production',
      { expiresIn: '30d' }
    );
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Me endpoint
app.get('/api/auth/me', async (req, res): Promise<any> => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }
  
  try {
    const decoded = jwt.verify(token, 'your-super-secret-jwt-key-change-this-in-production') as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Недействительный токен' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Simple backend server running on http://localhost:${PORT}`);
  console.log(`📋 Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`❤️ Health: GET http://localhost:${PORT}/api/health`);
});