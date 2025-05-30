// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyCUIxNXpcXpBS2axvk9s9gTh00EvGOKiSI",
    authDomain: "seoul-central-youth-system.firebaseapp.com",
    databaseURL: "https://seoul-central-youth-system-default-rtdb.firebaseio.com",
    projectId: "seoul-central-youth-system",
    storageBucket: "seoul-central-youth-system.firebasestorage.app",
    messagingSenderId: "686027953128",
    appId: "1:686027953128:web:4c1b931bab361c01770a5d",
    measurementId: "G-ZY7ZHGC4MP"
};

// Firebase 초기화 (v8 호환 방식 사용)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 전역 변수
let currentUser = null;
let currentScreen = 'attendance';
let allStudents = {};
let allTeachers = {};
let currentModalPerson = null;
let currentModalType = null;

// 로그인 함수
function login() {
    const id = document.getElementById('loginId').value;
    const password = document.getElementById('loginPassword').value;
    
    if (id === 'admin' && password === '1234') {
        currentUser = 'admin';
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('mainScreens').classList.remove('hidden');
        showScreen('attendance');
        loadAllData();
    } else {
        alert('아이디 또는 패스워드가 올바르지 않습니다.');
    }
}

// 로그아웃 함수
function logout() {
    currentUser = null;
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('mainScreens').classList.add('hidden');
    document.getElementById('navMenu').classList.remove('active');
    document.getElementById('loginId').value = '';
    document.getElementById('loginPassword').value = '';
}

// 모든 데이터 로드
function loadAllData() {
    loadStudents();
    loadTeachers();
}

// 화면 전환 함수
function showScreen(screenName) {
    // 모든 화면 숨기기
    const screens = document.querySelectorAll('#mainScreens .screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    // 선택된 화면 보이기
    document.getElementById(screenName + 'Screen').classList.add('active');
    
    // 페이지 제목 변경
    const titles = {
        'attendance': '출석체크',
        'dashboard': '대시보드',
        'studentReg': '학생 등록',
        'teacherReg': '선생님 등록',
        'studentList': '학생 리스트',
        'teacherList': '선생님 리스트'
    };
    document.getElementById('pageTitle').textContent = titles[screenName];
    
    // 메뉴 닫기
    document.getElementById('navMenu').classList.remove('active');
    
    currentScreen = screenName;
    
    // 화면별 초기화
    if (screenName === 'attendance') {
        setLastSundayDate();
        setLastSundayDate('teacherAttendanceDate');
    } else if (screenName === 'dashboard') {
        setLastSundayDate('dashboardDate');
        loadDashboard();
    } else if (screenName === 'studentList') {
        displayAllStudents();
    } else if (screenName === 'teacherList') {
        displayAllTeachers();
    }
}

// 햄버거 메뉴 토글
function toggleMenu() {
    document.getElementById('navMenu').classList.toggle('active');
}

// 탭 전환
function switchTab(tabName) {
    // 탭 버튼 활성화
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // 탭 컨텐츠 전환
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// 가장 최근 일요일 날짜 설정
function setLastSundayDate(elementId = 'attendanceDate') {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    
    let lastSunday;
    if (dayOfWeek === 0) {
        // 오늘이 일요일이면 오늘 날짜
        lastSunday = new Date(today);
    } else {
        // 오늘이 일요일이 아니면 지난 일요일
        lastSunday = new Date(today);
        lastSunday.setDate(today.getDate() - dayOfWeek);
    }
    
    const dateString = lastSunday.toISOString().split('T')[0];
    const element = document.getElementById(elementId);
    if (element) {
        element.value = dateString;
    }
}

// 일요일 체크 함수
function isSunday(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.getDay() === 0;
}

// 학생 목록 로드
function loadStudents() {
    database.ref('students').on('value', (snapshot) => {
        allStudents = snapshot.val() || {};
        console.log('Students loaded:', allStudents);
        displayStudentRegList(allStudents);
        if (currentScreen === 'studentList') {
            displayAllStudents();
        }
    });
}

// 선생님 목록 로드
function loadTeachers() {
    database.ref('teachers').on('value', (snapshot) => {
        allTeachers = snapshot.val() || {};
        console.log('Teachers loaded:', allTeachers);
        displayTeacherRegList(allTeachers);
        if (currentScreen === 'teacherList') {
            displayAllTeachers();
        }
    });
}

// 학생 등록 목록 표시
function displayStudentRegList(students) {
    const listContainer = document.getElementById('studentRegList');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    Object.values(students).forEach(student => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <h4>${student.name}</h4>
            <p>학년: ${student.grade || '미설정'}</p>
            <p>전화번호: ${student.phone || '미설정'}</p>
            <p>등록일: ${student.registrationDate || '미설정'}</p>
        `;
        listContainer.appendChild(div);
    });
}

// 선생님 등록 목록 표시
function displayTeacherRegList(teachers) {
    const listContainer = document.getElementById('teacherRegList');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    Object.values(teachers).forEach(teacher => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <h4>${teacher.name}</h4>
            <p>전화번호: ${teacher.phone || '미설정'}</p>
            <p>소속지회: ${teacher.district || '미설정'}</p>
            <p>시작일: ${teacher.startDate || '미설정'}</p>
        `;
        listContainer.appendChild(div);
    });
}

// 전체 학생 목록 표시
function displayAllStudents() {
    const container = document.getElementById('studentListContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.values(allStudents).forEach(student => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <h4>${student.name}</h4>
            <p>학년: ${student.grade || '미설정'}</p>
            <p>전화번호: ${student.phone || '미설정'}</p>
            <p>등록일: ${student.registrationDate || '미설정'}</p>
            <button class="view-attendance" onclick="openAttendanceModal('${student.id}', 'student', '${student.name}')">출석내역</button>
        `;
        container.appendChild(div);
    });
}

// 전체 선생님 목록 표시
function displayAllTeachers() {
    const container = document.getElementById('teacherListContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.values(allTeachers).forEach(teacher => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <h4>${teacher.name}</h4>
            <p>전화번호: ${teacher.phone || '미설정'}</p>
            <p>소속지회: ${teacher.district || '미설정'}</p>
            <p>시작일: ${teacher.startDate || '미설정'}</p>
            <button class="view-attendance" onclick="openAttendanceModal('${teacher.id}', 'teacher', '${teacher.name}')">출석내역</button>
        `;
        container.appendChild(div);
    });
}

