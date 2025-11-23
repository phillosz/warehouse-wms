import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/rolls - Search rolls
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      query, 
      status, 
      railCode, 
      widthMin, 
      widthMax, 
      grammageMin, 
      grammageMax, 
      color, 
      supplier, 
      limit = '50' 
    } = req.query;
    
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
        ...(widthMin && { widthMm: { gte: parseInt(widthMin as string) } }),
        ...(widthMax && { widthMm: { lte: parseInt(widthMax as string) } }),
        ...(grammageMin && { grammageGm2: { gte: parseInt(grammageMin as string) } }),
        ...(grammageMax && { grammageGm2: { lte: parseInt(grammageMax as string) } }),
        ...(color && { color: { contains: color as string, mode: 'insensitive' } }),
        ...(supplier && { supplier: { contains: supplier as string, mode: 'insensitive' } }),
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

// PUT /api/rolls/:id - Update roll details
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      materialName,
      description,
      widthMm,
      grammageGm2,
      color,
      supplier,
      batchNo,
      photo
    } = req.body;

    const roll = await prisma.roll.update({
      where: { id },
      data: {
        ...(materialName && { materialName }),
        ...(description !== undefined && { description }),
        ...(widthMm !== undefined && { widthMm }),
        ...(grammageGm2 !== undefined && { grammageGm2 }),
        ...(color !== undefined && { color }),
        ...(supplier !== undefined && { supplier }),
        ...(batchNo !== undefined && { batchNo }),
        ...(photo !== undefined && { photo })
      }
    });

    res.json({ roll });
  } catch (error) {
    console.error('Error updating roll:', error);
    res.status(500).json({ error: 'Failed to update roll' });
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
      photo,
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
          photo,
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

// POST /api/rolls/batch-move - Move multiple rolls at once
router.post('/batch-move', async (req: Request, res: Response) => {
  try {
    const { rollIds, toRailCode, userId, deviceId } = req.body;

    if (!rollIds || !Array.isArray(rollIds) || rollIds.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid rollIds array' });
    }

    if (!toRailCode || !userId) {
      return res.status(400).json({ error: 'Missing required fields: toRailCode, userId' });
    }

    // Check if rail exists
    const rail = await prisma.rail.findUnique({
      where: { code: toRailCode }
    });

    if (!rail) {
      return res.status(404).json({ error: 'Rail not found' });
    }

    // Move all rolls in transaction
    const movements = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const rollId of rollIds) {
        // Get current location
        const location = await tx.location.findUnique({
          where: { rollId },
          include: { rail: true }
        });

        if (!location) {
          continue; // Skip rolls without location
        }

        // Create movement record
        const movement = await tx.movement.create({
          data: {
            type: 'MOVE',
            rollId,
            fromRailId: location.railId,
            toRailId: rail.id,
            userId,
            deviceId
          }
        });

        // Update location
        await tx.location.update({
          where: { rollId },
          data: {
            railId: rail.id,
            lastMovedAt: new Date()
          }
        });

        results.push(movement);
      }

      return results;
    });

    res.json({
      message: `Successfully moved ${movements.length} rolls`,
      count: movements.length,
      movements
    });
  } catch (error) {
    console.error('Error in batch move:', error);
    res.status(500).json({ error: 'Batch move failed' });
  }
});

export default router;
