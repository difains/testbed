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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const prayerRef = db.ref('prayerList');
const setlistRef = db.ref('setlists');
const youtubeRef = db.ref('youtubeLinks');

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;

function updateMonthTitle() {
  document.getElementById('monthTitle').textContent = `${currentYear}년 ${currentMonth}월`;
}
updateMonthTitle();

// 오늘 날짜를 yyyy-mm-dd로 반환
function getTodayStr() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 월 이동 버튼
document.getElementById('prevMonthBtn').onclick = () => {
  currentMonth--;
  if (currentMonth < 1) {
    currentMonth = 12;
    currentYear--;
  }
  updateMonthTitle();
  setDatePickerToFridays();
  fetchAndRenderList();
};
document.getElementById('nextMonthBtn').onclick = () => {
  currentMonth++;
  if (currentMonth > 12) {
    currentMonth = 1;
    currentYear++;
  }
  updateMonthTitle();
  setDatePickerToFridays();
  fetchAndRenderList();
};

// 금요일만 선택 가능하게 min/max 설정 + 오늘 날짜 기본값
function setDatePickerToFridays() {
  const inputDate = document.getElementById('inputDate');
  const min = new Date(currentYear, currentMonth - 1, 1);
  const max = new Date(currentYear, currentMonth, 0);
  inputDate.min = min.toISOString().slice(0, 10);
  inputDate.max = max.toISOString().slice(0, 10);

  // 오늘이 현재 월에 속하면 오늘로, 아니면 그 달의 첫째 금요일로
  const todayStr = getTodayStr();
  if (
    Number(todayStr.slice(0, 4)) === currentYear &&
    Number(todayStr.slice(5, 7)) === currentMonth
  ) {
    inputDate.value = todayStr;
  } else {
    // 첫째 금요일
    let d = new Date(currentYear, currentMonth - 1, 1);
    while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
    inputDate.value = d.toISOString().slice(0, 10);
  }
}
setDatePickerToFridays();

document.getElementById('inputDate').addEventListener('change', function() {
  const val = this.value;
  if (val) {
    const d = new Date(val);
    if (d.getDay() !== 5) {
      alert('매월 금요일만 선택이 가능합니다');
      this.value = '';
    }
  }
});

// 추가 버튼
document.getElementById('addBtn').onclick = function() {
  const date = document.getElementById('inputDate').value;
  const role = document.getElementById('inputRole').value;
  const name = document.getElementById('inputName').value.trim();

  if (!date || !role || !name) {
    alert('날짜, 역할, 이름을 모두 입력해 주세요!');
    return;
  }
  const selectedDate = new Date(date);
  if (selectedDate.getDay() !== 5) {
    alert('매월 금요일만 선택이 가능합니다');
    return;
  }
  prayerRef.push({ date, role, name }, (err) => {
    if (!err) {
      setDatePickerToFridays();
      document.getElementById('inputRole').value = '';
      document.getElementById('inputName').value = '';
      fetchAndRenderList();
    }
  });
};

