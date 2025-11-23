import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/rolls - Search rolls
router.get('/', async (req: Request, res: Response) => {
  try {
    const { query, status, railCode, limit = '50' } = req.query;
    
    const rolls = await prisma.roll.findMany({
      where: {
        ...(status && { status: status as string }),
        ...(query && {
          OR: [
            { ean: { contains: query as string, mode: 'insensitive' } },
            { materialName: { contains: query as string, mode: 'insensitive' } },
            { description: { contains: query as string, mode: 'insensitive' } }
          ]
        }),
        ...(railCode && {
          location: {
            rail: {
              code: railCode as string
            }
          }
        })
      },
      include: {
        location: {
          include: {
            rail: {
              select: { code: true, name: true }
            }
          }
        }
      },
      take: parseInt(limit as string),
      orderBy: { receivedAt: 'desc' }
    });

    res.json({ rolls });
  } catch (error) {
    console.error('Error searching rolls:', error);
    res.status(500).json({ error: 'Failed to search rolls' });
  }
});

// GET /api/rolls/:id - Get roll detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const roll = await prisma.roll.findUnique({
      where: { id },
      include: {
        location: {
          include: {
            rail: {
              select: { code: true, name: true }
            }
          }
        },
        movements: {
          orderBy: { at: 'desc' },
          take: 20,
          include: {
            user: {
              select: { name: true }
            },
            fromRail: {
              select: { code: true, name: true }
            },
            toRail: {
              select: { code: true, name: true }
            }
          }
        }
      }
    });

    if (!roll) {
      return res.status(404).json({ error: 'Roll not found' });
    }

    res.json(roll);
  } catch (error) {
    console.error('Error fetching roll:', error);
    res.status(500).json({ error: 'Failed to fetch roll' });
  }
});

// POST /api/rolls/receive - Receive new roll
router.post('/receive', async (req: Request, res: Response) => {
  try {
    const {
      ean,
      materialName,
      description,
      widthMm,
      grammageGm2,
      color,
      supplier,
      batchNo,
      toRailCode,
      userId,
      deviceId
    } = req.body;

    if (!ean || !materialName || !toRailCode || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: ean, materialName, toRailCode, userId' 
      });
    }

    // Check if rail exists
    const rail = await prisma.rail.findUnique({
      where: { code: toRailCode }
    });

    if (!rail) {
      return res.status(404).json({ error: 'Rail not found' });
    }

    // Check if EAN already exists
    const existingRoll = await prisma.roll.findUnique({
      where: { ean }
    });

    if (existingRoll) {
      return res.status(409).json({ 
        error: 'Roll with this EAN already exists',
        rollId: existingRoll.id
      });
    }

    // Transaction: create roll, location, and movement
    const result = await prisma.$transaction(async (tx) => {
      const roll = await tx.roll.create({
        data: {
          ean,
          materialName,
          description,
          widthMm,
          grammageGm2,
          color,
          supplier,
          batchNo,
          status: 'active'
        }
      });

      const now = new Date();
      
      await tx.location.create({
        data: {
          rollId: roll.id,
          railId: rail.id,
          placedAt: now,
          lastMovedAt: now
        }
      });

      const movement = await tx.movement.create({
        data: {
          id: uuidv4(),
          type: 'RECEIVE',
          rollId: roll.id,
          toRailId: rail.id,
          userId,
          deviceId,
          at: now
        }
      });

      return { roll, movement };
    });

    res.status(201).json({
      message: 'Roll received successfully',
      roll: result.roll,
      movement: result.movement
    });
  } catch (error) {
    console.error('Error receiving roll:', error);
    res.status(500).json({ error: 'Failed to receive roll' });
  }
});

// POST /api/rolls/:id/move - Move roll to different rail
router.post('/:id/move', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { toRailCode, userId, deviceId } = req.body;

    if (!toRailCode || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: toRailCode, userId' 
      });
    }

    // Check roll exists and is active
    const roll = await prisma.roll.findUnique({
      where: { id },
      include: { location: true }
    });

    if (!roll) {
      return res.status(404).json({ error: 'Roll not found' });
    }

    if (roll.status !== 'active') {
      return res.status(409).json({ 
        error: 'Cannot move removed roll',
        status: roll.status
      });
    }

    // Check target rail exists
    const toRail = await prisma.rail.findUnique({
      where: { code: toRailCode }
    });

    if (!toRail) {
      return res.status(404).json({ error: 'Target rail not found' });
    }

    if (roll.location?.railId === toRail.id) {
      return res.status(409).json({ error: 'Roll is already on this rail' });
    }

    // Transaction: update location and create movement
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      
      const location = await tx.location.update({
        where: { rollId: id },
        data: {
          railId: toRail.id,
          lastMovedAt: now
        }
      });

      const movement = await tx.movement.create({
        data: {
          id: uuidv4(),
          type: 'MOVE',
          rollId: id,
          fromRailId: roll.location?.railId,
          toRailId: toRail.id,
          userId,
          deviceId,
          at: now
        }
      });

      return { location, movement };
    });

    res.json({
      message: 'Roll moved successfully',
      movement: result.movement
    });
  } catch (error) {
    console.error('Error moving roll:', error);
    res.status(500).json({ error: 'Failed to move roll' });
  }
});

// POST /api/rolls/:id/remove - Remove roll from warehouse
router.post('/:id/remove', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, userId, deviceId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    // Check roll exists
    const roll = await prisma.roll.findUnique({
      where: { id },
      include: { location: true }
    });

    if (!roll) {
      return res.status(404).json({ error: 'Roll not found' });
    }

    if (roll.status === 'removed') {
      return res.status(409).json({ 
        error: 'Roll already removed',
        warning: true
      });
    }

    // Transaction: update roll status, clear location, create movement
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      
      await tx.roll.update({
        where: { id },
        data: { status: 'removed' }
      });

      await tx.location.update({
        where: { rollId: id },
        data: { railId: null }
      });

      const movement = await tx.movement.create({
        data: {
          id: uuidv4(),
          type: 'REMOVE',
          rollId: id,
          fromRailId: roll.location?.railId,
          userId,
          deviceId,
          at: now,
          attributes: reason ? { reason } : undefined
        }
      });

      return movement;
    });

    res.json({
      message: 'Roll removed successfully',
      movement: result
    });
  } catch (error) {
    console.error('Error removing roll:', error);
    res.status(500).json({ error: 'Failed to remove roll' });
  }
});

export default router;
