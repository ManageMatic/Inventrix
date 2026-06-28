import React, { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import "../../styles/DatePicker.css";

const DatePicker = ({ value, onChange, placeholder = "dd/mm/yyyy", className = "form-input" }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef(null);

  // Synchronize internal state with external value prop (YYYY-MM-DD)
  useEffect(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        setInputValue(`${parts[2]}/${parts[1]}/${parts[0]}`);
        const parsed = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (!isNaN(parsed.getTime())) {
          setCurrentMonth(parsed);
        }
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  // Click outside to close calendar popover
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleInputChange = (e) => {
    let val = e.target.value;
    // Allow only digits and slashes
    val = val.replace(/[^0-9/]/g, "");

    // Auto-insert slashes as the user types
    const len = val.length;
    if (len === 2 && !val.includes("/")) {
      val = val + "/";
    } else if (len === 5 && val.split("/").length === 2) {
      val = val + "/";
    }

    if (val.length <= 10) {
      setInputValue(val);

      // If we have a full string dd/mm/yyyy, try to parse and update parent state
      if (val.length === 10) {
        const parts = val.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          const parsed = new Date(year, month, day);

          if (
            parsed.getFullYear() === year &&
            parsed.getMonth() === month &&
            parsed.getDate() === day
          ) {
            const yyyy = year;
            const mm = String(month + 1).padStart(2, "0");
            const dd = String(day).padStart(2, "0");
            onChange(`${yyyy}-${mm}-${dd}`);
          }
        }
      }
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInCurrent = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const daysInPrev = getDaysInMonth(year, month - 1);

  const cells = [];

  // Trailing days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({
      day: daysInPrev - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, daysInPrev - i),
    });
  }

  // Days of the current month
  for (let i = 1; i <= daysInCurrent; i++) {
    cells.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i),
    });
  }

  // Leading days from next month to fill grid
  const totalCells = 42; // standard 6 rows
  const remaining = totalCells - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i),
    });
  }

  const handleCellClick = (cell) => {
    const d = cell.date;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setShowCalendar(false);
  };

  const isSelected = (cellDate) => {
    if (!value) return false;
    const [vy, vm, vd] = value.split("-").map(Number);
    return (
      cellDate.getFullYear() === vy &&
      cellDate.getMonth() === vm - 1 &&
      cellDate.getDate() === vd
    );
  };

  const isToday = (cellDate) => {
    const today = new Date();
    return (
      cellDate.getFullYear() === today.getFullYear() &&
      cellDate.getMonth() === today.getMonth() &&
      cellDate.getDate() === today.getDate()
    );
  };

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="datepicker-container" ref={containerRef}>
      <div className="datepicker-input-wrapper">
        <input
          type="text"
          className={`${className} datepicker-input`}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onClick={() => setShowCalendar(true)}
          onFocus={() => setShowCalendar(true)}
        />
        <button
          type="button"
          className="datepicker-icon-btn"
          onClick={() => setShowCalendar(!showCalendar)}
        >
          <Calendar size={18} />
        </button>
      </div>

      {showCalendar && (
        <div className="datepicker-calendar">
          <div className="datepicker-header">
            <button type="button" className="datepicker-nav-btn" onClick={handlePrevMonth}>
              <ChevronLeft size={16} />
            </button>
            <span className="datepicker-month-year">
              {monthsList[month]} {year}
            </span>
            <button type="button" className="datepicker-nav-btn" onClick={handleNextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="datepicker-grid-header">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          <div className="datepicker-grid-body">
            {cells.map((cell, index) => {
              const selected = isSelected(cell.date);
              const today = isToday(cell.date);
              const classes = [
                "datepicker-cell",
                !cell.isCurrentMonth ? "dimmed" : "",
                selected ? "selected" : "",
                today ? "today" : "",
              ].filter(Boolean).join(" ");

              return (
                <div
                  key={index}
                  className={classes}
                  onClick={() => handleCellClick(cell)}
                >
                  {cell.day}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
