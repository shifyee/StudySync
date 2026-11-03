import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { validate, wrap } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Optional auth: attach req.user if a valid token is provided, but don't block
const tryAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {}
  }
  next();
};

// Update content
router.put(
  '/:shareId/content',
  tryAuth,
  validate(z.object({ content: z.string().max(200000) })),
  wrap(async (req, res) => {
    const { shareId } = req.params;
    const { content } = req.body;

    const exists = await prisma.studySet.findUnique({ where: { shareId } });
    if (!exists) return res.status(404).json({ error: 'Set not found' });

    // Update the original shared set
    await prisma.studySet.update({ where: { shareId }, data: { content } });
    
    // If the user is logged in, update their saved copy if it exists
    if (req.user) {
      const userCopy = await prisma.studySet.findFirst({
        where: { userId: req.user.id, title: exists.title }
      });
      if (userCopy) {
        await prisma.studySet.update({ where: { id: userCopy.id }, data: { content } });
      }
    }

    res.json({ ok: true });
  })
);

// Add a flashcard
router.post(
  '/:shareId/cards',
  tryAuth,
  validate(z.object({ front: z.string().min(1).max(1000), back: z.string().min(1).max(2000) })),
  wrap(async (req, res) => {
    const { shareId } = req.params;
    const { front, back } = req.body;

    const exists = await prisma.studySet.findUnique({ where: { shareId } });
    if (!exists) return res.status(404).json({ error: 'Set not found' });

    // Add to original shared set
    const card = await prisma.flashcard.create({
      data: { front, back, setId: exists.id }
    });

    // If the user is logged in, sync to their saved copy
    if (req.user) {
      const userCopy = await prisma.studySet.findFirst({
        where: { userId: req.user.id, title: exists.title }
      });
      if (userCopy) {
        await prisma.flashcard.create({
          data: { front, back, setId: userCopy.id }
        });
      }
    }

    res.status(201).json(card);
  })
);

export default router;
