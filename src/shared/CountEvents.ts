/*
 * Package :
 * Project : instrumental
 * File    : CountEvents
 * Created by john
 * On 12/5/19 at 11:34 AM
*/

import {addCounter, convertStrToBool} from '../monitor/event-counter';
import {NextFunction, Request, Response} from 'express';

/**
 * function countEvent
 * middleware
 * if environment variable USE_EVENT_COUNTER equates to true
 * call addCounter to add a counter if not exists then addEvent
 * @param req
 * @param res
 * @param next
 */
export const countEvent = async (req: Request, res: Response, next: NextFunction) => {
    if (convertStrToBool(process.env.USE_EVENT_COUNTER)) {
        try {
            await addCounter(req.originalUrl);
        } catch (e) {
            throw (e);
        }
    }
    next();
};