// 학생 검색
function searchStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const container = document.getElementById('studentListContainer');
    container.innerHTML = '';
    
    const filteredStudents = Object.values(allStudents).filter(student => 
        student.name.toLowerCase().includes(searchTerm)
    );
    
    filteredStudents.forEach(student => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <h4>${student.name}</h4>
            <p>학년: ${student.grade || '미설정'}</p>
            <p>전화번호: ${student.phone || '미설정'}</p>
            <p>등록일: ${student.registrationDate || '미설정'}</p>
            <button class="view-attendance" onclick="openAttendanceModal('${student.id}', 'student', '${student.name}')">출석내역</button>
        `;
        container.appendChild(div);
    });
}

// 선생님 검색
function searchTeachers() {
    const searchTerm = document.getElementById('teacherSearch').value.toLowerCase();
    const container = document.getElementById('teacherListContainer');
    container.innerHTML = '';
    
    const filteredTeachers = Object.values(allTeachers).filter(teacher => 
        teacher.name.toLowerCase().includes(searchTerm)
    );
    
    filteredTeachers.forEach(teacher => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <h4>${teacher.name}</h4>
            <p>전화번호: ${teacher.phone || '미설정'}</p>
            <p>소속지회: ${teacher.district || '미설정'}</p>
            <p>시작일: ${teacher.startDate || '미설정'}</p>
            <button class="view-attendance" onclick="openAttendanceModal('${teacher.id}', 'teacher', '${teacher.name}')">출석내역</button>
        `;
        container.appendChild(div);
    });
}

// 출석 내역 모달 열기
function openAttendanceModal(personId, type, name) {
    currentModalPerson = personId;
    currentModalType = type;
    
    document.getElementById('modalTitle').textContent = `${name} 출석 내역`;
    document.getElementById('attendanceModal').style.display = 'block';
    setLastSundayDate('modalDate');
    loadPersonalAttendance();
}

// 모달 닫기
function closeModal() {
    document.getElementById('attendanceModal').style.display = 'none';
    currentModalPerson = null;
    currentModalType = null;
}

