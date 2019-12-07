#Instrumental Event Counter
##Notes
This is a complete application based on the nodeJS/express Typescript template
from https://www.npmjs.com/package/express-generator-typescript with auth.  
##Installation
It should be possible to clone this repo and `run npm install`.  
To start the application locally with the correct environment `npm run start:dev`  
To run the tests for the Event Counter `npm test` note the `nodemon.test.json` file is setup to only run the `/spec/EventCount.spec.ts` file.  
##Using the App and viewing the Event Counters
If all has gone well you can open the home page of the App by going to `localhost:3000`  
You should be asked to login and the default `admin` credentials are actually shown below the `login` button. Here they
are in case you need them :  
username: `TheJohnPage@gmail.com` password: `Password@1`  
If you open Postman or some other tool for interacting with API end points and go to :  
http://localhost:3000/api/monitor/events/2/minutes  
You will be able to see the event counter values for the API End Points that you have interacted with
over the last 2 minutes.  
You can change the time period by altering the `minutes` to `seconds` or `ms` then
altering the preceding value to the quantity of of that unit you wish to use.  
NOTE: This is only a demo App to show how the Event Counter can be used as
middleware. The App itself may have bugs and unfinished features.  
##The Event Counter Library
Located in the `src/monitor/event-counter.ts` file are elements needed to use the Event Counter.  
The Unit Tests are located in the `spec/EventCounter.spec.ts` file.  
The middleware use of the Event Counter is located in the `src/shared/CountEvents.ts` file.  
The API routes to view the Event Counters can be found in the `src/routes/Monitor.ts` file.  
###Usage
The middleware file `src/shared/CountEvents.ts` is a good example of how easy it is to incorporate the Events Counter.  


Here is an example API route definition :  
`router.get('/all', adminMW, countEvent, async (req: Request, res: Response) => {}`  
where `countEvent` is the Event Counter middleware.  


The `addCounter` function takes one argument that is used to create the `eventCounters` object property name where the
EventCounter will be stored and the name that is passed to the EventCounter class constructor. Because in this example
the Event Counter is being used as middleware, the originalUrl from the express Request object is passed to
`addCounter` function.  


The `/` in the URL are converted to `_` to make a Javascript Object friendly name. The URL is passed to
the `EventCounter` constructor to be used as the `name` for this instance.  


The `addCounter` creates a new entry in the `eventCounters` object if one does not already exist, then it calls
`addEvent` on the instance to store the event timestamp. If an EventCounter already exists in the `eventCounters`
`addCounter` simply calls `addEvent` on that instance.  


To enable querying the recorded events array for the quantity of events in a given time period the `events` array
is populated with the timestamp when `addEvent` is called. 

The exported function `getEvents` takes a `period` in milliseconds and a `fromNow` boolean and returns
an array of Event Counters, showing the `name` and the `qty` of events.  
```json
[  
     {  
         "name": "/api/auth/logout",  
         "qty": 1  
     },  
     {  
         "name": "/api/auth/login",  
         "qty": 1  
     },  
     {  
         "name": "/api/users/all",  
         "qty": 2  
     },  
     {  
         "name": "/api/users/add",  
         "qty": 1  
     }  
 ]  
```
There are functions to `deleteEventData` by `eventCounters` object property name.  
To clear all counters call `deleteAllEventCounters`  
Each method and function in `src/monitor/event-counter.ts` has JSDoc comments that explain the purpose
and arguments.  
##Future Upgrades, enhancements, things to consider
Even though this implementation can be used in a testing environment, I would suggest switching to
storage that is not memory constrained for `production` use where there could be millions of events
second.  

Each entry in the `events` array for a named event consumes 8 bytes (64 bit timestamp). On that basis
approx 131,000 events per megabyte. For 1M events a second for a 5 minute window is ~2.3GB.  

An alternative approach would be to use slots of a specific time size, say 1 minute, and store
a quantity per minute. The array would contain a 64 bit time value and 64 bit quantity, 16 bytes per minute.
A 5 minute time window would consume a total of 80 bytes plus overhead, instead of ~2.3GB. The trade off is 
granularity and slightly more complex logic to update the correct time slot and potentially a simplified query
for a given time period.
