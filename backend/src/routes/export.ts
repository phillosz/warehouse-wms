import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { stringify } from 'csv-stringify/sync';

const router = Router();

// GET /api/export/snapshot.csv - Export current inventory snapshot
router.get('/snapshot.csv', async (req: Request, res: Response) => {
  try {
    const rolls = await prisma.roll.findMany({
      include: {
        location: {
          include: {
            rail: {
              select: { code: true }
            }
          }
        }
      },
      orderBy: { receivedAt: 'desc' }
    });

    const records = rolls.map(roll => ({
      roll_id: roll.id,
      ean: roll.ean,
      material_name: roll.materialName,
      description: roll.description || '',
      width_mm: roll.widthMm || '',
      grammage_gm2: roll.grammageGm2 || '',
      color: roll.color || '',
      supplier: roll.supplier || '',
      batch_no: roll.batchNo || '',
      status: roll.status,
      rail_code: roll.location?.rail?.code || '',
      received_at: roll.receivedAt.toISOString(),
      last_moved_at: roll.location?.lastMovedAt.toISOString() || ''
    }));

    const csv = stringify(records, {
      header: true,
      columns: [
        'roll_id',
        'ean',
        'material_name',
        'description',
        'width_mm',
        'grammage_gm2',
        'color',
        'supplier',
        'batch_no',
        'status',
        'rail_code',
        'received_at',
        'last_moved_at'
      ]
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=warehouse-snapshot-${new Date().toISOString().split('T')[0]}.csv`
    );
    res.send(csv);
  } catch (error) {
    console.error('Error generating snapshot:', error);
    res.status(500).json({ error: 'Failed to generate snapshot' });
  }
});

// GET /api/export/events.ndjson - Export movement events
router.get('/events.ndjson', async (req: Request, res: Response) => {
  try {
    const { since, limit = '1000' } = req.query;
    
    const movements = await prisma.movement.findMany({
      where: {
        ...(since && { at: { gte: new Date(since as string) } })
      },
      include: {
        roll: {
          select: { ean: true }
        },
        fromRail: {
          select: { code: true }
        },
        toRail: {
          select: { code: true }
        },
        user: {
          select: { name: true }
        }
      },
      orderBy: { at: 'asc' },
      take: parseInt(limit as string)
    });

    const events = movements.map(m => {
      const basePayload = {
        roll_id: m.rollId,
        ean: m.roll.ean,
        user_id: m.userId,
        user_name: m.user.name,
        device_id: m.deviceId || null
      };

      let eventType = '';
      let payload: any = { ...basePayload };

      switch (m.type) {
        case 'RECEIVE':
          eventType = 'ROLL_RECEIVED';
          payload = {
            ...basePayload,
            to_rail_code: m.toRail?.code || null
          };
          break;
        case 'MOVE':
          eventType = 'ROLL_MOVED';
          payload = {
            ...basePayload,
            from_rail_code: m.fromRail?.code || null,
            to_rail_code: m.toRail?.code || null
          };
          break;
        case 'REMOVE':
          eventType = 'ROLL_REMOVED';
          payload = {
            ...basePayload,
            from_rail_code: m.fromRail?.code || null,
            reason: m.attributes && typeof m.attributes === 'object' && 'reason' in m.attributes
              ? m.attributes.reason
              : null
          };
          break;
      }

      return {
        event_id: m.id,
        event_type: eventType,
        occurred_at: m.at.toISOString(),
        idempotency_key: m.deviceId ? `${m.deviceId}:${m.type.toLowerCase()}:${m.rollId}:${m.at.toISOString()}` : null,
        payload
      };
    });

    const ndjson = events.map(e => JSON.stringify(e)).join('\n');

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=warehouse-events-${new Date().toISOString().split('T')[0]}.ndjson`
    );
    res.send(ndjson);
  } catch (error) {
    console.error('Error generating events:', error);
    res.status(500).json({ error: 'Failed to generate events' });
  }
});

export default router;
