import { useMemo } from 'react';

const DISTANCES = {
    SWIM: 1.9,
    BIKE: 90,
    RUN: 21.1,
    TRANSITION_MINS: 10
};

export const useRacePrediction = (logs) => {
    return useMemo(() => {
        // 1. Filter logs to last 90 days for relevance
        const now = new Date();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);

        const recentLogs = logs.filter(l => new Date(l.date) >= ninetyDaysAgo);

        // 2. Helper to get avg speed (km/h) for a type
        const getAvgSpeed = (type) => {
            const typeLogs = recentLogs.filter(l => l.activityType === type && parseFloat(l.distance) > 0 && parseFloat(l.duration) > 0);
            if (typeLogs.length === 0) return 0;

            // Sum total distance and duration for weighted average
            const totalDist = typeLogs.reduce((acc, curr) => acc + parseFloat(curr.distance), 0);
            const totalDur = typeLogs.reduce((acc, curr) => acc + parseFloat(curr.duration), 0); // mins

            return totalDist / (totalDur / 60); // km per hour
        };

        const swimSpeed = getAvgSpeed('swim');
        const bikeSpeed = getAvgSpeed('bike');
        const runSpeed = getAvgSpeed('run');

        // 3. Project 70.3 Times (Distances fixed for Ironman 70.3)
        const swimTime = swimSpeed > 0 ? DISTANCES.SWIM / swimSpeed : 0;
        const swimPace = swimSpeed > 0 ? DISTANCES.SWIM / swimTime : 0;
        const bikeTime = bikeSpeed > 0 ? DISTANCES.BIKE / bikeSpeed : 0;
        const runTime = runSpeed > 0 ? DISTANCES.RUN / runSpeed : 0;
        const runTimeInMinutes = runTime * 60;
        const runPace = runTimeInMinutes > 0 ? runTimeInMinutes / DISTANCES.RUN : 0;

        // Transitions (Estimate 10 mins total for T1+T2 if no data)
        const transitionTime = DISTANCES.TRANSITION_MINS / 60;

        const totalTime = swimTime + bikeTime + runTime + (swimTime && bikeTime && runTime ? transitionTime : 0);

        return {
            swim: { time: swimTime, speed: swimSpeed, label: `${DISTANCES.SWIM} KM`, pace: swimPace },
            bike: { time: bikeTime, speed: bikeSpeed, label: `${DISTANCES.BIKE} KM` },
            run: { time: runTime, speed: runSpeed, label: `${DISTANCES.RUN} KM`, pace: runPace },
            total: totalTime
        };
    }, [logs]);
};
