import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/rps.service';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || user.password !== password) {
        return res.status(401).json({ success: false, message: 'Kredensial email atau password salah' });
      }

      // Return user profile (without password)
      const { password: _, ...safeUser } = user;
      res.json({
        success: true,
        message: 'Login berhasil',
        user: safeUser,
        token: `mock-token-${user.id}-${Date.now()}`,
      });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email parameter diperlukan' });
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      const { password: _, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } catch (err) {
      next(err);
    }
  }

  async usersList(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, avatar: true },
        orderBy: { name: 'asc' },
      });
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
