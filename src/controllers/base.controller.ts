import { Request, Response } from 'express';
import { Model } from 'mongoose';
import _ from 'lodash';

import logger from '../logs/logger';
import jwtUtils from '../utils/jwt.utils';
import appRegistry from '../app.registry';

class BaseController {
  model: Model<any>;
  logger: typeof logger;
  _: typeof _;
  jwt: typeof jwtUtils;
  registry: typeof appRegistry;

  constructor(model: Model<any>) {
    this.model = model;
    this.logger = logger;
    this._ = _;
    this.jwt = jwtUtils;
    this.registry = appRegistry;
  }

  async create(req: Request, res: Response) {
    try {
      //Maybe add authRequireAuth middleware to this route to ensure that only authenticated users can create documents. This will help prevent unauthorized access and potential security risks.
      const data = {
        ...req.body,
      };
      this.logger.info(
        `base.controller.ts: create: model: ${this.model.modelName}: data =`,
        'body' in req,
      );

      const newDoc = new this.model(data);
      const savedDoc = await newDoc.save();

      res.status(201).json({
        message: 'Document created successfully',
        data: savedDoc,
      });
    } catch (error) {
      this.logger.error(
        `base.controller.ts: create: model: ${this.model.modelName} error: ${error}`,
      );
      res.status(500).json({
        message: 'Internal Server Error',
      });
    }
  }
  async list(req: Request, res: Response) {
    try {
      const q = {
        query: this._.omit(req.query, ['page', 'limit']),
      } as {
        query: Record<string, any>;
        page?: number;
        limit?: number;
      };

      q.page = Number(req.query?.page ?? 1);
      q.limit = Number(req.query?.limit ?? 10);

      // const { page, limit } = q

      const docs = await this.model
        .find(q.query)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit);

      res.status(200).json({
        message: 'Documents retrieved successfully',
        data: docs,
        total: docs.length,
      });
    } catch (error) {
      this.logger.error(
        `base.controller.ts: list: model: ${this.model.modelName} error: ${error}`,
      );
      res.status(500).json({
        message: 'Internal Server Error',
      });
    }
  }
  async getById(req: Request, res: Response) {
    try {
      const { _id } = req.params;
      const doc = await this.model.findById(_id);
      if (!doc) throw new Error('Document not found');

      res.status(200).json({
        message: 'Document retrieved successfully',
        data: doc,
      });
    } catch (error: unknown) {
      this.logger.error(
        `base.controller.ts: getById: model: ${this.model.modelName} error: ${error}`,
      );

      if (error?.toString() === 'Document not found') {
        res.status(404).json({
          message: 'Document not found',
        });
      }
      res.status(500).json({
        message: 'Internal Server Error',
      });
    }
  }
  async update(req: Request, res: Response) {
    try {
      res.status(200).json({
        message: 'NOT IMPLMENTED',
      });
    } catch (error) {
      this.logger.error(
        `base.controller.ts: update: model: ${this.model.modelName} error: ${error}`,
      );
      res.status(500).json({
        message: 'Internal Server Error',
      });
    }
  }
  async delete(req: Request, res: Response) {
    try {
      res.status(200).json({
        message: 'NOT IMPLMENTED',
      });
    } catch (error) {
      this.logger.error(
        `base.controller.ts: delete: model: ${this.model.modelName} error: ${error}`,
      );
      res.status(500).json({
        message: 'Internal Server Error',
      });
    }
  }
}

export default BaseController;

/**
 *  ----------1----------
 *  ----------2----------
 *  ----------3----------
 *  ----------4----------
 *  ----------5----------
 *  ----------6----------
 *  ----------7----------
 *
 *
 * limit: 3
 * page: 3
 */