// 개인 출석 내역 로드
function loadPersonalAttendance() {
    if (!currentModalPerson || !currentModalType) return;
    
    const period = document.getElementById('modalPeriod').value;
    const date = document.getElementById('modalDate').value;
    
    if (!date) {
        alert('날짜를 선택해주세요.');
        return;
    }
    
    const dates = getDateRange(period, date);
    const path = currentModalType === 'student' ? 'attendance/students' : 'attendance/teachers';
    
    database.ref(path).once('value', (snapshot) => {
        const attendanceData = snapshot.val() || {};
        console.log('Personal attendance data:', attendanceData);
        displayPersonalAttendance(attendanceData, dates);
    });
}

// 개인 출석 내역 표시
function displayPersonalAttendance(attendanceData, dates) {
    const container = document.getElementById('modalContent');
    container.innerHTML = '';
    
    if (dates.length === 0) {
        container.innerHTML = '<p>해당 기간에 주일 데이터가 없습니다.</p>';
        return;
    }
    
    dates.forEach(date => {
        const dayData = attendanceData[date];
        const status = dayData && dayData[currentModalPerson] ? dayData[currentModalPerson] : '미체크';
        
        const div = document.createElement('div');
        div.className = 'attendance-record';
        div.innerHTML = `
            <span class="attendance-date">${date} (주일)</span>
            <span class="attendance-status ${status}">${
                status === 'present' ? '출석' : 
                status === 'absent' ? '결석' : '미체크'
            }</span>
        `;
        container.appendChild(div);
    });
}

// 대시보드 로드 (수정된 버전)
function loadDashboard() {
    const period = document.getElementById('dashboardPeriod').value;
    const date = document.getElementById('dashboardDate').value;
    
    if (!date) {
        alert('날짜를 선택해주세요.');
        return;
    }
    
    const container = document.getElementById('dashboardContent');
    container.innerHTML = '<div class="dashboard-card"><h3>데이터를 불러오는 중...</h3></div>';
    
    console.log('Loading dashboard for period:', period, 'date:', date);
    
    // 학생 데이터와 출석 데이터를 동시에 로드
    Promise.all([
        database.ref('students').once('value'),
        database.ref('attendance/students').once('value'),
        database.ref('teachers').once('value'),
        database.ref('attendance/teachers').once('value')
    ]).then(([studentsSnapshot, attendanceSnapshot, teachersSnapshot, teacherAttendanceSnapshot]) => {
        const students = studentsSnapshot.val() || {};
        const attendance = attendanceSnapshot.val() || {};
        const teachers = teachersSnapshot.val() || {};
        const teacherAttendance = teacherAttendanceSnapshot.val() || {};
        
        console.log('Dashboard data loaded:', {
            students: Object.keys(students).length,
            attendance: Object.keys(attendance).length,
            teachers: Object.keys(teachers).length,
            teacherAttendance: Object.keys(teacherAttendance).length
        });
        
        displayDashboard(students, attendance, teachers, teacherAttendance, period, date);
    }).catch(error => {
        container.innerHTML = '<div class="dashboard-card"><h3>데이터 로드 중 오류가 발생했습니다.</h3></div>';
        console.error('Dashboard load error:', error);
    });
}

// 대시보드 표시 함수 (수정된 버전)
function displayDashboard(students, attendance, teachers, teacherAttendance, period, selectedDate) {
    const container = document.getElementById('dashboardContent');
    
    // 날짜 범위 계산 (일요일만)
    const dates = getDateRange(period, selectedDate);
    console.log('Sunday date range:', dates);
    
    // 전체 출석 통계 계산
    const totalStats = calculateTotalStats(students, attendance, dates);
    const teacherStats = calculateTeacherStats(teachers, teacherAttendance, dates);
    
    // 학년별 통계 계산
    const gradeStats = calculateGradeStats(students, attendance, dates);
    
    console.log('Statistics calculated:', { totalStats, teacherStats, gradeStats });
    
    container.innerHTML = `
        <div class="dashboard-card">
            <h3>전체 출석 현황 (${period === 'year' ? '년별' : period === 'month' ? '월별' : '주일별'})</h3>
            <div class="dashboard-stats">
                <div class="stat-item">
                    <div class="stat-number">${totalStats.present}</div>
                    <div class="stat-label">출석</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${totalStats.absent}</div>
                    <div class="stat-label">결석</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${totalStats.average.toFixed(1)}</div>
                    <div class="stat-label">평균 출석</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${totalStats.rate.toFixed(1)}%</div>
                    <div class="stat-label">출석률</div>
                </div>
            </div>
        </div>
        
        <div class="dashboard-card">
            <h3>학년별 출석 현황</h3>
            ${generateGradeStatsHTML(gradeStats)}
        </div>
        
        <div class="dashboard-card">
            <h3>선생님 출석 현황</h3>
            <div class="dashboard-stats">
                <div class="stat-item">
                    <div class="stat-number">${teacherStats.present}</div>
                    <div class="stat-label">출석</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${teacherStats.absent}</div>
                    <div class="stat-label">결석</div>
                </div>
            </div>
        </div>
        
        <div class="dashboard-card">
            <h3>조회 정보</h3>
            <p>조회 주일 수: ${dates.length}주</p>
            <p>조회 주일: ${dates.map(date => date + ' (주일)').join(', ')}</p>
        </div>
    `;
}

