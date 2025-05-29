// 1. Firebase 설정 (자신의 firebaseConfig로 교체)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZ07GNmuDrtbca1t-D4elMZM8_JRWrE7E",
  authDomain: "test-250529.firebaseapp.com",
  databaseURL: "https://test-250529-default-rtdb.firebaseio.com",
  projectId: "test-250529",
  storageBucket: "test-250529.firebasestorage.app",
  messagingSenderId: "428973129250",
  appId: "1:428973129250:web:bdb74560e9e8f752fed47b",
  measurementId: "G-3CN4ESPNJ7"
};

// 2. Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const prayerRef = db.ref('prayerList');

// 3. 월 관리 변수
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // JS는 0부터 시작

function updateMonthTitle() {
  document.getElementById('monthTitle').textContent = `${currentYear}년 ${currentMonth}월`;
}
updateMonthTitle();

// 4. 월 이동 버튼 이벤트
document.getElementById('prevMonthBtn').onclick = () => {
  currentMonth--;
  if (currentMonth < 1) {
    currentMonth = 12;
    currentYear--;
  }
  updateMonthTitle();
  fetchAndRenderList();
};
document.getElementById('nextMonthBtn').onclick = () => {
  currentMonth++;
  if (currentMonth > 12) {
    currentMonth = 1;
    currentYear++;
  }
  updateMonthTitle();
  fetchAndRenderList();
};

// 5. 금요일만 선택 가능하게 min/max/step 설정 및 안내
function getFirstFriday(year, month) {
  // month: 1~12
  const firstDay = new Date(year, month - 1, 1);
  const firstFriday = new Date(year, month - 1, 1 + ((5 - firstDay.getDay() + 7) % 7));
  return firstFriday;
}
function getLastFriday(year, month) {
  // month: 1~12
  const lastDay = new Date(year, month, 0);
  const lastFriday = new Date(year, month, 0 - ((lastDay.getDay() - 5 + 7) % 7));
  return lastFriday;
}
function setDatePickerToFridays() {
  const inputDate = document.getElementById('inputDate');
  const min = getFirstFriday(currentYear, currentMonth);
  const max = getLastFriday(currentYear, currentMonth);
  inputDate.min = min.toISOString().slice(0, 10);
  inputDate.max = max.toISOString().slice(0, 10);
  inputDate.value = '';
}
setDatePickerToFridays();

document.getElementById('prevMonthBtn').addEventListener('click', setDatePickerToFridays);
document.getElementById('nextMonthBtn').addEventListener('click', setDatePickerToFridays);

// 6. 입력 및 저장 (금요일만, 입력값 검증, 추가 즉시 리스트 반영)
document.getElementById('addBtn').onclick = function() {
  const date = document.getElementById('inputDate').value;
  const role = document.getElementById('inputRole').value;
  const name = document.getElementById('inputName').value.trim();
  const alertBox = document.getElementById('alertBox');
  alertBox.style.display = 'none';

  // 입력값 체크
  if (!date || !role || !name) {
    alertBox.textContent = '날짜, 역할, 이름을 모두 입력해 주세요!';
    alertBox.style.display = 'block';
    return;
  }
  // 금요일인지 체크
  const selectedDate = new Date(date);
  if (selectedDate.getDay() !== 5) {
    alertBox.textContent = '매월 금요일만 선택이 가능합니다';
    alertBox.style.display = 'block';
    return;
  }
  // 저장
  prayerRef.push({ date, role, name }, (err) => {
    if (!err) {
      document.getElementById('inputDate').value = '';
      document.getElementById('inputRole').value = '';
      document.getElementById('inputName').value = '';
      setDatePickerToFridays();
      fetchAndRenderList();
    }
  });
};

