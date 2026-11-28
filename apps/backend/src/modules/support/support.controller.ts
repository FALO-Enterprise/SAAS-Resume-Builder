import { Request, Response } from 'express';
import { supportService } from './support.service';
import { contactSupportSchema } from './support.schema';
import { zodValidation } from '../../common/utils/zod.util';
import { MODULES_NAMES } from '../../common/utils/constant';
import { HttpErrorStatus } from '../../common/utils/util.types';

export class SupportController {
    private service = supportService;

    contact = async (req: Request, res: Response) => {
        const payload = zodValidation(
            contactSupportSchema,
            req.body,
            MODULES_NAMES.support,
        );

        // Honeypot tripped. Answer 200 rather than an error: telling a bot it
        // was detected just teaches it which field to leave alone next time.
        if (payload.website) {
            return res.ok({ received: true });
        }

        try {
            const { delivered } = await this.service.sendContactMessage(payload, {
                locale: typeof req.body?.locale === 'string' ? req.body.locale : 'en',
            });

            return res.ok({ received: true, delivered });
        } catch (error) {
            console.error('[SupportController] Failed to send contact message:', error);
            return res.error({
                message: 'We could not send your message right now. Please try again shortly.',
                statusCode: HttpErrorStatus.InternalServerError,
            });
        }
    };
}

export const supportController = new SupportController();
