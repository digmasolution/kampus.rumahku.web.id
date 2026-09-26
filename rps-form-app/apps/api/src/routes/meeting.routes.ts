import { Router } from 'express';
import { meetingController } from '../controllers/meeting.controller';

const router = Router();

router.get('/', (req, res, next) => meetingController.listMeetings(req, res, next));
router.post('/', (req, res, next) => meetingController.createMeeting(req, res, next));
router.post('/preview-parse', (req, res, next) => meetingController.parsePreview(req, res, next));
router.get('/:id', (req, res, next) => meetingController.getMeeting(req, res, next));
router.put('/:id', (req, res, next) => meetingController.updateMeeting(req, res, next));
router.delete('/:id', (req, res, next) => meetingController.deleteMeeting(req, res, next));

export default router;