// 7. 데이터 불러와서 화면에 표시 (입력 후 즉시 반영)
function fetchAndRenderList() {
  prayerRef.off(); // 기존 리스너 제거
  prayerRef.on('value', (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById('schedule-container');
    container.innerHTML = '';
    if (!data) {
      container.innerHTML = '<div style="color:#888;text-align:center;">데이터가 없습니다.</div>';
      return;
    }
    // 날짜별 역할별 그룹핑
    const grouped = {};
    Object.values(data).forEach(item => {
      const d = new Date(item.date);
      if (
        d.getFullYear() === currentYear &&
        d.getMonth() + 1 === currentMonth
      ) {
        if (!grouped[item.date]) grouped[item.date] = [];
        grouped[item.date].push(item);
      }
    });
    // 날짜순 정렬
    const dates = Object.keys(grouped).sort();
    if (dates.length === 0) {
      container.innerHTML = '<div style="color:#888;text-align:center;">데이터가 없습니다.</div>';
      return;
    }
    dates.forEach((date, idx) => {
      // 역할별 분류
      const roles = {
        '찬양인도': [],
        '싱어': [],
        '메인건반': [],
        '드럼': [],
        '베이스': [],
        '엔지니어': []
      };
      grouped[date].forEach(item => {
        if (roles[item.role]) roles[item.role].push(item.name);
      });
      // UI 출력
      const itemDiv = document.createElement('div');
      itemDiv.className = 'schedule-item';
      itemDiv.style.animationDelay = `${idx * 0.1}s`;
      itemDiv.innerHTML = `
        <div class="date-header" data-index="${idx}">
          <div class="date">${date}</div>
          <div class="event-type">금요기도회</div>
          <div class="toggle-icon">▼</div>
        </div>
        <div class="content" id="content-${idx}">
          <div class="leader-section">
            <div class="leader-title">찬양인도</div>
            <div class="leader-name ${roles['찬양인도'].length ? '' : 'leader-empty'}">
              ${roles['찬양인도'].join(', ') || '미정'}
            </div>
          </div>
          <div class="roles-grid">
            <div class="role-group">
              <div class="role-title">🎤 싱어</div>
              <div class="member-list">
                ${roles['싱어'].map(n => `<span class="member-tag">${n}</span>`).join('') || '<span style="color:#bbb;">없음</span>'}
              </div>
            </div>
            <div class="role-group">
              <div class="role-title">🎹 악기</div>
              <div class="member-list">
                ${roles['메인건반'].map(n => `<span class="member-tag">${n} (메인건반)</span>`).join('')}
                ${roles['드럼'].map(n => `<span class="member-tag">${n} (드럼)</span>`).join('')}
                ${roles['베이스'].map(n => `<span class="member-tag">${n} (베이스)</span>`).join('')}
                ${(!roles['메인건반'].length && !roles['드럼'].length && !roles['베이스'].length) ? '<span style="color:#bbb;">없음</span>' : ''}
              </div>
            </div>
            <div class="role-group">
              <div class="role-title">🔧 엔지니어</div>
              <div class="member-list">
                ${roles['엔지니어'].map(n => `<span class="member-tag">${n}</span>`).join('') || '<span style="color:#bbb;">없음</span>'}
              </div>
            </div>
          </div>
          <div class="additional-info">
            <div class="info-section">
              <div class="info-title">📋 콘티 리스트</div>
              <textarea class="setlist-area" placeholder="찬양 순서를 입력하세요..." id="setlist-${date.replace(/-/g,'')}"></textarea>
            </div>
            <div class="info-section">
              <div class="info-title">🎬 참고 유튜브</div>
              <input type="url" class="youtube-input" placeholder="유튜브 링크를 입력하세요" id="youtube-${date.replace(/-/g,'')}">
              <div class="youtube-preview" id="youtube-preview-${date.replace(/-/g,'')}">
                <span>🔗 링크가 입력되면 미리보기가 표시됩니다</span>
              </div>
            </div>
          </div>
        </div>
      `;
      container.appendChild(itemDiv);
    });
    // 저장된 콘티/유튜브 불러오기
    loadSavedData();
    // 첫 번째 자동 펼침
    setTimeout(() => {
      const firstContent = document.getElementById('content-0');
      const firstIcon = document.querySelector('.toggle-icon');
      if (firstContent && firstIcon) {
        firstContent.classList.add('expanded');
        firstIcon.classList.add('rotated');
      }
    }, 200);
  });
}
fetchAndRenderList();

