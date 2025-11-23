import { Router, Request, Response } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/rails - List all active rails
router.get('/', async (req: Request, res: Response) => {
  try {
    const { warehouseId, zone } = req.query;
    
    const rails = await prisma.rail.findMany({
      where: {
        isActive: true,
        ...(warehouseId && { warehouseId: warehouseId as string }),
        ...(zone && { zone: zone as string })
      },
      include: {
        _count: {
          select: { locations: true }
        }
      },
      orderBy: [
        { rowIndex: 'asc' },
        { colIndex: 'asc' },
        { posIndex: 'asc' }
      ]
    });

    res.json({
      rails: rails.map(rail => ({
        ...rail,
        rollCount: rail._count.locations
      }))
    });
  } catch (error) {
    console.error('Error fetching rails:', error);
    res.status(500).json({ error: 'Failed to fetch rails' });
  }
});

// GET /api/rails/:code - Get rail by code
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    const rail = await prisma.rail.findUnique({
      where: { code },
      include: {
        warehouse: true,
        _count: {
          select: { locations: true }
        }
      }
    });

    if (!rail) {
      return res.status(404).json({ error: 'Rail not found' });
    }

    res.json({
      ...rail,
      rollCount: rail._count.locations
    });
  } catch (error) {
    console.error('Error fetching rail:', error);
    res.status(500).json({ error: 'Failed to fetch rail' });
  }
});

// GET /api/rails/:code/inventory - Get rolls on specific rail
router.get('/:code/inventory', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    const rail = await prisma.rail.findUnique({
      where: { code },
      include: {
        locations: {
          include: {
            roll: true
          },
          where: {
            roll: {
              status: 'active'
            }
          }
        }
      }
    });

    if (!rail) {
      return res.status(404).json({ error: 'Rail not found' });
    }

    res.json({
      railCode: rail.code,
      railName: rail.name,
      rolls: rail.locations.map(loc => ({
        ...loc.roll,
        placedAt: loc.placedAt,
        lastMovedAt: loc.lastMovedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching rail inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

export default router;
