/**
 * محرك لعبة "مهمة إنقاذ كوكب الحاسوب"
 * المنطق الكامل للتحكم في اللعبة
 */

class Game {
  constructor() {
    // حالة اللعبة
    this.state = {
      currentScreen: 'start',
      currentLevel: 0,
      currentQuestion: 0,
      score: 0,
      answeredQuestions: new Set(),
      earnedBadges: [],
      totalCorrect: 0,
      isPlaying: false
    };

    // عناصر DOM
    this.screens = {};
    this.hud = null;

    // ربط الدوال
    this.init = this.init.bind(this);
  }

  init() {
    this.cacheElements();
    this.createStars();
    this.setupEventListeners();
    this.showScreen('start');
  }

  cacheElements() {
    // الشاشات
    this.screens = {
      start: document.getElementById('start-screen'),
      story: document.getElementById('story-screen'),
      map: document.getElementById('map-screen'),
      levelIntro: document.getElementById('level-intro-screen'),
      question: document.getElementById('question-screen'),
      badge: document.getElementById('badge-screen'),
      victory: document.getElementById('victory-screen')
    };

    // عناصر HUD
    this.hud = {
      container: document.getElementById('game-hud'),
      score: document.getElementById('hud-score-value'),
      progressFill: document.getElementById('progress-fill'),
      progressText: document.getElementById('progress-text'),
      muteBtn: document.getElementById('mute-btn')
    };

    // التغذية الراجعة
    this.feedbackOverlay = document.getElementById('feedback-overlay');
  }

