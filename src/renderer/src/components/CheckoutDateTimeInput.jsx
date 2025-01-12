import React, { useState, useEffect } from 'react';
import { Edit, Calendar } from 'lucide-react';

const TimeInput = ({ value, onSave, isEditing, onEditClick }) => {
  // Initialize state from input value
  const [date, setDate] = useState(() => {
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) throw new Error('Invalid date');
      // Format as YYYY-MM-DD for input type="date"
      return d.toLocaleDateString('en-GB').split('/').reverse().join('-');
    } catch (err) {
      return new Date().toLocaleDateString('en-GB').split('/').reverse().join('-');
    }
  });

  const [time, setTime] = useState(() => {
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) throw new Error('Invalid date');
      const hours = d.getHours();
      return {
        hours: hours % 12 || 12,
        minutes: d.getMinutes(),
        period: hours >= 12 ? 'PM' : 'AM'
      };
    } catch (err) {
      const now = new Date();
      return {
        hours: now.getHours() % 12 || 12,
        minutes: now.getMinutes(),
        period: now.getHours() >= 12 ? 'PM' : 'AM'
      };
    }
  });

  // Update internal state when value prop changes
  useEffect(() => {
    if (!value) return;
    
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setDate(d.toLocaleDateString('en-GB').split('/').reverse().join('-'));
        const hours = d.getHours();
        setTime({
          hours: hours % 12 || 12,
          minutes: d.getMinutes(),
          period: hours >= 12 ? 'PM' : 'AM'
        });
      }
    } catch (err) {
      console.error('Error updating from prop:', err);
    }
  }, [value]);

  const formatForDisplay = (dateStr, timeObj) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const hours = timeObj.period === 'PM' && timeObj.hours !== 12 
        ? timeObj.hours + 12 
        : timeObj.period === 'AM' && timeObj.hours === 12 
          ? 0 
          : timeObj.hours;
      
      // Create date in local time
      const localDate = new Date(year, month - 1, day, hours, timeObj.minutes);
      
      if (isNaN(localDate.getTime())) throw new Error('Invalid date');
      
      // Format for display in dd/mm/yyyy format with time
      const formattedDate = localDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const formattedTime = localDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      return `${formattedDate} ${formattedTime}`;
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };

  const handleSave = () => {
    try {
      const hours = time.period === 'PM' && time.hours !== 12 
        ? time.hours + 12 
        : time.period === 'AM' && time.hours === 12 
          ? 0 
          : time.hours;

      const [year, month, day] = date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day, hours, time.minutes);

      if (isNaN(localDate.getTime())) throw new Error('Invalid date');
      
      onSave(localDate.toISOString());
    } catch (err) {
      console.error('Error saving date:', err);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="min-w-[180px]">{formatForDisplay(date, time)}</span>
        <button 
          onClick={onEditClick}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Edit className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-2 py-1 w-36 pr-8"
        />
        <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 w-4 h-4" />
      </div>

      <div className="flex gap-2 items-center">
        <select
          value={time.hours}
          onChange={(e) => setTime(prev => ({ ...prev, hours: parseInt(e.target.value) }))}
          className="border rounded px-2 py-1 w-16"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {String(i + 1).padStart(2, '0')}
            </option>
          ))}
        </select>

        <select
          value={time.minutes}
          onChange={(e) => setTime(prev => ({ ...prev, minutes: parseInt(e.target.value) }))}
          className="border rounded px-2 py-1 w-16"
        >
          {Array.from({ length: 60 }, (_, i) => (
            <option key={i} value={i}>
              {String(i).padStart(2, '0')}
            </option>
          ))}
        </select>

        <select
          value={time.period}
          onChange={(e) => setTime(prev => ({ ...prev, period: e.target.value }))}
          className="border rounded px-2 py-1 w-16"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>

        <button 
          onClick={handleSave}
          className="bg-green-500 text-white rounded px-4 py-1 hover:bg-green-600 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default TimeInput;