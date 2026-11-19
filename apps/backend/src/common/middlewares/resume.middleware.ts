import { NextFunction, Request, Response } from "express"
import prisma from "../../prisma/prisma.service"
import { CreateResumeDTO } from "../../modules/resume/types/resume.dto"
import { HttpErrorStatus } from "../utils/util.types"

export const checkResume = async (req: Request<{}, {}, CreateResumeDTO>, res: Response, next: NextFunction) => {
    const plan = req.plan

    // check if user can create more resumes (resume-limit)
    const userResumes = await prisma.resume.count({
        where: { userId: req.user.id }
    })

    if (userResumes >= plan.maxResumes) {
        return res.error({ message: `You have reached the limit of ${plan.maxResumes} resumes on the ${plan.name} plan. Upgrade to PRO!`, statusCode: HttpErrorStatus.Forbidden });
    }

    next()
}
