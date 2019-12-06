/*
 * Package :
 * Project : instrumental
 * File    : event-counter
 * Created by john
 * On 12/5/19 at 2:40 PM
 * Updated by john
 * On 12/6/19 at 12:00
*/

/**
 * This file contains interfaces, functions, the EventCounter class
 * and an empty eventCounters Object where the event objects will be stored.
 * The addCounter function is used to add an event to a counter, the counter
 * will be created if it does not already exist.
 * The implementation of addCounter in this file uses the originalUrl from
 * the express Request object to automatically create a property in the
 * eventCounters object for the counter.
 * In this case the name passed to the constructor of the EventCounter
 * object is the API End Point url.
 * The addCounter function can be modified to suit other uses or an
 * additional function created based off of addCounter that stores events
 * signalled by something other than a call to middleware.
 */

interface IEventCounters {[name: string]: EventCounter; }

interface IEventCounterParams {
    name: string;
    period: number; // milliseconds
}

interface IEventRawData {
    name: string;
    qty: number;
    timePeriod: number;
    now: number;
    fromNow: boolean;
    oldest: number;
    newest: number;
}

interface IEventFormattedData {
    msg: string;
    data: IEventRawData;
    events: number[];
}

export interface IEventsCount {
    name: string;
    qty: number;
}

export let eventCounters: IEventCounters = {};

/**
 * function addCounter
 * add a counter to the eventCounters Object if it does not exist
 * This function is tailored to works as middleware in NodeJS/Express
 * The name of the counter is generated from the API end point URL
 * @param url: string
 * @returns prop: string name of eventCounters property
 */
