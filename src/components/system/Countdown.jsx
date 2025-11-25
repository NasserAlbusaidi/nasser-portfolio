import React, { useState, useEffect } from 'react';

const Countdown = ({ targetDate }) => {
  const calculateTimeRemaining = () => {
    const total = Date.parse(targetDate) - Date.parse(new Date());
    if (total <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    return { days, hours, minutes, seconds };
  };

  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-2 md:gap-4 text-center">
      <div className="bg-neutral-900/50 border border-neutral-800 p-3 md:p-4 rounded-lg w-20 md:w-24">
        <div className="text-3xl md:text-5xl font-bold text-white font-sans">{String(timeRemaining.days).padStart(2, '0')}</div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Days</div>
      </div>
      <div className="bg-neutral-900/50 border border-neutral-800 p-3 md:p-4 rounded-lg w-20 md:w-24">
        <div className="text-3xl md:text-5xl font-bold text-white font-sans">{String(timeRemaining.hours).padStart(2, '0')}</div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Hours</div>
      </div>
      <div className="bg-neutral-900/50 border border-neutral-800 p-3 md:p-4 rounded-lg w-20 md:w-24">
        <div className="text-3xl md:text-5xl font-bold text-white font-sans">{String(timeRemaining.minutes).padStart(2, '0')}</div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Mins</div>
      </div>
      <div className="bg-neutral-900/50 border border-red-800/50 p-3 md:p-4 rounded-lg w-20 md:w-24">
        <div className="text-3xl md:text-5xl font-bold text-red-500 font-sans animate-pulse">{String(timeRemaining.seconds).padStart(2, '0')}</div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Secs</div>
      </div>
    </div>
  );
};

export default Countdown;