  createStars() {
    const container = document.getElementById('stars-container');
    const count = Math.min(120, Math.floor(window.innerWidth * window.innerHeight / 8000));

    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      const size = Math.random() * 3 + 1;
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
      star.style.animationDelay = Math.random() * 5 + 's';
      container.appendChild(star);
    }
  }

  setupEventListeners() {
    // زر البدء
    document.getElementById('btn-start').addEventListener('click', () => {
      this.initAudio();
      audioManager.playClick();
      audioManager.startBgMusic();
      this.showScreen('story');
    });

    // زر بدء الرحلة
    document.getElementById('btn-begin-journey').addEventListener('click', () => {
      audioManager.playClick();
      audioManager.playWelcome();
      this.state.isPlaying = true;
      this.showScreen('map');
    });

    // زر كتم الصوت
    this.hud.muteBtn.addEventListener('click', () => {
      const muted = audioManager.toggleMute();
      this.hud.muteBtn.textContent = muted ? '🔇' : '🔊';
      this.hud.muteBtn.title = muted ? 'تشغيل الصوت' : 'كتم الصوت';
    });

    // زر إعادة اللعب
    document.getElementById('btn-replay').addEventListener('click', () => {
      audioManager.playClick();
      this.resetGame();
    });
  }

  initAudio() {
    audioManager.init();
  }

  // --- إدارة الشاشات ---
  showScreen(screenName) {
    // إخفاء جميع الشاشات
    Object.values(this.screens).forEach(screen => {
      if (screen) screen.classList.remove('active');
    });

    // عرض/إخفاء HUD
    const showHud = ['map', 'levelIntro', 'question', 'badge'].includes(screenName);
    this.hud.container.style.display = showHud ? 'flex' : 'none';

    // تحديث الشاشة
    this.state.currentScreen = screenName;

    // تحضير المحتوى قبل العرض
    switch (screenName) {
      case 'story':
        this.renderStory();
        break;
      case 'map':
        this.renderMap();
        this.updateHUD();
        break;
      case 'levelIntro':
        this.renderLevelIntro();
        this.updateHUD();
        break;
      case 'question':
        this.renderQuestion();
        this.updateHUD();
        break;
      case 'badge':
        this.renderBadge();
        this.updateHUD();
        break;
      case 'victory':
        this.renderVictory();
        break;
    }

    // عرض الشاشة مع تأخير بسيط للرسم
    const screen = this.screens[screenName];
    if (screen) {
      requestAnimationFrame(() => {
        screen.classList.add('active');
      });
    }
  }

  updateHUD() {
    // تحديث النقاط
    this.hud.score.textContent = this.state.score;

    // تحديث شريط التقدم
    const totalQuestions = GAME_DATA.mastery.totalQuestions;
    const answered = this.state.answeredQuestions.size;
    const percent = (answered / totalQuestions) * 100;
    this.hud.progressFill.style.width = percent + '%';
    this.hud.progressText.textContent =
      `المرحلة ${this.state.currentLevel + 1} من ${GAME_DATA.levels.length}`;
  }

  // --- شاشة القصة ---
  renderStory() {
    const container = document.getElementById('story-content');
    container.innerHTML = `
      <div class="miko-container">
        <div class="miko" id="story-miko">
          <div class="miko-antenna"></div>
          <div class="miko-head">
            <div class="miko-eyes">
              <div class="miko-eye"></div>
              <div class="miko-eye"></div>
            </div>
            <div class="miko-mouth"></div>
          </div>
          <div class="miko-body"></div>
          <div class="miko-arm miko-arm-left"></div>
          <div class="miko-arm miko-arm-right"></div>
          <div class="miko-legs">
            <div class="miko-leg"></div>
            <div class="miko-leg"></div>
          </div>
        </div>
      </div>
      <div class="miko-speech" style="animation-delay: 0.3s">
        <span class="miko-name">🤖 ميكو</span>
        ${GAME_DATA.story.welcome}
      </div>
      <div class="planet broken" style="animation-delay: 0.5s; margin: 10px 0;"></div>
      <div class="miko-speech" style="animation-delay: 0.7s">
        <span class="miko-name">⚠️ المشكلة</span>
        ${GAME_DATA.story.problem.replace(/\n/g, '<br>')}
      </div>
      <div class="miko-speech" style="animation-delay: 0.9s">
        <span class="miko-name">🎯 المهمة</span>
        ${GAME_DATA.story.mission.replace(/\n/g, '<br>')}
      </div>
      <button class="btn btn-start" id="btn-begin-journey" style="animation-delay: 1.1s">
        🚀 لنبدأ الرحلة!
      </button>
    `;

    // إعادة ربط الحدث
    document.getElementById('btn-begin-journey').addEventListener('click', () => {
      audioManager.playClick();
      audioManager.playWelcome();
      this.state.isPlaying = true;
      this.showScreen('map');
    });
  }

  // --- خريطة الرحلة ---
  renderMap() {
    const container = document.getElementById('map-content');
    const levels = GAME_DATA.levels;

    let html = `
      <div class="section-title">🗺️ خريطة الرحلة</div>
      <div class="section-subtitle">اجتز جميع المحطات لإنقاذ كوكب الحاسوب</div>
      <div class="journey-map">
    `;

    levels.forEach((level, index) => {
      const isCompleted = this.state.earnedBadges.includes(level.badge);
      const isCurrent = index === this.state.currentLevel;
      const isLocked = index > this.state.currentLevel;

      let statusClass = '';
      if (isCompleted) statusClass = 'completed';
      else if (isCurrent) statusClass = 'current';
      else if (isLocked) statusClass = 'locked';

      html += `
        <div class="map-level ${statusClass}" data-level="${index}"
             ${!isLocked ? `onclick="game.selectLevel(${index})"` : ''}>
          <div class="map-level-number">
            <span>${level.id}</span>
          </div>
          <div class="map-level-info">
            <h3>${level.name}</h3>
            <p>${level.description}</p>
          </div>
          <div class="map-level-badge">${level.badgeIcon}</div>
        </div>
      `;
    });

    html += '</div>';

    // إذا اكتملت جميع المراحل
    if (this.state.earnedBadges.length >= levels.length) {
      html += `
        <button class="btn btn-start" onclick="game.showScreen('victory')">
          🏆 عرض النتيجة النهائية
        </button>
      `;
    }

    container.innerHTML = html;
  }

  selectLevel(levelIndex) {
    if (levelIndex > this.state.currentLevel) return;

    this.state.currentLevel = levelIndex;
    this.state.currentQuestion = 0;

    // التحقق مما إذا كانت المرحلة مكتملة
    const level = GAME_DATA.levels[levelIndex];
    const allAnswered = level.questions.every(q =>
      this.state.answeredQuestions.has(q.id)
    );

    if (allAnswered) {
      // المرحلة مكتملة، عرض الخريطة
      return;
    }

    audioManager.playClick();
    audioManager.playTransition();
    this.showScreen('levelIntro');
  }

  // --- مقدمة المرحلة ---
  renderLevelIntro() {
    const level = GAME_DATA.levels[this.state.currentLevel];
    const container = document.getElementById('level-intro-content');

    container.innerHTML = `
      <div class="miko-container">
        <div class="miko">
          <div class="miko-antenna"></div>
          <div class="miko-head">
            <div class="miko-eyes">
              <div class="miko-eye"></div>
              <div class="miko-eye"></div>
            </div>
            <div class="miko-mouth"></div>
          </div>
          <div class="miko-body"></div>
          <div class="miko-arm miko-arm-left"></div>
          <div class="miko-arm miko-arm-right"></div>
          <div class="miko-legs">
            <div class="miko-leg"></div>
            <div class="miko-leg"></div>
          </div>
        </div>
      </div>
      <div class="level-intro-card">
        <h2>${level.badgeIcon} المرحلة ${level.id}: ${level.name}</h2>
        ${level.subtitle ? `<div style="color: var(--secondary); margin-bottom: 10px;">${level.subtitle}</div>` : ''}
        <div class="level-goal">
          <strong>🎯 الهدف:</strong> ${level.description}
        </div>
        <div class="miko-speech" style="margin: 15px 0; border: none; box-shadow: none; background: rgba(255,255,255,0.03);">
          <span class="miko-name">🤖 ميكو يقول:</span>
          ${level.mikoIntro.replace(/\n/g, '<br>')}
        </div>
        <div style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">
          📝 عدد الأسئلة: ${level.questions.length} | 🏅 الشارة: ${level.badge}
        </div>
        <button class="btn btn-primary" onclick="game.startLevel()">
          ⚡ ابدأ المرحلة
        </button>
      </div>
    `;
  }

  startLevel() {
    audioManager.playClick();

    // البحث عن أول سؤال لم يُجب في هذه المرحلة
    const level = GAME_DATA.levels[this.state.currentLevel];
    let firstUnanswered = 0;
    for (let i = 0; i < level.questions.length; i++) {
      if (!this.state.answeredQuestions.has(level.questions[i].id)) {
        firstUnanswered = i;
        break;
      }
    }
    this.state.currentQuestion = firstUnanswered;
    this.showScreen('question');
  }

  // --- شاشة الأسئلة ---
  renderQuestion() {
    const level = GAME_DATA.levels[this.state.currentLevel];
    const question = level.questions[this.state.currentQuestion];
    const container = document.getElementById('question-content');
    const isAnswered = this.state.answeredQuestions.has(question.id);
    const letters = ['أ', 'ب', 'ج'];

    container.innerHTML = `
      <div class="question-layout">
        <div class="question-card">
          <div class="question-header">
            <div class="question-number">السؤال ${question.id} من 10</div>
            <div class="question-level-name">${level.badgeIcon} ${level.name}</div>
          </div>
          <div class="question-text">${question.text.replace(/\n/g, '<br>')}</div>
          <div class="options-list" id="options-list">
            ${question.options.map((opt, i) => `
              <button class="option-btn ${isAnswered ? 'disabled' : ''}"
                      data-index="${i}"
                      ${isAnswered ? 'disabled' : `onclick="game.selectAnswer(${i})"`}>
                <span class="option-letter">${letters[i]}</span>
                <span class="option-text">${opt}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  selectAnswer(answerIndex) {
    const level = GAME_DATA.levels[this.state.currentLevel];
    const question = level.questions[this.state.currentQuestion];

    // منع الإجابة المتكررة
    if (this.state.answeredQuestions.has(question.id)) return;

    const isCorrect = answerIndex === question.correctIndex;
    const options = document.querySelectorAll('.option-btn');

    // تعطيل جميع الخيارات
    options.forEach(btn => {
      btn.classList.add('disabled');
      btn.disabled = true;
    });

    // تمييز الإجابة
    if (isCorrect) {
      options[answerIndex].classList.add('correct');
      audioManager.playCorrect();
      this.state.answeredQuestions.add(question.id);
      this.state.score += GAME_DATA.mastery.pointsPerQuestion;
      this.state.totalCorrect++;
      this.updateHUD();
      this.showScorePop('+10');

      // عرض التغذية الراجعة الإيجابية
      setTimeout(() => {
        this.showFeedback(true, question);
      }, 700);
    } else {
      options[answerIndex].classList.add('wrong');
      audioManager.playWrong();

      // عرض التغذية الراجعة السلبية
      setTimeout(() => {
        this.showFeedback(false, question);
      }, 700);
    }
  }

  showScorePop(text) {
    const pop = document.createElement('div');
    pop.className = 'score-pop';
    pop.textContent = text;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1000);
  }

  showFeedback(isCorrect, question) {
    const overlay = this.feedbackOverlay;
    const card = overlay.querySelector('.feedback-card');
    const encouragements = isCorrect
      ? GAME_DATA.encouragements.correct
      : GAME_DATA.encouragements.wrong;
    const randomMsg = encouragements[Math.floor(Math.random() * encouragements.length)];

    card.className = `feedback-card ${isCorrect ? 'correct' : 'wrong'}`;

    let html = '';
    if (isCorrect) {
      html = `
        <div class="feedback-icon">✅</div>
        <div class="feedback-title">إجابة صحيحة!</div>
        <div class="feedback-message">${randomMsg}</div>
        <div class="feedback-message" style="font-size: 0.9rem; color: var(--text-muted);">
          ${question.explanation}
        </div>
        <div class="feedback-points">+10 نقاط ⭐</div>
        <button class="btn btn-success feedback-btn" onclick="game.nextAfterFeedback()">
          ${this.hasMoreQuestions() ? '➡️ السؤال التالي' : '🏅 عرض الشارة'}
        </button>
      `;
    } else {
      html = `
        <div class="feedback-icon">🤔</div>
        <div class="feedback-title">حاول مرة أخرى!</div>
        <div class="feedback-message">${randomMsg}</div>
        <div class="feedback-hint">
          <span class="hint-label">💡 تلميح ميكو:</span>
          ${question.hint}
        </div>
        <button class="btn btn-primary feedback-btn" onclick="game.retryQuestion()">
          🔄 حاول مرة أخرى
        </button>
      `;
    }

    card.innerHTML = html;
    overlay.classList.add('show');
  }

  hideFeedback() {
    this.feedbackOverlay.classList.remove('show');
  }

  retryQuestion() {
    this.hideFeedback();
    // إعادة عرض السؤال مع تمكين الخيارات
    this.renderQuestion();
  }

  hasMoreQuestions() {
    const level = GAME_DATA.levels[this.state.currentLevel];
    // التحقق من وجود أسئلة لم تُجب في المرحلة الحالية
    for (let i = this.state.currentQuestion + 1; i < level.questions.length; i++) {
      if (!this.state.answeredQuestions.has(level.questions[i].id)) {
        return true;
      }
    }
    return false;
  }

  nextAfterFeedback() {
    this.hideFeedback();
    audioManager.playClick();

    const level = GAME_DATA.levels[this.state.currentLevel];

    // البحث عن السؤال التالي غير المجاب
    let nextQ = -1;
    for (let i = this.state.currentQuestion + 1; i < level.questions.length; i++) {
      if (!this.state.answeredQuestions.has(level.questions[i].id)) {
        nextQ = i;
        break;
      }
    }

    if (nextQ !== -1) {
      // السؤال التالي في المرحلة
      this.state.currentQuestion = nextQ;
      audioManager.playTransition();
      this.showScreen('question');
    } else {
      // اكتملت المرحلة - منح الشارة
      if (!this.state.earnedBadges.includes(level.badge)) {
        this.state.earnedBadges.push(level.badge);
      }
      audioManager.playBadge();
      this.showScreen('badge');
    }
  }

  // --- شاشة الشارة ---
  renderBadge() {
    const level = GAME_DATA.levels[this.state.currentLevel];
    const container = document.getElementById('badge-content');
    const isLastLevel = this.state.currentLevel >= GAME_DATA.levels.length - 1;

    container.innerHTML = `
      <div class="badge-showcase">
        <div class="miko-container" style="margin-bottom: 15px;">
          <div class="miko celebrating">
            <div class="miko-antenna"></div>
            <div class="miko-head">
              <div class="miko-eyes">
                <div class="miko-eye"></div>
                <div class="miko-eye"></div>
              </div>
              <div class="miko-mouth"></div>
            </div>
            <div class="miko-body"></div>
            <div class="miko-arm miko-arm-left"></div>
            <div class="miko-arm miko-arm-right"></div>
            <div class="miko-legs">
              <div class="miko-leg"></div>
              <div class="miko-leg"></div>
            </div>
          </div>
        </div>
        <div class="badge-large">${level.badgeIcon}</div>
        <div class="badge-title">🎉 مبروك!</div>
        <div class="badge-desc">
          لقد حصلت على شارة<br>
          <strong style="color: var(--accent); font-size: 1.3rem;">«${level.badge}»</strong>
        </div>
        <div class="badges-row" style="margin-bottom: 20px;">
          ${GAME_DATA.levels.map(l => `
            <div class="badge-mini ${this.state.earnedBadges.includes(l.badge) ? 'earned' : ''}">
              ${l.badgeIcon}
            </div>
          `).join('')}
        </div>
        <button class="btn ${isLastLevel ? 'btn-start' : 'btn-primary'}"
                onclick="game.afterBadge()">
          ${isLastLevel ? '🏆 عرض النتيجة النهائية' : '➡️ المرحلة التالية'}
        </button>
      </div>
    `;

    // قصاصات احتفالية
    this.launchConfetti(30);
  }

  afterBadge() {
    audioManager.playClick();

    const isLastLevel = this.state.currentLevel >= GAME_DATA.levels.length - 1;

    if (isLastLevel) {
      audioManager.playVictory();
      this.showScreen('victory');
    } else {
      this.state.currentLevel++;
      this.state.currentQuestion = 0;
      audioManager.playTransition();
      this.showScreen('map');
    }
  }

  // --- شاشة الفوز ---
  renderVictory() {
    const container = document.getElementById('victory-content');
    const score = this.state.score;
    const maxScore = GAME_DATA.mastery.maxScore;
    const correct = this.state.totalCorrect;
    const total = GAME_DATA.mastery.totalQuestions;
    const percent = Math.round((score / maxScore) * 100);
    const mastered = percent >= GAME_DATA.mastery.threshold;

    this.hud.container.style.display = 'none';

    let titleMsg, subtitleMsg;
    if (mastered) {
      titleMsg = '🏆 مبروك يا بطل كوكب الحاسوب! 🏆';
      subtitleMsg = GAME_DATA.story.victory + '<br>' + GAME_DATA.story.victorySubtext;
    } else {
      titleMsg = '🌟 أحسنت! لقد أكملت الرحلة! 🌟';
      subtitleMsg = 'حاول مرة أخرى للحصول على نتيجة أفضل وإتقان المادة!';
    }

    container.innerHTML = `
      <div class="miko-container">
        <div class="miko celebrating large">
          <div class="miko-antenna"></div>
          <div class="miko-head">
            <div class="miko-eyes">
              <div class="miko-eye"></div>
              <div class="miko-eye"></div>
            </div>
            <div class="miko-mouth"></div>
          </div>
          <div class="miko-body"></div>
          <div class="miko-arm miko-arm-left"></div>
          <div class="miko-arm miko-arm-right"></div>
          <div class="miko-legs">
            <div class="miko-leg"></div>
            <div class="miko-leg"></div>
          </div>
        </div>
      </div>
      <div class="planet fixed"></div>
      <div class="victory-title">${titleMsg}</div>
      <div class="victory-subtitle">${subtitleMsg}</div>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">${score}/${maxScore}</span>
          <span class="stat-label">النقاط</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${correct}/${total}</span>
          <span class="stat-label">إجابات صحيحة</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${this.state.earnedBadges.length}</span>
          <span class="stat-label">الشارات</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${percent}%</span>
          <span class="stat-label">نسبة الإتقان</span>
        </div>
      </div>
      <div class="mastery-bar">
        <div class="mastery-label">
          <span class="mastery-text">مستوى الإتقان</span>
          <span class="mastery-value">${percent}%</span>
        </div>
        <div class="mastery-bar-bg">
          <div class="mastery-bar-fill" id="mastery-fill" style="width: 0%"></div>
        </div>
      </div>
      <div style="text-align: center; margin: 5px 0;">
        <div class="section-subtitle">الشارات المكتسبة</div>
      </div>
      <div class="victory-badges">
        ${GAME_DATA.levels.map(l => `
          <div class="victory-badge" style="opacity: ${this.state.earnedBadges.includes(l.badge) ? '1' : '0.3'}">
            <div class="victory-badge-icon">${l.badgeIcon}</div>
            <div class="victory-badge-name">${l.badge}</div>
          </div>
        `).join('')}
      </div>
      ${mastered ? `
        <div style="text-align:center; margin-top: 5px;">
          <div style="font-size: 1.2rem; color: var(--accent); font-weight: 700;">
            🎖️ لقبك: «بطل كوكب الحاسوب» 🎖️
          </div>
        </div>
      ` : ''}
      <button class="btn btn-start" id="btn-replay">
        🔄 إعادة اللعب
      </button>
    `;

    // تحريك شريط الإتقان
    setTimeout(() => {
      const fill = document.getElementById('mastery-fill');
      if (fill) fill.style.width = percent + '%';
    }, 500);

    // ربط زر إعادة اللعب
    document.getElementById('btn-replay').addEventListener('click', () => {
      audioManager.playClick();
      this.resetGame();
    });

    // قصاصات احتفالية
    this.launchConfetti(80);
  }

  // --- إعادة تعيين اللعبة ---
  resetGame() {
    this.state = {
      currentScreen: 'start',
      currentLevel: 0,
      currentQuestion: 0,
      score: 0,
      answeredQuestions: new Set(),
      earnedBadges: [],
      totalCorrect: 0,
      isPlaying: false
    };

    audioManager.stopBgMusic();
    this.showScreen('start');
  }

  // --- قصاصات احتفالية ---
  launchConfetti(count = 50) {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#fbbf24', '#f97316', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 8 + 5;
      const shapes = ['50%', '0', '3px'];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];

      confetti.style.cssText = `
        left: ${Math.random() * 100}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${shape};
        --fall-duration: ${Math.random() * 2 + 2}s;
        animation-delay: ${Math.random() * 1}s;
      `;
      container.appendChild(confetti);
    }

    setTimeout(() => container.remove(), 5000);
  }
}

// إنشاء اللعبة وتشغيلها
const game = new Game();
document.addEventListener('DOMContentLoaded', game.init);

