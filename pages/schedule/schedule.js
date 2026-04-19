// ── AUTH GUARD & LOGOUT ───────────────────────────────────────────────────────
import { auth } from '../../js/firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) { window.location.href = '../../index.html'; }
});

document.addEventListener('estudy-logout', async () => {
  try { await signOut(auth); window.location.href = '../../index.html'; }
  catch (e) { console.error(e); }
});

// Setup global state
let tasks = JSON.parse(localStorage.getItem("tasks")) || [
    // Default seed tasks mapping closer to the UI
    { id: 1, title: "Figma Prototype Class", date: "2020-07-17", startTime: "12:00", endTime: "13:00", theme: "green" },
    { id: 2, title: "Sketch learning", date: "2020-07-17", startTime: "17:00", endTime: "18:00", theme: "purple" }
];

let currentDate = new Date(); // Using real date, but for mockup accuracy, one could hardcode 2020-07-17

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Removed let datePicker; from here because we use window.datePicker

document.addEventListener("DOMContentLoaded", () => {
    window.datePicker = flatpickr("#taskDate", {
        dateFormat: "Y-m-d", // Value actually saved internally
        altInput: true,
        altFormat: "d-m-Y",  // What the user sees
        allowInput: true,    // Allows user to type and edit date manually
        clickOpens: false,   // Prevents calendar from auto-opening when typing
    });
    // If the user wants the exact look of July 2020, we can seed it here.
    // Uncomment next line to simulate the mockup's exact timeline:
    // currentDate = new Date(2020, 6, 17); // July 17, 2020
    
    initCalendar();
    renderReminders();
    
    // Auto sync timeline scroll to 10:00 AM initially to match design
    const gridContainer = document.getElementById("schedule-grid-container");
    if(gridContainer) gridContainer.scrollTop = 0; // Starts at 10:00

    requestNotificationPermission();
    
    // Close month picker on click outside
    document.addEventListener("click", (e) => {
        const dropdown = document.getElementById("monthPickerDropdown");
        if(dropdown && !dropdown.classList.contains("hidden") && !e.target.closest('.toolbar-actions')) {
            dropdown.classList.add("hidden");
        }
    });
});

function initCalendar() {
    renderMiniCalendar();
    renderMainCalendar();
    renderGrid();
}

function changeMiniMonth(dir) {
    currentDate.setMonth(currentDate.getMonth() + dir);
    initCalendar();
}

function changeMainMonth(dir) {
    currentDate.setMonth(currentDate.getMonth() + dir);
    initCalendar();
}

function selectDate(year, month, date) {
    currentDate = new Date(year, month, date);
    initCalendar();
}

function scrollDays(dir) {
    // A simple visual scroll or day jump. Here we jump by a week.
    currentDate.setDate(currentDate.getDate() + (dir * 7));
    initCalendar();
}

// ============== MONTH PICKER ==============
let pickerYear = currentDate.getFullYear();

function toggleMonthPicker() {
    const dropdown = document.getElementById("monthPickerDropdown");
    dropdown.classList.toggle("hidden");
    
    if(!dropdown.classList.contains("hidden")) {
        pickerYear = currentDate.getFullYear();
        renderMonthPicker();
    }
}

function renderMonthPicker() {
    const dropdown = document.getElementById("monthPickerDropdown");
    let html = `
        <div style="grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #eee; margin-bottom: 5px;">
            <i class="fa-solid fa-chevron-left" style="cursor: pointer; color: #888; padding: 5px;" onclick="changePickerYear(-1, event)"></i>
            <span id="pickerYearSpan" style="font-weight: 700; font-size: 14px; color: #333;">${pickerYear}</span>
            <i class="fa-solid fa-chevron-right" style="cursor: pointer; color: #888; padding: 5px;" onclick="changePickerYear(1, event)"></i>
        </div>
    `;
    months.forEach((m, index) => {
        html += `<div class="month-option" onclick="selectMonthFromPicker(${index})">${m}</div>`;
    });
    dropdown.innerHTML = html;
}

