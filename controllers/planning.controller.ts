import { FastifyReply, FastifyRequest } from "fastify";
import { CreatePlanning } from "../models/create-planning.model";

export class PlanningController {
    async create(request: FastifyRequest<{Body: CreatePlanning}>, reply: FastifyReply) {}
}