// 날짜 범위 계산 (일요일만) - 수정된 버전
function getDateRange(period, selectedDate) {
    const date = new Date(selectedDate + 'T00:00:00');
    const dates = [];
    
    if (period === 'week') {
        // 선택된 날짜가 포함된 주의 일요일만
        const dayOfWeek = date.getDay();
        const sunday = new Date(date);
        
        if (dayOfWeek === 0) {
            // 선택된 날짜가 일요일이면 그 날짜
            dates.push(sunday.toISOString().split('T')[0]);
        } else {
            // 선택된 날짜가 일요일이 아니면 그 주의 일요일
            sunday.setDate(date.getDate() - dayOfWeek);
            dates.push(sunday.toISOString().split('T')[0]);
        }
    } else if (period === 'month') {
        // 선택된 월의 모든 일요일
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            if (d.getDay() === 0) {
                dates.push(d.toISOString().split('T')[0]);
            }
        }
    } else if (period === 'year') {
        // 선택된 년도의 모든 일요일
        const year = date.getFullYear();
        for (let month = 0; month < 12; month++) {
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            
            for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
                if (d.getDay() === 0) {
                    dates.push(d.toISOString().split('T')[0]);
                }
            }
        }
    }
    
    return dates;
}

// 전체 출석 통계 계산 (수정된 버전)
function calculateTotalStats(students, attendance, dates) {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalDays = 0;
    
    dates.forEach(date => {
        if (attendance[date]) {
            totalDays++;
            const dayAttendance = attendance[date];
            Object.values(dayAttendance).forEach(status => {
                if (status === 'present') totalPresent++;
                else if (status === 'absent') totalAbsent++;
            });
        }
    });
    
    const total = totalPresent + totalAbsent;
    const average = totalDays > 0 ? totalPresent / totalDays : 0;
    const rate = total > 0 ? (totalPresent / total) * 100 : 0;
    
    return {
        present: totalPresent,
        absent: totalAbsent,
        average: average,
        rate: rate
    };
}

// 선생님 출석 통계 계산 (수정된 버전)
function calculateTeacherStats(teachers, teacherAttendance, dates) {
    let totalPresent = 0;
    let totalAbsent = 0;
    
    dates.forEach(date => {
        if (teacherAttendance[date]) {
            const dayAttendance = teacherAttendance[date];
            Object.values(dayAttendance).forEach(status => {
                if (status === 'present') totalPresent++;
                else if (status === 'absent') totalAbsent++;
            });
        }
    });
    
    return {
        present: totalPresent,
        absent: totalAbsent
    };
}

// 학년별 통계 계산 (수정된 버전)
function calculateGradeStats(students, attendance, dates) {
    const grades = ['중1', '중2', '중3', '고1', '고2', '고3'];
    const gradeStats = {};
    
    grades.forEach(grade => {
        gradeStats[grade] = { present: 0, absent: 0 };
    });
    
    dates.forEach(date => {
        if (attendance[date]) {
            const dayAttendance = attendance[date];
            Object.entries(dayAttendance).forEach(([studentId, status]) => {
                // 학생 ID로 학생 정보 찾기
                const student = Object.values(students).find(s => s.id === studentId);
                if (student && student.grade && gradeStats[student.grade]) {
                    if (status === 'present') {
                        gradeStats[student.grade].present++;
                    } else if (status === 'absent') {
                        gradeStats[student.grade].absent++;
                    }
                }
            });
        }
    });
    
    return gradeStats;
}

