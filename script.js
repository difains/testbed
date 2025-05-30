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

// 로그인 함수
function login() {
    const id = document.getElementById('loginId').value;
    const password = document.getElementById('loginPassword').value;
    
    if (id === 'admin' && password === '1234') {
        currentUser = 'admin';
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('mainScreens').classList.remove('hidden');
        showScreen('attendance');
        loadStudents();
        loadTeachers();
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
        'teacherReg': '선생님 등록'
    };
    document.getElementById('pageTitle').textContent = titles[screenName];
    
    // 메뉴 닫기
    document.getElementById('navMenu').classList.remove('active');
    
    currentScreen = screenName;
    
    // 화면별 초기화
    if (screenName === 'attendance') {
        setTodayDate();
    } else if (screenName === 'dashboard') {
        setTodayDate('dashboardDate');
        loadDashboard(); // 대시보드 진입 시 자동 로드
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

// 오늘 날짜 설정
function setTodayDate(elementId = 'attendanceDate') {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    document.getElementById(elementId).value = dateString;
}

// 대시보드 로드 (개선된 버전)
function loadDashboard() {
    const period = document.getElementById('dashboardPeriod').value;
    const date = document.getElementById('dashboardDate').value;
    
    if (!date) {
        alert('날짜를 선택해주세요.');
        return;
    }
    
    const container = document.getElementById('dashboardContent');
    container.innerHTML = '<div class="dashboard-card"><h3>데이터를 불러오는 중...</h3></div>';
    
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
        
        displayDashboard(students, attendance, teachers, teacherAttendance, period, date);
    }).catch(error => {
        container.innerHTML = '<div class="dashboard-card"><h3>데이터 로드 중 오류가 발생했습니다.</h3></div>';
        console.error('Dashboard load error:', error);
    });
}

// 대시보드 표시 함수
function displayDashboard(students, attendance, teachers, teacherAttendance, period, selectedDate) {
    const container = document.getElementById('dashboardContent');
    
    // 날짜 범위 계산
    const dates = getDateRange(period, selectedDate);
    
    // 전체 출석 통계 계산
    const totalStats = calculateTotalStats(students, attendance, dates);
    const teacherStats = calculateTeacherStats(teachers, teacherAttendance, dates);
    
    // 학년별 통계 계산
    const gradeStats = calculateGradeStats(students, attendance, dates);
    
    container.innerHTML = `
        <div class="dashboard-card">
            <h3>전체 출석 현황</h3>
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
    `;
}

// 날짜 범위 계산
function getDateRange(period, selectedDate) {
    const date = new Date(selectedDate);
    const dates = [];
    
    if (period === 'week') {
        // 선택된 날짜가 포함된 주의 일요일들만
        const sunday = new Date(date);
        sunday.setDate(date.getDate() - date.getDay());
        if (sunday.getDay() === 0) {
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

// 전체 출석 통계 계산
function calculateTotalStats(students, attendance, dates) {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalDays = 0;
    
    dates.forEach(date => {
        if (attendance[date]) {
            const dayAttendance = attendance[date];
            Object.values(dayAttendance).forEach(status => {
                if (status === 'present') totalPresent++;
                else if (status === 'absent') totalAbsent++;
            });
            totalDays++;
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

// 선생님 출석 통계 계산
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

// 학년별 통계 계산
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
                const student = Object.values(students).find(s => s.id === studentId);
                if (student && student.grade) {
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

// 학년별 통계 HTML 생성
function generateGradeStatsHTML(gradeStats) {
    let html = '';
    Object.entries(gradeStats).forEach(([grade, stats]) => {
        const total = stats.present + stats.absent;
        const rate = total > 0 ? ((stats.present / total) * 100).toFixed(1) : 0;
        
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
    });
    
    return html || '<p>데이터가 없습니다.</p>';
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
                loadStudents();
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
                loadTeachers();
            })
            .catch(error => {
                alert('등록 중 오류가 발생했습니다: ' + error.message);
            });
    });

    // 초기 날짜 설정
    setTodayDate();
    setTodayDate('teacherAttendanceDate');
    setTodayDate('dashboardDate');
});

// 학생 목록 로드
function loadStudents() {
    database.ref('students').on('value', (snapshot) => {
        const students = snapshot.val() || {};
        displayStudentList(students);
    });
}

// 선생님 목록 로드
function loadTeachers() {
    database.ref('teachers').on('value', (snapshot) => {
        const teachers = snapshot.val() || {};
        displayTeacherList(teachers);
    });
}

// 학생 목록 표시
function displayStudentList(students) {
    const listContainer = document.getElementById('studentList');
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

// 선생님 목록 표시
function displayTeacherList(teachers) {
    const listContainer = document.getElementById('teacherList');
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

// 출석 데이터 로드
function loadAttendanceData() {
    const date = document.getElementById('attendanceDate').value;
    if (!date) {
        alert('날짜를 선택해주세요.');
        return;
    }
    
    // 일요일 체크
    const selectedDate = new Date(date);
    if (selectedDate.getDay() !== 0) {
        alert('출석체크는 일요일에만 가능합니다.');
        return;
    }
    
    database.ref('students').once('value', (snapshot) => {
        const students = snapshot.val() || {};
        displayAttendanceList(students, date);
    });
}

// 선생님 출석 데이터 로드
function loadTeacherAttendanceData() {
    const date = document.getElementById('teacherAttendanceDate').value;
    if (!date) {
        alert('날짜를 선택해주세요.');
        return;
    }
    
    const selectedDate = new Date(date);
    if (selectedDate.getDay() !== 0) {
        alert('출석체크는 일요일에만 가능합니다.');
        return;
    }
    
    database.ref('teachers').once('value', (snapshot) => {
        const teachers = snapshot.val() || {};
        displayTeacherAttendanceList(teachers, date);
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

// 출석 저장
function saveAttendance(type) {
    const date = type === 'student' ? 
        document.getElementById('attendanceDate').value : 
        document.getElementById('teacherAttendanceDate').value;
    
    if (!date) {
        alert('날짜를 선택해주세요.');
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
    database.ref(`${path}/${date}`).set(attendanceData)
        .then(() => {
            alert('출석 정보가 저장되었습니다.');
        })
        .catch(error => {
            alert('저장 중 오류가 발생했습니다: ' + error.message);
        });
}

// 메뉴 외부 클릭 시 닫기
document.addEventListener('click', function(e) {
    const navMenu = document.getElementById('navMenu');
    const hamburger = document.querySelector('.hamburger');
    
    if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        navMenu.classList.remove('active');
    }
});
