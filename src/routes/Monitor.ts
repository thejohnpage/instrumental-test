/*
 * Package :
 * Project : instrumental
 * File    : Monitor
 * Created by john
 * On 12/5/19 at 12:49 PM
*/

import { Request, Response, Router } from 'express';
import {eventCounters, convertToMs, convertStrToBool, getEvents} from '../monitor/event-counter';

// Init shared
const router = Router();

router.get('/event/count/:name/:value/:uom/:format?/:fromnow?', async (req: Request, res: Response) => {
    const {name, value, uom, format, fromnow} = req.params;
    const formatted = convertStrToBool(format);
    const fromNow = fromnow  ? convertStrToBool(fromnow) : true;
    if (eventCounters[name]) {
        const timePeriod = convertToMs(parseInt(value, 10), uom);
        let countObj;
        if (formatted) {
            countObj = await eventCounters[name].getEventFormatted(timePeriod, fromNow);
        } else {
            countObj = await eventCounters[name].getEvent(timePeriod, fromNow);
        }
        res.json(countObj);
    } else {
        res.json({msg: `No events for ${name}`});
    }
});

router.get('/events/:value/:uom/:format?/:fromnow?', async (req: Request, res: Response) => {
    const {value, uom, format, fromnow} = req.params;
    const formatted = convertStrToBool(format);
    const fromNow = fromnow  ? convertStrToBool(fromnow) : true;
    const timePeriod = convertToMs(parseInt(value, 10), uom);
    const eventsArray = await getEvents(timePeriod, fromNow);
    res.json(eventsArray);
});


export default router;