function fetchAndRenderList() {
  prayerRef.off();
  prayerRef.on('value', (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById('schedule-container');
    container.innerHTML = '';
    if (!data) {
      container.innerHTML = '<div style="color:#888;text-align:center;">데이터가 없습니다.</div>';
      return;
    }
    // 날짜별 역할별 그룹핑, 키도 저장
    const grouped = {};
    Object.entries(data).forEach(([key, item]) => {
      const d = new Date(item.date);
      if (
        d.getFullYear() === currentYear &&
        d.getMonth() + 1 === currentMonth
      ) {
        if (!grouped[item.date]) grouped[item.date] = [];
        grouped[item.date].push({ ...item, _key: key });
      }
    });
    const dates = Object.keys(grouped).sort();
    if (dates.length === 0) {
      container.innerHTML = '<div style="color:#888;text-align:center;">데이터가 없습니다.</div>';
      return;
    }

    // 콘티/유튜브 데이터 불러오기
    setlistRef.once('value', setlistSnap => {
      const setlists = setlistSnap.val() || {};
      youtubeRef.once('value', youtubeSnap => {
        const youtubes = youtubeSnap.val() || {};

        dates.forEach((date) => {
          const dateIndex = date.replace(/-/g,'');
          const setlistValue = setlists[date] || '';
          const youtubeValue = youtubes[date] || '';
          const roles = {
            '찬양인도': [],
            '싱어': [],
            '메인건반': [],
            '세컨건반': [],
            '드럼': [],
            '베이스': [],
            '엔지니어': []
          };
          grouped[date].forEach(item => {
            if (roles[item.role]) roles[item.role].push({ name: item.name, key: item._key });
          });
          const itemDiv = document.createElement('div');
          itemDiv.className = 'schedule-item';
          itemDiv.innerHTML = `
            <div class="date-header" data-index="${dateIndex}">
              <div class="date">${date}</div>
              <div class="event-type">금요기도회</div>
              <div class="toggle-icon">▼</div>
            </div>
            <div class="content" id="content-${dateIndex}">
              <div class="leader-section">
                <div class="leader-title">찬양인도</div>
                <div class="leader-name ${roles['찬양인도'].length ? '' : 'leader-empty'}">
                  ${roles['찬양인도'].map(obj => `
                    <span class="member-tag">${obj.name}
                      <button class="delete-btn" data-key="${obj.key}" data-role="찬양인도" data-name="${obj.name}">삭제</button>
                    </span>
                  `).join('') || '미정'}
                </div>
              </div>
              <div class="roles-grid">
                <div class="role-group">
                  <div class="role-title">🎤 싱어</div>
                  <div class="member-list">
                    ${roles['싱어'].map(obj => `
                      <span class="member-tag">${obj.name}
                        <button class="delete-btn" data-key="${obj.key}" data-role="싱어" data-name="${obj.name}">삭제</button>
                      </span>
                    `).join('') || '<span style="color:#bbb;">없음</span>'}
                  </div>
                </div>
                <div class="role-group">
                  <div class="role-title">🎹 악기</div>
                  <div class="member-list">
                    ${roles['메인건반'].map(obj => `
                      <span class="member-tag">${obj.name} (메인건반)
                        <button class="delete-btn" data-key="${obj.key}" data-role="메인건반" data-name="${obj.name}">삭제</button>
                      </span>
                    `).join('')}
                    ${roles['세컨건반'].map(obj => `
                      <span class="member-tag">${obj.name} (세컨건반)
                        <button class="delete-btn" data-key="${obj.key}" data-role="세컨건반" data-name="${obj.name}">삭제</button>
                      </span>
                    `).join('')}
                    ${roles['드럼'].map(obj => `
                      <span class="member-tag">${obj.name} (드럼)
                        <button class="delete-btn" data-key="${obj.key}" data-role="드럼" data-name="${obj.name}">삭제</button>
                      </span>
                    `).join('')}
                    ${roles['베이스'].map(obj => `
                      <span class="member-tag">${obj.name} (베이스)
                        <button class="delete-btn" data-key="${obj.key}" data-role="베이스" data-name="${obj.name}">삭제</button>
                      </span>
                    `).join('')}
                    ${(!roles['메인건반'].length && !roles['세컨건반'].length && !roles['드럼'].length && !roles['베이스'].length) ? '<span style="color:#bbb;">없음</span>' : ''}
                  </div>
                </div>
                <div class="role-group">
                  <div class="role-title">🔧 엔지니어</div>
                  <div class="member-list">
                    ${roles['엔지니어'].map(obj => `
                      <span class="member-tag">${obj.name}
                        <button class="delete-btn" data-key="${obj.key}" data-role="엔지니어" data-name="${obj.name}">삭제</button>
                      </span>
                    `).join('') || '<span style="color:#bbb;">없음</span>'}
                  </div>
                </div>
              </div>
              <div class="additional-info">
                <div class="info-section">
                  <div class="info-title">📋 콘티 리스트</div>
                  <textarea class="setlist-area" placeholder="찬양 순서를 입력하세요..." id="setlist-${dateIndex}" data-date="${date}">${setlistValue}</textarea>
                  <button class="save-btn" data-type="setlist" data-date="${date}">저장</button>
                </div>
                <div class="info-section">
                  <div class="info-title">🎬 참고 유튜브</div>
                  <input type="url" class="youtube-input" placeholder="유튜브 링크를 입력하세요" id="youtube-${dateIndex}" data-date="${date}" value="${youtubeValue}">
                  <button class="save-btn" data-type="youtube" data-date="${date}">저장</button>
                  <div class="youtube-preview" id="youtube-preview-${dateIndex}">
                    <span>🔗 링크가 입력되면 미리보기가 표시됩니다</span>
                  </div>
                </div>
              </div>
            </div>
          `;
          container.appendChild(itemDiv);

          // 유튜브 미리보기
          const youtubeInput = itemDiv.querySelector('.youtube-input');
          if (youtubeInput && youtubeInput.value) {
            handleYoutubePreview(youtubeInput);
          }
        });
        setTimeout(() => {
          // 첫 번째 자동 펼침
          if (dates.length > 0) {
            const firstIndex = dates[0].replace(/-/g,'');
            const firstContent = document.getElementById(`content-${firstIndex}`);
            const firstIcon = document.querySelector(`.date-header[data-index="${firstIndex}"] .toggle-icon`);
            if (firstContent && firstIcon) {
              firstContent.classList.add('expanded');
              firstIcon.classList.add('rotated');
            }
          }
        }, 200);
      });
    });
  });
}
fetchAndRenderList();