// 모두 열기/닫기
document.getElementById('expand-all').onclick = () => {
  document.querySelectorAll('.content').forEach(c => c.classList.add('expanded'));
  document.querySelectorAll('.toggle-icon').forEach(i => i.classList.add('rotated'));
};
document.getElementById('collapse-all').onclick = () => {
  document.querySelectorAll('.content').forEach(c => c.classList.remove('expanded'));
  document.querySelectorAll('.toggle-icon').forEach(i => i.classList.remove('rotated'));
};

// 아코디언 토글
document.addEventListener('click', function(e) {
  if (e.target.closest('.date-header')) {
    const header = e.target.closest('.date-header');
    const idx = header.dataset.index;
    const content = document.getElementById(`content-${idx}`);
    const icon = header.querySelector('.toggle-icon');
    const isExpanded = content.classList.contains('expanded');
    if (isExpanded) {
      content.classList.remove('expanded');
      icon.classList.remove('rotated');
    } else {
      content.classList.add('expanded');
      icon.classList.add('rotated');
    }
  }
});

// 멤버 태그 클릭 효과
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('member-tag')) {
    if (navigator.vibrate) navigator.vibrate(50);
    e.target.style.transform = 'scale(1.1)';
    setTimeout(() => { e.target.style.transform = ''; }, 200);
  }
});

// 콘티/유튜브 입력 저장 및 미리보기
document.addEventListener('input', function(e) {
  // 콘티
  if (e.target.classList.contains('setlist-area')) {
    localStorage.setItem(e.target.id, e.target.value);
  }
  // 유튜브
  if (e.target.classList.contains('youtube-input')) {
    const url = e.target.value;
    const id = e.target.id.replace('youtube-', '');
    const preview = document.getElementById(`youtube-preview-${id}`);
    if (url && isValidYouTubeUrl(url)) {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        preview.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" 
                 style="width: 60px; height: 45px; border-radius: 4px;">
            <div>
              <div style="font-weight: 600; color: #333;">유튜브 영상 연결됨</div>
              <div style="font-size: 0.75rem; color: #666;">클릭하여 새 탭에서 열기</div>
            </div>
          </div>
        `;
        preview.classList.add('show');
        preview.style.cursor = 'pointer';
        preview.onclick = () => window.open(url, '_blank');
      }
    } else {
      preview.classList.remove('show');
      preview.onclick = null;
    }
    localStorage.setItem(e.target.id, url);
  }
});

// 콘티/유튜브 저장된 값 불러오기
function loadSavedData() {
  document.querySelectorAll('.setlist-area').forEach(textarea => {
    const saved = localStorage.getItem(textarea.id);
    if (saved) textarea.value = saved;
  });
  document.querySelectorAll('.youtube-input').forEach(input => {
    const saved = localStorage.getItem(input.id);
    if (saved) {
      input.value = saved;
      const id = input.id.replace('youtube-', '');
      const preview = document.getElementById(`youtube-preview-${id}`);
      if (isValidYouTubeUrl(saved)) {
        const videoId = extractYouTubeVideoId(saved);
        if (videoId) {
          preview.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" 
                   style="width: 60px; height: 45px; border-radius: 4px;">
              <div>
                <div style="font-weight: 600; color: #333;">유튜브 영상 연결됨</div>
                <div style="font-size: 0.75rem; color: #666;">클릭하여 새 탭에서 열기</div>
              </div>
            </div>
          `;
          preview.classList.add('show');
          preview.style.cursor = 'pointer';
          preview.onclick = () => window.open(saved, '_blank');
        }
      }
    }
  });
}

// 유튜브 URL 유효성 검사
function isValidYouTubeUrl(url) {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return pattern.test(url);
}
function extractYouTubeVideoId(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}
