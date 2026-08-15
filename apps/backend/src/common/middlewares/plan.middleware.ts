import { Request, Response, NextFunction } from 'express'
import prisma from '../../prisma/prisma.service'
import { randomUUID } from 'node:crypto'

export const checkPlan = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id

    const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: { Plan: true }
    })

    // if no subscription → assign FREE plan
    if (!subscription) {
        const freePlan = await prisma.plan.findFirst({
            where: { name: 'FREE' }
        })

        if (!freePlan) {
            throw new Error('FREE plan not found.')
        }

        await prisma.subscription.create({
            data: {
                id: randomUUID(),
                userId,
                planId: freePlan!.id,
                status: 'ACTIVE',
                updatedAt: new Date(),
            }
        })

        req.plan = freePlan  // attach plan to request
    } else {
        req.plan = subscription.Plan  // attach plan to request
    }

    next()
}