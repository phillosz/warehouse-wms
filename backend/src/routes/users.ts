import { Router, Request, Response } from 'express';
import { prisma } from '../index';

const router = Router();

// POST /api/users/register - Register or get user by device
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, deviceId } = req.body;

    if (!name || !deviceId) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, deviceId' 
      });
    }

    // Check if user with same name exists
    let user = await prisma.user.findFirst({
      where: { 
        name: name.trim()
      }
    });

    if (user) {
      // Update deviceId for existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: { deviceId }
      });
      return res.json({
        message: 'Logged in as existing user',
        user
      });
    }

    // Create new user
    user = await prisma.user.create({
      data: {
        name: name.trim(),
        deviceId,
        role: 'worker'
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// GET /api/users/me - Get current user info by deviceId
router.get('/me', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      return res.status(400).json({ error: 'Missing deviceId parameter' });
    }

    const user = await prisma.user.findUnique({
      where: { deviceId: deviceId as string }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
