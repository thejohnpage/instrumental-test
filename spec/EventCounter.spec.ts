/*
 * Package :
 * Project : instrumental
 * File    : EventCounter.spec
 * Created by john
 * On 12/5/19 at 7:48 PM
 * Updated by john
 * On 12/6/19 14:15
*/

import {
    addCounter,
    deleteAllEventCounters,
    deleteEventData,
    eventCounters,
    getEvents,
} from '../src/monitor/event-counter';
function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('EventCounters', async () => {
    let originalTimeout: number;
    // need to extend the timeout to allow for building events array
    beforeAll(() => {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 20;
    });

    await it('should add a counter called testing_1 & add events', async () => {
        let name: string = '';
        const maxEntries = process.env.EVENT_COUNTER_MAX_ENTRIES ? parseInt(process.env.EVENT_COUNTER_MAX_ENTRIES, 10) : 10;
        for (let i = 0; i < 15; i++) {
            try {
                name = await addCounter('testing/1');
                await sleep(1000);
            } catch (e) {
                // tslint:disable-next-line:no-console
                console.log('Error: ', e.message);
            }
        }
        expect(name).toEqual('testing_1');
        expect(eventCounters[name].getSizeOfEventsArray()).toEqual(maxEntries);
    });

    await it('should return 3 entries', async () => {
        const name = 'testing_1';
        const countObj = await eventCounters[name].getEvent(3000, false);
        expect(countObj.qty).toEqual(3);
    });

    await it('should create a second counter called testing_2', async () => {
        const name = await addCounter('testing/2');
        expect(name).toEqual('testing_2');
        expect(eventCounters[name].getSizeOfEventsArray()).toEqual(1);
    });

    await it('should return array of IEventsCount', async () => {
        const events = await getEvents(15000, false);
        expect(events.length).toEqual(2);
        expect(events[0].name).toEqual('testing/1');
        expect(events[0].qty).toEqual(10);
        expect(events[1].name).toEqual('testing/2');
        expect(events[1].qty).toEqual(1);
    });

    await it('should remove testing_2', async () => {
        const name = 'testing_2';
        await deleteEventData(name);
        expect(eventCounters.hasOwnProperty(name)).toBe(false);
    });

    await it('should remove all counters', async () => {
        await deleteAllEventCounters();
        expect(Object.keys(eventCounters).length).toBe(0);
    });

    afterAll(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
});


