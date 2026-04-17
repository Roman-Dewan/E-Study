const courses = [
  { icon: '🤖', grad: 'linear-gradient(135deg,#f093fb,#f5576c)', title: 'Machine Learning Basic to advanced', instructor: 'Monkey D Lufy', lessons: 15, hours: 40, progress: 100, status: 'completed' },
  { icon: '⚓', grad: 'linear-gradient(135deg,#4facfe,#00f2fe)', title: 'western trades 101', instructor: 'Jack sparrow', lessons: 15, hours: 40, progress: 100, status: 'completed' },
  { icon: '⌘', grad: 'linear-gradient(135deg,#f5a623,#f76b1c)', title: 'Classical Chines martial arts', instructor: 'Yang kai', lessons: 15, hours: 40, progress: 30, status: 'ongoing' },
  { icon: '🎮', grad: 'linear-gradient(135deg,#43e97b,#38f9d7)', title: 'Game development basic to advaced', instructor: 'Monkey D Rifat', lessons: 15, hours: 40, progress: 55, status: 'ongoing' },
  { icon: '🌍', grad: 'linear-gradient(135deg,#667eea,#764ba2)', title: 'History of world leaders', instructor: 'John Snow', lessons: 15, hours: 40, progress: 70, status: 'ongoing' },
  { icon: '🎨', grad: 'linear-gradient(135deg,#f5a623,#ee0979)', title: 'History of graphic design', instructor: 'Darul Ironborne Joe', lessons: 15, hours: 40, progress: 20, status: 'ongoing' },
  { icon: '⬡', grad: 'linear-gradient(135deg,#11998e,#38ef7d)', title: 'History of graphic design', instructor: 'Bucky barnes', lessons: 15, hours: 40, progress: 45, status: 'ongoing' },
  { icon: '💪', grad: 'linear-gradient(135deg,#fc5c7d,#6a82fb)', title: 'Home Bodybuilding', instructor: 'Steve Rogers', lessons: 15, hours: 40, progress: 10, status: 'ongoing' },
  { icon: '🌐', grad: 'linear-gradient(135deg,#f7971e,#ffd200)', title: 'Political Science', instructor: 'Tarek Rahman', lessons: 15, hours: 40, progress: 65, status: 'ongoing' },
  { icon: '🖼️', grad: 'linear-gradient(135deg,#4facfe,#00f2fe)', title: 'History of graphic design', instructor: 'Narruto Uzamaki', lessons: 15, hours: 40, progress: 80, status: 'ongoing' },
  { icon: '👗', grad: 'linear-gradient(135deg,#f093fb,#f5576c)', title: 'Fashion of daily lives', instructor: 'Gojo Saturo', lessons: 15, hours: 40, progress: 35, status: 'ongoing' },
  { icon: '🎵', grad: 'linear-gradient(135deg,#43e97b,#38f9d7)', title: 'Classical Music Tutorial', instructor: 'Snop Doog', lessons: 15, hours: 40, progress: 15, status: 'ongoing' },
  { icon: '🖌️', grad: 'linear-gradient(135deg,#f5a623,#f76b1c)', title: 'Digital Painting', instructor: 'Roman D silva', lessons: 15, hours: 40, progress: 100, status: 'completed' },
  { icon: '📜', grad: 'linear-gradient(135deg,#667eea,#764ba2)', title: 'Ancient History of the world', instructor: 'Aegon Targeryen', lessons: 15, hours: 40, progress: 50, status: 'ongoing' },
  { icon: '💼', grad: 'linear-gradient(135deg,#11998e,#38ef7d)', title: 'World Business from POTUS', instructor: 'Donald Trump', lessons: 15, hours: 40, progress: 5, status: 'ongoing' },
];

const avatarColors = ['#3DBE7B', '#f093fb', '#4facfe', '#f5a623', '#667eea', '#fc5c7d', '#11998e'];

function renderCourses(list) {
  const grid = document.getElementById('coursesGrid');
  grid.innerHTML = list.map((c, i) => `
    <div class="course-card">
      <div class="card-menu">···</div>
      <div class="course-icon-wrap" style="background:${c.grad}">${c.icon}</div>
      <h3 class="course-title">${c.title}</h3>
      <div class="instructor">
        <div class="instr-avatar" style="background:${avatarColors[i % avatarColors.length]}">${c.instructor[0]}</div>
        <span class="instr-name">${c.instructor}</span>
      </div>
      <div class="course-meta">
        <span class="meta-item"><i class="fa-solid fa-layer-group" style="color:#A78BFA"></i> ${c.lessons} Lesson</span>
        <span class="meta-item"><i class="fa-regular fa-clock"></i> ${c.hours}Hours</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${c.progress}%"></div></div>
      ${c.status === 'completed' ? '<div class="status-badge"><i class="fa-solid fa-square-check"></i> Completed</div>' : ''}
    </div>
  `).join('');

  // Make cards clickable
  grid.querySelectorAll('.course-card').forEach(card => {
    card.addEventListener('click', () => window.location.href = 'courses-detail.html');
  });
}

renderCourses(courses);

// Search filter
document.getElementById('searchInput').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  renderCourses(courses.filter(c =>
    c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q)
  ));
});

// Pagination
document.querySelectorAll('.page-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// View toggle
document.getElementById('listView').addEventListener('click', function () {
  this.classList.add('active');
  document.getElementById('gridView').classList.remove('active');
  document.getElementById('coursesGrid').style.gridTemplateColumns = '1fr';
});
document.getElementById('gridView').addEventListener('click', function () {
  this.classList.add('active');
  document.getElementById('listView').classList.remove('active');
  document.getElementById('coursesGrid').style.gridTemplateColumns = 'repeat(3,1fr)';
});