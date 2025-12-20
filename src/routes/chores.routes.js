import express from 'express';
import choresController from '../controllers/chores.controller.js';

export const router = express.Router();

router.post('/generate-daily', choresController.triggerDailyJob);
router.get('/today', choresController.getToday);
router.patch('/:id/complete', choresController.complete);
router.get('/templates', choresController.getTemplates);
router.post('/templates', choresController.createTemplate);
router.put('/templates/:id', choresController.updateTemplate);
router.delete('/templates/:id', choresController.deleteTemplate);
router.get('/monthly-summary', choresController.getMonthlySummary);