// 학년별 통계 HTML 생성 (수정된 버전)
function generateGradeStatsHTML(gradeStats) {
    let html = '';
    let hasData = false;
    
    Object.entries(gradeStats).forEach(([grade, stats]) => {
        const total = stats.present + stats.absent;
        if (total > 0) {
            hasData = true;
            const rate = ((stats.present / total) * 100).toFixed(1);
            
            html += `
                <div style="margin-bottom: 10px; padding: 10px; background-color: #555; border-radius: 5px;">
                    <div style="color: #ffd700; font-weight: bold; margin-bottom: 5px;">${grade}</div>
                    <div style="display: flex; gap: 10px; font-size: 14px;">
                        <span>출석: ${stats.present}</span>
                        <span>결석: ${stats.absent}</span>
                        <span>출석률: ${rate}%</span>
                    </div>
                </div>
            `;
        }
    });
    
    return hasData ? html : '<p>해당 기간에 주일 출석 데이터가 없습니다.</p>';
}

// 출석 데이터 로드
function loadAttendanceData() {
    const date = document.getElementById('attendanceDate').value;
    if (!date) {
        alert('날짜를 선택해주세요.');
        return;
    }
    
    // 일요일 체크
    if (!isSunday(date)) {
        alert('주일만 체크가 가능합니다.');
        return;
    }
    
    database.ref('students').once('value', (snapshot) => {
        const students = snapshot.val() || {};
        displayAttendanceList(students, date);
        
        // 기존 출석 데이터 로드하여 체크 상태 복원
        database.ref(`attendance/students/${date}`).once('value', (attendanceSnapshot) => {
            const existingAttendance = attendanceSnapshot.val() || {};
            restoreAttendanceState(existingAttendance, 'student');
        });
    });
}

// 선생님 출석 데이터 로드
function loadTeacherAttendanceData() {
    const date = document.getElementById('teacherAttendanceDate').value;
    if (!date) {
        alert('날짜를 선택해주세요.');
        return;
    }
    
    // 일요일 체크
    if (!isSunday(date)) {
        alert('주일만 체크가 가능합니다.');
        return;
    }
    
    database.ref('teachers').once('value', (snapshot) => {
        const teachers = snapshot.val() || {};
        displayTeacherAttendanceList(teachers, date);
        
        // 기존 출석 데이터 로드하여 체크 상태 복원
        database.ref(`attendance/teachers/${date}`).once('value', (attendanceSnapshot) => {
            const existingAttendance = attendanceSnapshot.val() || {};
            restoreAttendanceState(existingAttendance, 'teacher');
        });
    });
}

// 기존 출석 상태 복원
function restoreAttendanceState(attendanceData, type) {
    const prefix = type === 'student' ? 'attendance_' : 'teacher_attendance_';
    
    Object.entries(attendanceData).forEach(([personId, status]) => {
        const radioName = prefix + personId;
        const radio = document.querySelector(`input[name="${radioName}"][value="${status}"]`);
        if (radio) {
            radio.checked = true;
        }
    });
}

// 출석 목록 표시 (학생)
function displayAttendanceList(students, date) {
    const container = document.getElementById('studentAttendanceList');
    container.innerHTML = '';
    
    // 학년별 그룹핑
    const grades = ['중1', '중2', '중3', '고1', '고2', '고3'];
    
    grades.forEach(grade => {
        const gradeStudents = Object.values(students).filter(s => s.grade === grade);
        if (gradeStudents.length === 0) return;
        
        const gradeDiv = document.createElement('div');
        gradeDiv.className = 'grade-group';
        
        const header = document.createElement('div');
        header.className = 'grade-header';
        header.textContent = grade;
        gradeDiv.appendChild(header);
        
        gradeStudents.forEach(student => {
            const studentDiv = document.createElement('div');
            studentDiv.className = 'student-item';
            studentDiv.innerHTML = `
                <div class="student-name">${student.name}</div>
                <div class="attendance-options">
                    <label>
                        <input type="radio" name="attendance_${student.id}" value="present">
                        출석
                    </label>
                    <label>
                        <input type="radio" name="attendance_${student.id}" value="absent">
                        결석
                    </label>
                </div>
            `;
            gradeDiv.appendChild(studentDiv);
        });
        
        container.appendChild(gradeDiv);
    });
}

