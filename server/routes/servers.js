import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, validate, wrap } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Get all servers for the logged-in user
router.get('/', wrap(async (req, res) => {
  const memberships = await prisma.serverMember.findMany({
    where: { userId: req.user.id },
    include: {
      server: {
        include: { _count: { select: { members: true } } }
      }
    }
  });
  res.json(memberships.map(m => m.server));
}));

// Create a new server
router.post('/', validate(z.object({ name: z.string().min(2).max(50) })), wrap(async (req, res) => {
  const { name } = req.body;
  
  const server = await prisma.server.create({
    data: {
      name,
      ownerId: req.user.id,
      members: { create: { userId: req.user.id, role: 'ADMIN' } },
      channels: {
        create: [
          { name: 'general', type: 'TEXT' },
          { name: 'homework-help', type: 'TEXT' },
          { name: 'study-hall', type: 'VOICE' }
        ]
      }
    },
    include: { channels: true }
  });

  res.status(201).json(server);
}));

// Get a specific server (channels and members)
router.get('/:serverId', wrap(async (req, res) => {
  const member = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId: req.user.id, serverId: req.params.serverId } }
  });
  if (!member) return res.status(403).json({ error: 'Not a member of this server' });

  const server = await prisma.server.findUnique({
    where: { id: req.params.serverId },
    include: {
      channels: { orderBy: { createdAt: 'asc' } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } }
    }
  });

  res.json(server);
}));

// Create a channel in a server
router.post('/:serverId/channels', validate(z.object({ 
  name: z.string().min(1).max(30),
  type: z.enum(['TEXT', 'VOICE', 'WHITEBOARD']).default('TEXT')
})), wrap(async (req, res) => {
  const member = await prisma.serverMember.findUnique({
    where: { userId_serverId: { userId: req.user.id, serverId: req.params.serverId } }
  });
  if (!member || member.role !== 'ADMIN') return res.status(403).json({ error: 'Only admins can create channels' });

  const channel = await prisma.channel.create({
    data: {
      name: req.body.name.toLowerCase().replace(/\s+/g, '-'),
      type: req.body.type,
      serverId: req.params.serverId
    }
  });

  res.status(201).json(channel);
}));

// Get message history for a channel
router.get('/channels/:channelId/messages', wrap(async (req, res) => {
  const messages = await prisma.message.findMany({
    where: { channelId: req.params.channelId },
    include: { 
      user: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  // Hydrate attachments
  const hydratedMessages = await Promise.all(messages.map(async (msg) => {
    let attachment = null;
    if (msg.attachmentType === 'ASSIGNMENT' && msg.attachmentId) {
      attachment = await prisma.assignment.findUnique({ where: { id: msg.attachmentId }, select: { id: true, title: true, dueDate: true, completed: true } });
    } else if (msg.attachmentType === 'STUDYSET' && msg.attachmentId) {
      attachment = await prisma.studySet.findUnique({ where: { id: msg.attachmentId }, select: { id: true, title: true, _count: { select: { cards: true } } } });
    }
    return { ...msg, attachment };
  }));

  res.json(hydratedMessages.reverse());
}));

export default router;