export const addCounter = async (url: string) => {
    const period = process.env.EVENT_COUNTER_PERIOD ? parseInt(process.env.EVENT_COUNTER_PERIOD, 10) : 5 * 60 * 1000;
    const prop = url.replace(/\//gi, ' ').trim().replace(/ /gi, '_');
    if (!eventCounters.hasOwnProperty(prop)) {
        eventCounters[prop] = new EventCounter({name: url, period} as IEventCounterParams);
    }
    try {
        await eventCounters[prop].addEvent();
    } catch (e) {
        throw e;
    }
    return prop;
};

/**
 * function getEvents
 * @param period
 * @param fromNowFlag
 * @returns Array of IEventsCount {name, qty}
 */
export const getEvents = async (period: number, fromNowFlag: boolean = true): Promise<IEventsCount[]> => {
    const eventsArray = [];
    for (const key of Object.keys(eventCounters)) {
        const item = eventCounters[key];
        const countObj = await item.getEvent(period, fromNowFlag);
        eventsArray.push({name: countObj.name, qty: countObj.qty} as IEventsCount);
    }
    return eventsArray;
};

/**
 * function deleteEventData
 * removes named event counter object from eventCounters object
 * @param name
 */
export const deleteEventData = async (name: string) => {
    if (!eventCounters.hasOwnProperty(name)) {
        delete eventCounters[name];
    }
};

/**
 * function deleteAllEventCounters
 * removes all counters from eventCounters object
 */
export const deleteAllEventCounters = async () => {
    eventCounters = {};
};

/**
 * function convertToMs
 * Converts minutes or seconds to milliseconds
 * Zero based time period therefore 10 seconds returns 9999 ms
 * @param value: number
 * @param uom: string - ms (default), seconds, secs, minutes, mins
 * @returns number of milliseconds
 */
export const convertToMs = (value: number, uom: string = 'ms') => {
    uom = uom.toLowerCase();
    switch (uom) {
        case 'seconds':
        case 'secs':
            value = (value * 1000) - 1;
            break;
        case 'minutes':
        case 'mins':
            value = (value * 60000) - 1;
            break;
        case 'ms':
        default:
            break;
    }
    return value;
};

/**
 * function convertStrToBool
 * @param str: string
 * @returns boolean
 */
export const convertStrToBool = (str: string | undefined) => {
    let boolValue = false;
    if (str) {
        str = str.toLowerCase();
        switch (str) {
            case 'true':
            case 't':
            case '1':
            case 'yes':
            case 'format':
                boolValue = true;
                break;
            case 'false':
            case 'f':
            case '0':
            case 'no':
            default:
                boolValue = false;
        }
    }
    return boolValue;
};

/**
 * class EventCounter
 * constructor takes an IEventCounterParams object
 */
export class EventCounter {
    private readonly name: string;
    private period: number;
    private events: number[] = []; // events in descending order

    constructor(params: IEventCounterParams) {
        this.name = params.name;
        this.period = params.period;
    }

    /**
     * method getSizeOfEventsArray
     * the events array is private
     * @returns number size of the events array
     */
    public getSizeOfEventsArray() {
        return this.events.length;
    }

    /**
     * public method addEvent
     * enters timestamp of event into events array.
     * events array is in descending order, most recent first
     * maintains list length based on environment variable
     */
    public async addEvent() {
        const maxEntries = process.env.EVENT_COUNTER_MAX_ENTRIES ? parseInt(process.env.EVENT_COUNTER_MAX_ENTRIES, 10) : 100;
        const period = process.env.EVENT_COUNTER_PERIOD ? parseInt(process.env.EVENT_COUNTER_PERIOD, 10) : 5 * 60 * 1000;
        // check if last entry in events array (time descending) is outside recording period
        // reduce array until all entries within recording period
        // an alternate way to do this would be to iterate through the array until an
        // entry that was older than the oldestAllowed was found and then slice the array
        // the method chosen appears to be the most efficient
        while (this.events.length > 0 && (this.events[0] - this.events[this.events.length - 1]) > period ) {
            this.events.pop();
        }
        // now check if number of entries exceeds max allowed entries
        // reduce array until size below maxEntries
        while (this.events.length >= maxEntries) {
            this.events.pop();
        }
        // add new event to top of events array
        this.events.unshift(Date.now());
    }

    /**
     * public method getEvent
     * @param timePeriod
     * @param fromNow
     * @returns IEventRawData object of raw data
     */
    public async getEvent(timePeriod: number, fromNow: boolean = true): Promise<IEventRawData> {
        // timePeriod specifies how far back to look
        let oldest: number;
        let all = false;
        // period determines max time into the past default 5 minutes
        const period = process.env.EVENT_COUNTER_PERIOD ? parseInt(process.env.EVENT_COUNTER_PERIOD, 10) : 5 * 60 * 1000;
        if (timePeriod > period) {
            timePeriod = period;
        }
        const now = Date.now();
        let counter = 0;
        if (fromNow) {
            // get now() and subtract timePeriod
            oldest = now - timePeriod;
        } else {
            // get newest then subtract timePeriod
            oldest = this.events[0] - timePeriod;
        }
        if (oldest < this.events[this.events.length - 1]) {
            oldest = this.events[this.events.length - 1];
            all = true;
        }
        if (!all) {
            for (const item of this.events) {
                if (item >= oldest) {
                    counter++;
                } else {
                    break;
                }
            }
        } else {
            counter = this.events.length;
        }
        return {name: this.name, qty: counter, timePeriod, now, fromNow, oldest, newest: this.events[0] };
    }

    /**
     * public method getEventFormatted
     * data formatted for human consumption
     * @param period
     * @param fromNowFlag
     * @returns IEventFormattedData object containing formatted and raw data
     */
    public async getEventFormatted(period: number, fromNowFlag: boolean = true): Promise<IEventFormattedData> {
        const {name, qty, timePeriod, now, fromNow, oldest, newest } = await this.getEvent(period, fromNowFlag);
        const timePeriodStr = this.msToHMS(timePeriod);
        const nowStr = fromNowFlag ? this.convertMsToTime(now) : this.convertMsToTime(newest);
        const oldestStr = this.convertMsToTime(oldest);
        const newestStr = this.convertMsToTime(newest);
        const msg = `'${name}' ${qty} events occurred during the preceding ${timePeriodStr} measured from ${nowStr}. The oldest event in that time period occurred at ${oldestStr} and the newest at ${newestStr}`;
        return {msg, data: {name, qty, timePeriod, now, fromNow, oldest, newest}, events: this.events};
    }

    /**
     * private method convertMsToTime
     * converts timestamp in milliseconds to ISO format date & time.
     * @param ms
     * @returns string ISO format date & time
     */
    private convertMsToTime(ms: number) {
        const t = new Date();
        t.setTime(ms);
        return t.toISOString();
    }

    /**
     * private method msToHMS
     * converts milliseconds to Hours:Minutes:Seconds.miliseconds
     * @param ms number milliseconds
     * @returns string
     */
    private msToHMS(ms: number) {
        const milliseconds = parseInt(((ms % 1000) / 100).toString(), 10);
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const hoursStr = (hours < 10) ? '0' + hours : hours;
        const minutesStr = (minutes < 10) ? '0' + minutes : minutes;
        const secondsStr = (seconds < 10) ? '0' + seconds : seconds;
        return (hours > 0 ? hoursStr + ':' : '') + minutesStr + ':' + secondsStr + '.' + milliseconds.toString();
    }
}
