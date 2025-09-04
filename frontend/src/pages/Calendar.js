// src/components/Calendar.jsx
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  
  const fetchEvents = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/events/`);
    setEvents(res.data.map(e => ({
      title: e.title,
      start: e.start_time,
      end: e.end_time
    })));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    await axios.post(`${process.env.REACT_APP_API_BASE_URL}/events/upload_excel/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    fetchEvents();
  };

  return (
    <div>
      <input type="file" accept=".xlsx" onChange={handleFileUpload} />
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
      />
    </div>
  );
};

export default Calendar;