// 선생님 출석 목록 표시
function displayTeacherAttendanceList(teachers, date) {
    const container = document.getElementById('teacherAttendanceList');
    container.innerHTML = '';
    
    const teacherDiv = document.createElement('div');
    teacherDiv.className = 'grade-group';
    
    const header = document.createElement('div');
    header.className = 'grade-header';
    header.textContent = '선생님';
    teacherDiv.appendChild(header);
    
    Object.values(teachers).forEach(teacher => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'student-item';
        itemDiv.innerHTML = `
            <div class="student-name">${teacher.name}</div>
            <div class="attendance-options">
                <label>
                    <input type="radio" name="teacher_attendance_${teacher.id}" value="present">
                    출석
                </label>
                <label>
                    <input type="radio" name="teacher_attendance_${teacher.id}" value="absent">
                    결석
                </label>
            </div>
        `;
        teacherDiv.appendChild(itemDiv);
    });
    
    container.appendChild(teacherDiv);
}

// 출석 저장 (수정된 버전)
function saveAttendance(type) {
    const date = type === 'student' ? 
        document.getElementById('attendanceDate').value : 
        document.getElementById('teacherAttendanceDate').value;
    
    if (!date) {
        alert('날짜를 선택해주세요.');
        return;
    }
    
    // 일요일 체크
    if (!isSunday(date)) {
        alert('주일만 체크가 가능합니다.');
        return;
    }
    
    const prefix = type === 'student' ? 'attendance_' : 'teacher_attendance_';
    const radios = document.querySelectorAll(`input[name^="${prefix}"]`);
    const attendanceData = {};
    
    radios.forEach(radio => {
        if (radio.checked) {
            const id = radio.name.replace(prefix, '');
            attendanceData[id] = radio.value;
        }
    });
    
    if (Object.keys(attendanceData).length === 0) {
        alert('출석 정보를 선택해주세요.');
        return;
    }
    
    const path = type === 'student' ? 'attendance/students' : 'attendance/teachers';
    
    console.log('Saving attendance:', { path, date, attendanceData });
    
    database.ref(`${path}/${date}`).set(attendanceData)
        .then(() => {
            alert('출석 정보가 저장되었습니다.');
            console.log('Attendance saved successfully');
            
            // 대시보드가 현재 화면이면 자동 새로고침
            if (currentScreen === 'dashboard') {
                setTimeout(() => {
                    loadDashboard();
                }, 500);
            }
        })
        .catch(error => {
            alert('저장 중 오류가 발생했습니다: ' + error.message);
            console.error('Save error:', error);
        });
}

// DOM 로드 완료 후 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    // 학생 등록 폼
    document.getElementById('studentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const studentData = {
            name: formData.get('name'),
            grade: formData.get('grade'),
            infantBaptism: formData.get('infantBaptism') === 'on',
            baptism: formData.get('baptism') === 'on',
            confirmation: formData.get('confirmation') === 'on',
            phone: formData.get('phone'),
            fatherName: formData.get('fatherName'),
            motherName: formData.get('motherName'),
            parentPhone: formData.get('parentPhone'),
            registrationDate: formData.get('registrationDate'),
            id: Date.now().toString()
        };
        
        database.ref('students/' + studentData.id).set(studentData)
            .then(() => {
                alert('학생이 등록되었습니다.');
                e.target.reset();
            })
            .catch(error => {
                alert('등록 중 오류가 발생했습니다: ' + error.message);
            });
    });

    // 선생님 등록 폼
    document.getElementById('teacherForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const teacherData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            district: formData.get('district'),
            startDate: formData.get('startDate'),
            id: Date.now().toString()
        };
        
        database.ref('teachers/' + teacherData.id).set(teacherData)
            .then(() => {
                alert('선생님이 등록되었습니다.');
                e.target.reset();
            })
            .catch(error => {
                alert('등록 중 오류가 발생했습니다: ' + error.message);
            });
    });

    // 초기 날짜 설정 (가장 최근 일요일)
    setLastSundayDate();
    setLastSundayDate('teacherAttendanceDate');
    setLastSundayDate('dashboardDate');
    setLastSundayDate('modalDate');
    
    // 검색 입력 필드에 엔터 키 이벤트 추가
    document.getElementById('studentSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchStudents();
        }
    });
    
    document.getElementById('teacherSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchTeachers();
        }
    });
});

// 메뉴 외부 클릭 시 닫기
document.addEventListener('click', function(e) {
    const navMenu = document.getElementById('navMenu');
    const hamburger = document.querySelector('.hamburger');
    const modal = document.getElementById('attendanceModal');
    
    if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        navMenu.classList.remove('active');
    }
    
    // 모달 외부 클릭 시 닫기
    if (e.target === modal) {
        closeModal();
    }
});