function changePickerYear(dir, event) {
    if (event) event.stopPropagation();
    pickerYear += dir;
    const span = document.getElementById("pickerYearSpan");
    if (span) span.innerText = pickerYear;
}

function selectMonthFromPicker(index) {
    currentDate.setFullYear(pickerYear, index);
    initCalendar();
    document.getElementById("monthPickerDropdown").classList.add("hidden");
}

// ============== MINI CALENDAR ==============
function renderMiniCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById("mini-month-year").innerText = `${months[month]} ${currentDate.getDate()} ${days[currentDate.getDay()]}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDaysInMonth = new Date(year, month, 0).getDate();

    const miniGrid = document.getElementById("mini-days-grid");
    miniGrid.innerHTML = "";

    // Prev month days
    for (let i = firstDay - 1; i >= 0; i--) {
        let d = prevDaysInMonth - i;
        miniGrid.innerHTML += `<span class="muted" onclick="selectDate(${year}, ${month-1}, ${d})">${d}</span>`;
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        let activeClass = (i === currentDate.getDate()) ? "active" : "";
        miniGrid.innerHTML += `<span class="${activeClass}" onclick="selectDate(${year}, ${month}, ${i})">${i}</span>`;
    }

    // Next month days to fill 35 grid slots (5 rows) or 42 (6 rows)
    let totalCells = firstDay + daysInMonth;
    let nextDays = (totalCells > 35) ? 42 - totalCells : 35 - totalCells;
    for (let i = 1; i <= nextDays; i++) {
        miniGrid.innerHTML += `<span class="muted" onclick="selectDate(${year}, ${month+1}, ${i})">${i}</span>`;
    }
}

// ============== MAIN CALENDAR (HORIZONTAL) ==============
function renderMainCalendar() {
    document.getElementById("main-month-year").innerText = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    const daysStrip = document.getElementById("days-strip");
    daysStrip.innerHTML = "";

    // Show roughly centered around currentDate
    let startDay = new Date(currentDate);
    startDay.setDate(startDay.getDate() - 6); // 6 days before

    for (let i = 0; i < 14; i++) { // Show 14 days
        let d = new Date(startDay);
        d.setDate(startDay.getDate() + i);
        
        let isActive = (d.getDate() === currentDate.getDate() && d.getMonth() === currentDate.getMonth()) ? "active" : "";
        
        daysStrip.innerHTML += `
            <div class="day-col ${isActive}" onclick="selectDate(${d.getFullYear()}, ${d.getMonth()}, ${d.getDate()})">
                <span class="day-num">${d.getDate()}</span>
                <span class="day-name">${days[d.getDay()]}</span>
            </div>
        `;
    }
}

// ============== SCHEDULE GRID ==============
function renderGrid() {
    const timeCol = document.getElementById("time-column");
    const gridLines = document.getElementById("grid-lines");
    const eventsContainer = document.getElementById("events-container");

    timeCol.innerHTML = "";
    gridLines.innerHTML = "";
    eventsContainer.innerHTML = "";

    // Hours 10:00 to 18:00
    for (let i = 10; i <= 18; i++) {
        timeCol.innerHTML += `<div class="time-slot">${i}:00</div>`;
        gridLines.innerHTML += `<div class="grid-line"></div>`;
    }

    // Filter tasks for selected date
    let dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;
    let dailyTasks = tasks.filter(t => t.date === dateStr);

    dailyTasks.forEach(task => {
        let startHour = parseInt(task.startTime.split(":")[0]);
        let startMin = parseInt(task.startTime.split(":")[1] || 0);
        let endHour = parseInt(task.endTime.split(":")[0]);
        let endMin = parseInt(task.endTime.split(":")[1] || 0);

        // Grid starts at 10:00, 60px per hour
        let startGridOffset = startHour + (startMin / 60) - 10;
        let endGridOffset = endHour + (endMin / 60) - 10;

        let topPx = startGridOffset * 60;
        let heightPx = (endGridOffset - startGridOffset) * 60;

        // Ensure tasks out of bounds don't look broken (e.g. earlier than 10 or later than 18)
        if(topPx < 0) {
            heightPx += topPx; // reduce height
            topPx = 0;
        }

        if(heightPx > 0) {
            eventsContainer.innerHTML += `
                <div class="event-card" data-theme="${task.theme}" style="top: ${topPx}px; height: ${heightPx}px;">
                    <h4>${task.title}</h4>
                    <p><i class="fa-regular fa-clock"></i> ${task.startTime} - ${task.endTime} AM</p>
                </div>
            `;
        }
    });

    document.getElementById("stat-progress").innerText = String(dailyTasks.length).padStart(2, "0");
}

// ============== REMINDERS ==============
function renderReminders() {
    const list = document.getElementById("reminders-list");
    list.innerHTML = "";

    // Show first two future tasks, or fallback
    let reminderTasks = tasks.slice(0, 2); 
    
    if (reminderTasks.length === 0) {
        list.innerHTML = `<p style="font-size:12px; color:#aaa;">No reminders</p>`;
        return;
    }

    reminderTasks.forEach(t => {
        list.innerHTML += `
            <div class="task-card">
                <div class="task-icon ${t.theme}"><i class="fa-solid fa-folder-open"></i></div>
                <div class="task-detail">
                    <h4>${t.title}</h4>
                    <p>${t.startTime}</p>
                </div>
                <i class="fa-solid fa-trash" style="color: #ff7875; cursor: pointer; padding: 5px;" onclick="deleteTask(${t.id})" title="Delete Reminder"></i>
            </div>
        `;
    });
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    initCalendar();
    renderReminders();
}

// ============== TASK MODAL & ACTIONS ==============
function openTaskModal() {
    document.getElementById("taskModal").classList.add("visible");
    let d = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;
    if(window.datePicker) window.datePicker.setDate(d);
    else document.getElementById("taskDate").value = d;
}

function closeTaskModal() {
    document.getElementById("taskModal").classList.remove("visible");
}

function saveTask() {
    const title = document.getElementById("taskTitle").value;
    const date = document.getElementById("taskDate").value;
    const startTime = document.getElementById("taskStartTime").value;
    const endTime = document.getElementById("taskEndTime").value;
    const theme = document.getElementById("taskTheme").value;
    const email = document.getElementById("taskEmail").value;

    if (!title || !date || !startTime || !endTime) {
        alert("Please fill out all required fields.");
        return;
    }

    const newTask = {
        id: Date.now(),
        title, date, startTime, endTime, theme, email
    };

    tasks.push(newTask);
    localStorage.setItem("tasks", JSON.stringify(tasks));

    closeTaskModal();
    
    // Automatically select the date the task was added to
    const [y, m, d] = date.split('-');
    selectDate(parseInt(y), parseInt(m)-1, parseInt(d));
    renderReminders();

    // Trigger Notification
    triggerNotification(title, email);
    
    // Reset form
    document.getElementById("taskTitle").value = "";
    document.getElementById("taskEmail").value = "";
}

// ============== NOTIFICATION SIMULATION ==============
function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

function triggerNotification(taskTitle, email) {
    let emailStr = email ? email : 'logged-in gmail';
    let message = `Task '${taskTitle}' saved! Email notification sent to ${emailStr}.`;

    // 1. UI Popup
    const popup = document.getElementById("customNotification");
    document.getElementById("notificationMessage").innerText = message;
    popup.classList.add("show");
    
    setTimeout(() => {
        popup.classList.remove("show");
    }, 4000);

    // 2. Browser Notification (if granted)
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Estudy Schedule", {
            body: message,
            icon: "https://cdni.iconscout.com/illustration/premium/thumb/online-learning-4488737-3765103.png"
        });
    }

    // 3. Fallback mailto (Disabled by default so it doesn't open mail client annoyingly, but left here as an option)
    /*
    if(email) {
        window.location.href = `mailto:${email}?subject=New Task: ${taskTitle}&body=You have a new task scheduled at ${taskTitle}.`;
    }
    */
}
