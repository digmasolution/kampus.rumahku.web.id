import { Request, Response, NextFunction } from 'express';
import { meetingService } from '../services/meeting.service';
import { parseMeetingTodos } from '../services/meetingParser.service';

export class MeetingController {
  async listMeetings(req: Request, res: Response, next: NextFunction) {
    try {
      const meetings = await meetingService.getAll();
      res.json(meetings);
    } catch (err) {
      next(err);
    }
  }

  async getMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await meetingService.getById(req.params.id);
      res.json(meeting);
    } catch (err) {
      next(err);
    }
  }

  async createMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, meetingDate, location, attendees, content, authorId, autoCreateTodos } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const meeting = await meetingService.create({
        title,
        meetingDate,
        location,
        attendees,
        content,
        authorId,
        autoCreateTodos: autoCreateTodos !== false,
      });

      res.status(201).json(meeting);
    } catch (err) {
      next(err);
    }
  }

  async updateMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await meetingService.update(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  async deleteMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      await meetingService.delete(req.params.id);
      res.json({ success: true, message: 'Meeting note deleted' });
    } catch (err) {
      next(err);
    }
  }

  async parsePreview(req: Request, res: Response, next: NextFunction) {
    try {
      const { content } = req.body;
      const parsed = parseMeetingTodos(content || '');
      res.json(parsed);
    } catch (err) {
      next(err);
    }
  }
}

export const meetingController = new MeetingController();
