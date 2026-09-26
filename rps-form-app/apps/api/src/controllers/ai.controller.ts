import { Response, NextFunction } from 'express';
import { AgentRequest } from '../middleware/agentAuth';
import { aiService } from '../services/ai.service';
import { learningService } from '../services/learning.service';
import { loggerService } from '../services/logger.service';

export class AiController {
  async getContext(req: AgentRequest, res: Response, next: NextFunction) {
    try {
      const context = await aiService.getSystemContext();
      res.status(200).json(context);
    } catch (err) {
      next(err);
    }
  }

  async getRpsContext(req: AgentRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const context = await aiService.getRpsDocumentContext(id);
      res.status(200).json(context);
    } catch (err) {
      next(err);
    }
  }

  async getActionCatalog(req: AgentRequest, res: Response, next: NextFunction) {
    try {
      const actions = aiService.getActionCatalog();
      res.status(200).json({
        success: true,
        actions,
      });
    } catch (err) {
      next(err);
    }
  }

  async executeAction(req: AgentRequest, res: Response, next: NextFunction) {
    try {
      // Lazy attach app if not already set
      if (!aiService.getApp() && req.app) {
        aiService.setApp(req.app);
      }

      const { action, parameters } = req.body;
      if (!action || typeof action !== 'string') {
        return res.status(400).json({
          success: false,
          error: "Missing required string property 'action' in request payload",
          traceId: req.traceId,
        });
      }

      const response = await aiService.executeAction(
        action,
        parameters || {},
        req.agent,
        req.traceId
      );

      res.status(200).json(response);
    } catch (err: any) {
      const statusCode = err.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        error: err.message || 'Action execution error',
        code: err.code || 'ACTION_ERROR',
        traceId: req.traceId,
      });
    }
  }

  async getLearnedRules(req: AgentRequest, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as string | undefined;
      const rules = await learningService.getRules(category);
      res.status(200).json({
        success: true,
        total: rules.length,
        rules,
      });
    } catch (err) {
      next(err);
    }
  }

  async registerLearnedRule(req: AgentRequest, res: Response, next: NextFunction) {
    try {
      const rule = await learningService.registerRule({
        ...req.body,
        agentId: req.agent?.id,
      });
      res.status(201).json({
        success: true,
        rule,
      });
    } catch (err) {
      next(err);
    }
  }

  async submitFeedback(req: AgentRequest, res: Response, next: NextFunction) {
    try {
      const feedback = await learningService.submitFeedback({
        ...req.body,
        agentId: req.agent?.id,
      });
      res.status(200).json({
        success: true,
        id: feedback.id,
        feedback,
      });
    } catch (err) {
      next(err);
    }
  }

  async getIssueFixSummaries(req: AgentRequest, res: Response, next: NextFunction) {
    try {
      const summaries = await learningService.getIssueFixSummaries();
      res.status(200).json({
        success: true,
        total: summaries.length,
        count: summaries.length,
        summaries,
      });
    } catch (err) {
      next(err);
    }
  }

  async recordIssueFix(req: AgentRequest, res: Response, next: NextFunction) {
    try {
      const entry = await learningService.recordIssueFix({
        ...req.body,
        verifiedBy: req.body.verifiedBy || req.agent?.name || 'Agent',
      });
      res.status(200).json({
        success: true,
        entry,
      });
    } catch (err) {
      next(err);
    }
  }

  async getInteractions(req: AgentRequest, res: Response, next: NextFunction) {
    try {
      const interactions = await loggerService.getRecentInteractions();
      res.status(200).json({
        success: true,
        total: interactions.length,
        interactions,
      });
    } catch (err) {
      next(err);
    }
  }

  async getErrors(req: AgentRequest, res: Response, next: NextFunction) {
    try {
      const errors = await loggerService.getRecentErrors();
      res.status(200).json({
        success: true,
        total: errors.length,
        errors,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const aiController = new AiController();