document.getElementById('expand-all').onclick = () => {
  document.querySelectorAll('.content').forEach(c => c.classList.add('expanded'));
  document.querySelectorAll('.toggle-icon').forEach(i => i.classList.add('rotated'));
};
document.getElementById('collapse-all').onclick = () => {
  document.querySelectorAll('.content').forEach(c => c.classList.remove('expanded'));
  document.querySelectorAll('.toggle-icon').forEach(i => i.classList.remove('rotated'));
};

document.addEventListener('click', function(e) {
  if (e.target.closest('.date-header')) {
    const header = e.target.closest('.date-header');
    const dateIndex = header.getAttribute('data-index');
    const content = document.getElementById(`content-${dateIndex}`);
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

// 삭제 버튼 이벤트
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('delete-btn')) {
    const key = e.target.getAttribute('data-key');
    const role = e.target.getAttribute('data-role');
    const name = e.target.getAttribute('data-name');
    if (confirm(`정말로 ${name}(${role})을(를) 삭제하시겠습니까?`)) {
      prayerRef.child(key).remove();
    }
  }
});

// 콘티/유튜브 저장 버튼 이벤트
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('save-btn')) {
    const type = e.target.getAttribute('data-type');
    const date = e.target.getAttribute('data-date');
    if (type === 'setlist') {
      const textarea = document.querySelector(`.setlist-area[data-date="${date}"]`);
      if (textarea) {
        setlistRef.child(date).set(textarea.value || '');
        alert('콘티 리스트가 저장되었습니다.');
      }
    } else if (type === 'youtube') {
      const input = document.querySelector(`.youtube-input[data-date="${date}"]`);
      if (input) {
        youtubeRef.child(date).set(input.value || '');
        alert('유튜브 링크가 저장되었습니다.');
        handleYoutubePreview(input);
      }
    }
  }
});

document.addEventListener('input', function(e) {
  if (e.target.classList.contains('youtube-input')) {
    handleYoutubePreview(e.target);
  }
});

function handleYoutubePreview(input) {
  const url = input.value;
  const id = input.id.replace('youtube-', '');
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
    preview.innerHTML = '<span>🔗 링크가 입력되면 미리보기가 표시됩니다</span>';
  }
}

function isValidYouTubeUrl(url) {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return pattern.test(url);
}
function extractYouTubeVideoId(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}
