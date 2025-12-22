/**
 * Career Playbook - Investor Pitch Deck
 * Google Apps Script - Auto-generates Google Slides presentation
 *
 * HOW TO USE:
 * 1. Go to slides.google.com and create a new blank presentation
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Click Run > createPitchDeck
 * 5. Authorize the script when prompted
 * 6. The presentation will be auto-populated
 */

function createPitchDeck() {
  const presentation = SlidesApp.getActivePresentation();

  // Remove default blank slide
  const slides = presentation.getSlides();
  if (slides.length > 0) {
    slides[0].remove();
  }

  // Colors
  const PRIMARY = '#4F46E5';    // Indigo
  const SECONDARY = '#10B981';  // Green
  const ACCENT = '#F59E0B';     // Amber
  const DARK = '#111827';
  const LIGHT = '#F9FAFB';
  const WHITE = '#FFFFFF';

  // Create slides
  createTitleSlide(presentation, PRIMARY, WHITE);
  createProblemSlide(presentation, WHITE, DARK);
  createSolutionSlide(presentation, WHITE, DARK, PRIMARY);
  createProductDemoSlide(presentation, LIGHT, DARK);
  createHowItWorksSlide(presentation, WHITE, DARK, PRIMARY);
  createMarketSlide(presentation, WHITE, DARK, SECONDARY);
  createBusinessModelSlide(presentation, WHITE, DARK, PRIMARY);
  createTractionSlide(presentation, LIGHT, DARK, SECONDARY);
  createCompetitiveSlide(presentation, WHITE, DARK, PRIMARY);
  createGTMSlide(presentation, WHITE, DARK, PRIMARY);
  createTechnologySlide(presentation, LIGHT, DARK, PRIMARY);
  createTeamSlide(presentation, WHITE, DARK, PRIMARY);
  createFinancialsSlide(presentation, WHITE, DARK, SECONDARY);
  createAskSlide(presentation, PRIMARY, WHITE);
  createVisionSlide(presentation, WHITE, DARK, PRIMARY);

  Logger.log('Pitch deck created successfully!');
}

function createTitleSlide(pres, bgColor, textColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Logo placeholder text
  const logo = slide.insertTextBox('CAREER PLAYBOOK');
  logo.setTop(150).setLeft(100).setWidth(720).setHeight(80);
  logo.getText().getTextStyle().setFontSize(48).setBold(true).setForegroundColor(textColor);
  logo.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // Tagline
  const tagline = slide.insertTextBox('The AI-Powered Career Coaching Platform');
  tagline.setTop(240).setLeft(100).setWidth(720).setHeight(50);
  tagline.getText().getTextStyle().setFontSize(24).setForegroundColor(textColor);
  tagline.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // Slogan
  const slogan = slide.insertTextBox('"Plan. Execute. Land Your Dream Job."');
  slogan.setTop(310).setLeft(100).setWidth(720).setHeight(40);
  slogan.getText().getTextStyle().setFontSize(18).setItalic(true).setForegroundColor('#E0E7FF');
  slogan.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // Contact info
  const contact = slide.insertTextBox(
    'Founder: Ragid Kader\n' +
    'ragid@live.com | careerplaybook.app\n\n' +
    'Seeking: $500K Seed Round'
  );
  contact.setTop(380).setLeft(100).setWidth(720).setHeight(120);
  contact.getText().getTextStyle().setFontSize(16).setForegroundColor(textColor);
  contact.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

function createProblemSlide(pres, bgColor, textColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Title
  const title = slide.insertTextBox('The Problem: Job Searching is Broken');
  title.setTop(30).setLeft(50).setWidth(820).setHeight(60);
  title.getText().getTextStyle().setFontSize(36).setBold(true).setForegroundColor(textColor);

  // Statistics
  const stats = slide.insertTextBox(
    'THE STATISTICS\n\n' +
    '75% of resumes never reach human recruiters\n' +
    '5-6 months average job search duration\n' +
    '5-7 different tools used by job seekers\n' +
    '67% lack a structured search plan\n' +
    '$10,000+ cost of quality career coaching'
  );
  stats.setTop(100).setLeft(50).setWidth(400).setHeight(200);
  stats.getText().getTextStyle().setFontSize(16).setForegroundColor(textColor);

  // Pain points
  const pains = slide.insertTextBox(
    'THE PAIN POINTS\n\n' +
    '1. Fragmented Tools - Resume here, tracker there\n' +
    '2. No Strategy - Reactive, not proactive\n' +
    '3. Expensive Coaching - $100-500/hour\n' +
    '4. ATS Black Hole - Rejected before seen\n' +
    '5. No Accountability - Solo search fails'
  );
  pains.setTop(100).setLeft(470).setWidth(400).setHeight(200);
  pains.getText().getTextStyle().setFontSize(16).setForegroundColor(textColor);

  // Quote
  const quote = slide.insertTextBox('"Job seekers need a coach, not just tools."');
  quote.setTop(320).setLeft(50).setWidth(820).setHeight(40);
  quote.getText().getTextStyle().setFontSize(20).setItalic(true).setForegroundColor('#EF4444');
  quote.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

function createSolutionSlide(pres, bgColor, textColor, accentColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Title
  const title = slide.insertTextBox('The Solution: Career Playbook');
  title.setTop(30).setLeft(50).setWidth(820).setHeight(60);
  title.getText().getTextStyle().setFontSize(36).setBold(true).setForegroundColor(textColor);

  const subtitle = slide.insertTextBox('Your AI Career Coach - One platform that combines:');
  subtitle.setTop(80).setLeft(50).setWidth(820).setHeight(30);
  subtitle.getText().getTextStyle().setFontSize(18).setForegroundColor('#6B7280');

  // Features grid (2 columns, 3 rows)
  const features = [
    ['Career Canvas', '9-section framework to define your unique value proposition'],
    ['90-Day Plans', 'Structured 12-week action plans with weekly milestones'],
    ['AI Resume Analysis', 'ATS scoring (0-100) with specific improvement recommendations'],
    ['Job Tracking CRM', 'Company, contact, and application pipeline management'],
    ['Resume vs JD Match', 'Tailor resumes to specific job descriptions'],
    ['Mentorship Hub', 'Invite mentors, schedule sessions, get structured feedback']
  ];

  let yPos = 120;
  for (let i = 0; i < 6; i++) {
    const xPos = i % 2 === 0 ? 50 : 470;
    if (i > 0 && i % 2 === 0) yPos += 60;

    const feature = slide.insertTextBox(features[i][0] + '\n' + features[i][1]);
    feature.setTop(yPos).setLeft(xPos).setWidth(380).setHeight(55);
    feature.getText().getRange(0, features[i][0].length).getTextStyle().setBold(true).setFontSize(16).setForegroundColor(accentColor);
    feature.getText().getRange(features[i][0].length + 1, features[i][0].length + 1 + features[i][1].length).getTextStyle().setFontSize(13).setForegroundColor('#6B7280');
  }

  // Result
  const result = slide.insertTextBox('Result: Job seekers go from "I don\'t know where to start" to "I have a plan and I\'m executing it."');
  result.setTop(320).setLeft(50).setWidth(820).setHeight(40);
  result.getText().getTextStyle().setFontSize(16).setBold(true).setForegroundColor('#10B981');
  result.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

function createProductDemoSlide(pres, bgColor, textColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Title
  const title = slide.insertTextBox('Product Demo');
  title.setTop(30).setLeft(50).setWidth(820).setHeight(60);
  title.getText().getTextStyle().setFontSize(36).setBold(true).setForegroundColor(textColor);

  // Screenshot placeholders
  const demos = [
    'Dashboard\nQuick access, progress tracking',
    'Career Canvas\n9-section value proposition',
    '90-Day Plan\n12-week milestone tracker',
    'Resume Analysis\nAI scoring with feedback',
    'Job CRM\nPipeline management',
    'Mentorship\nSession scheduling'
  ];

  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const xPos = 50 + col * 280;
    const yPos = 100 + row * 140;

    const box = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, xPos, yPos, 260, 120);
    box.getFill().setSolidFill('#E5E7EB');
    box.getBorder().setWeight(1).getLineFill().setSolidFill('#D1D5DB');

    const label = slide.insertTextBox(demos[i]);
    label.setTop(yPos + 30).setLeft(xPos + 10).setWidth(240).setHeight(80);
    label.getText().getTextStyle().setFontSize(14).setForegroundColor(textColor);
    label.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  }

  const note = slide.insertTextBox('[Add actual screenshots from careerplaybook.app]');
  note.setTop(380).setLeft(50).setWidth(820).setHeight(30);
  note.getText().getTextStyle().setFontSize(12).setItalic(true).setForegroundColor('#9CA3AF');
  note.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

function createHowItWorksSlide(pres, bgColor, textColor, accentColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Title
  const title = slide.insertTextBox('How It Works');
  title.setTop(30).setLeft(50).setWidth(820).setHeight(50);
  title.getText().getTextStyle().setFontSize(36).setBold(true).setForegroundColor(textColor);

  // Journey steps
  const steps = [
    ['1. DISCOVER', 'Complete Career Canvas\nDefine who you are professionally'],
    ['2. PLAN', 'Build 90-Day Plan\nSet weekly milestones'],
    ['3. OPTIMIZE', 'Upload Resume\nGet AI ATS score'],
    ['4. EXECUTE', 'Search & Track Jobs\nManage CRM pipeline'],
    ['5. COLLABORATE', 'Invite Mentors\nStay accountable']
  ];

  const stepWidth = 160;
  const startX = 40;

  for (let i = 0; i < 5; i++) {
    const xPos = startX + i * (stepWidth + 10);

    // Step box
    const box = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, xPos, 100, stepWidth, 180);
    box.getFill().setSolidFill(i === 4 ? '#10B981' : accentColor);

    // Step text
    const stepText = slide.insertTextBox(steps[i][0] + '\n\n' + steps[i][1]);
    stepText.setTop(110).setLeft(xPos + 5).setWidth(stepWidth - 10).setHeight(160);
    stepText.getText().getTextStyle().setFontSize(12).setForegroundColor('#FFFFFF');
    stepText.getText().getRange(0, steps[i][0].length).getTextStyle().setBold(true).setFontSize(14);
    stepText.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

    // Arrow between steps
    if (i < 4) {
      const arrow = slide.insertTextBox('→');
      arrow.setTop(180).setLeft(xPos + stepWidth).setWidth(20).setHeight(30);
      arrow.getText().getTextStyle().setFontSize(24).setBold(true).setForegroundColor('#9CA3AF');
    }
  }

  // Outcome
  const outcome = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 300, 310, 320, 50);
  outcome.getFill().setSolidFill('#22C55E');

  const outcomeText = slide.insertTextBox('OUTCOME: Dream Job Offer');
  outcomeText.setTop(320).setLeft(300).setWidth(320).setHeight(40);
  outcomeText.getText().getTextStyle().setFontSize(18).setBold(true).setForegroundColor('#FFFFFF');
  outcomeText.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

function createMarketSlide(pres, bgColor, textColor, accentColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Title
  const title = slide.insertTextBox('Market Opportunity: $15B+ Career Services');
  title.setTop(30).setLeft(50).setWidth(820).setHeight(50);
  title.getText().getTextStyle().setFontSize(32).setBold(true).setForegroundColor(textColor);

  // TAM/SAM/SOM circles (visual representation)
  const tam = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, 80, 100, 220, 220);
  tam.getFill().setSolidFill('#DBEAFE');
  tam.getBorder().setWeight(2).getLineFill().setSolidFill('#3B82F6');

  const sam = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, 120, 140, 140, 140);
  sam.getFill().setSolidFill('#BBF7D0');
  sam.getBorder().setWeight(2).getLineFill().setSolidFill('#22C55E');

  const som = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, 150, 170, 80, 80);
  som.getFill().setSolidFill(accentColor);
  som.getBorder().setWeight(2).getLineFill().setSolidFill('#059669');

  // Labels
  const tamLabel = slide.insertTextBox('TAM: $15.4B\nGlobal career services');
  tamLabel.setTop(110).setLeft(320).setWidth(200).setHeight(50);
  tamLabel.getText().getTextStyle().setFontSize(14).setForegroundColor('#3B82F6');

  const samLabel = slide.insertTextBox('SAM: $4.2B\nDigital career platforms');
  samLabel.setTop(170).setLeft(320).setWidth(200).setHeight(50);
  samLabel.getText().getTextStyle().setFontSize(14).setForegroundColor('#22C55E');

  const somLabel = slide.insertTextBox('SOM: $150M\nUS professional job seekers');
  somLabel.setTop(230).setLeft(320).setWidth(200).setHeight(50);
  somLabel.getText().getTextStyle().setFontSize(14).setForegroundColor('#059669');

  // Why Now
  const whyNow = slide.insertTextBox(
    'WHY NOW?\n\n' +
    '• Remote work increased job mobility 3x\n' +
    '• AI makes personalized coaching affordable\n' +
    '• 50M+ job changers (2021-2024)\n' +
    '• Traditional coaches can\'t scale\n' +
    '• 5.8% CAGR through 2030'
  );
  whyNow.setTop(100).setLeft(550).setWidth(320).setHeight(200);
  whyNow.getText().getTextStyle().setFontSize(14).setForegroundColor(textColor);
  whyNow.getText().getRange(0, 8).getTextStyle().setBold(true).setFontSize(18);
}

function createBusinessModelSlide(pres, bgColor, textColor, accentColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Title
  const title = slide.insertTextBox('Business Model: SaaS Subscription');
  title.setTop(30).setLeft(50).setWidth(820).setHeight(50);
  title.getText().getTextStyle().setFontSize(32).setBold(true).setForegroundColor(textColor);

  // Pricing tiers
  const tiers = [
    ['FREE', '$0', 'Lead gen'],
    ['PRO', '$9.99/mo', 'Individual'],
    ['TEAM', '$29/mo', 'Groups'],
    ['ENTERPRISE', 'Custom', 'B2B']
  ];

  for (let i = 0; i < 4; i++) {
    const xPos = 50 + i * 220;
    const bgFill = i === 1 ? accentColor : '#E5E7EB';
    const txtColor = i === 1 ? '#FFFFFF' : textColor;

    const box = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, xPos, 90, 200, 100);
    box.getFill().setSolidFill(bgFill);

    const tierText = slide.insertTextBox(tiers[i][0] + '\n' + tiers[i][1] + '\n' + tiers[i][2]);
    tierText.setTop(100).setLeft(xPos + 10).setWidth(180).setHeight(80);
    tierText.getText().getTextStyle().setFontSize(14).setForegroundColor(txtColor);
    tierText.getText().getRange(0, tiers[i][0].length).getTextStyle().setBold(true).setFontSize(16);
    tierText.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  }

  // Unit economics
  const economics = slide.insertTextBox(
    'UNIT ECONOMICS (Pro Tier)\n\n' +
    '• LTV: $120 (12-month retention)\n' +
    '• CAC: $15\n' +
    '• LTV:CAC Ratio: 8:1\n' +
    '• Gross Margin: 70%'
  );
  economics.setTop(200).setLeft(50).setWidth(350).setHeight(150);
  economics.getText().getTextStyle().setFontSize(14).setForegroundColor(textColor);
  economics.getText().getRange(0, 26).getTextStyle().setBold(true).setFontSize(16);

  // Revenue projections
  const projections = slide.insertTextBox(
    'REVENUE PROJECTIONS\n\n' +
    'Year 1: $50K ARR (500 users)\n' +
    'Year 2: $250K ARR (2,500 users)\n' +
    'Year 3: $1M ARR (10,000 users)'
  );
  projections.setTop(200).setLeft(450).setWidth(400).setHeight(150);
  projections.getText().getTextStyle().setFontSize(14).setForegroundColor(textColor);
  projections.getText().getRange(0, 19).getTextStyle().setBold(true).setFontSize(16);
}

function createTractionSlide(pres, bgColor, textColor, accentColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Title
  const title = slide.insertTextBox('Traction: Early Momentum');
  title.setTop(30).setLeft(50).setWidth(820).setHeight(50);
  title.getText().getTextStyle().setFontSize(32).setBold(true).setForegroundColor(textColor);

  // Milestones achieved
  const achieved = slide.insertTextBox(
    'MILESTONES ACHIEVED ✓\n\n' +
    '✓ MVP 100% feature-complete\n' +
    '✓ Production deployment live\n' +
    '✓ 9 major features built\n' +
    '✓ AI integrations (OpenAI, Jooble)\n' +
    '✓ Email system (Resend)\n' +
    '✓ Admin dashboard with analytics\n' +
    '✓ Mentorship collaboration system'
  );
  achieved.setTop(90).setLeft(50).setWidth(400).setHeight(200);
  achieved.getText().getTextStyle().setFontSize(14).setForegroundColor(textColor);
  achieved.getText().getRange(0, 21).getTextStyle().setBold(true).setFontSize(16).setForegroundColor(accentColor);

  // Coming next
  const next = slide.insertTextBox(
    'COMING NEXT\n\n' +
    '○ Public launch\n' +
    '○ Marketing campaign\n' +
    '○ B2B partnerships\n' +
    '○ Mobile app (React Native)'
  );
  next.setTop(90).setLeft(480).setWidth(380).setHeight(150);
  next.getText().getTextStyle().setFontSize(14).setForegroundColor(textColor);
  next.getText().getRange(0, 11).getTextStyle().setBold(true).setFontSize(16);

  // Tech stack
  const tech = slide.insertTextBox(
    'TECH STACK\n' +
    'React + Supabase + Vercel + OpenAI'
  );
  tech.setTop(300).setLeft(50).setWidth(820).setHeight(50);
  tech.getText().getTextStyle().setFontSize(14).setForegroundColor('#6B7280');
  tech.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

function createCompetitiveSlide(pres, bgColor, textColor, accentColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Title
  const title = slide.insertTextBox('Competitive Landscape');
  title.setTop(30).setLeft(50).setWidth(820).setHeight(50);
  title.getText().getTextStyle().setFontSize(32).setBold(true).setForegroundColor(textColor);

  // 2x2 Matrix
  const matrix = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 50, 90, 400, 250);
  matrix.getFill().setSolidFill('#F9FAFB');
  matrix.getBorder().setWeight(2).getLineFill().setSolidFill('#E5E7EB');

  // Axis labels
  const yAxis = slide.insertTextBox('HIGH\nGUIDANCE\n\n\n\n\n\n\n\nLOW\nGUIDANCE');
  yAxis.setTop(90).setLeft(10).setWidth(40).setHeight(250);
  yAxis.getText().getTextStyle().setFontSize(8).setForegroundColor('#6B7280');

  const xAxis = slide.insertTextBox('LOW TECH                                              HIGH TECH');
  xAxis.setTop(345).setLeft(50).setWidth(400).setHeight(20);
  xAxis.getText().getTextStyle().setFontSize(8).setForegroundColor('#6B7280');
  xAxis.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // Quadrant labels
  const q1 = slide.insertTextBox('Career Coaches\n($100-500/hr)');
  q1.setTop(100).setLeft(70).setWidth(150).setHeight(40);
  q1.getText().getTextStyle().setFontSize(11).setForegroundColor('#6B7280');

  const q2 = slide.insertTextBox('CAREER\nPLAYBOOK');
  q2.setTop(100).setLeft(300).setWidth(130).setHeight(40);
  q2.getText().getTextStyle().setFontSize(14).setBold(true).setForegroundColor(accentColor);

  const q3 = slide.insertTextBox('Spreadsheets\n(DIY chaos)');
  q3.setTop(280).setLeft(70).setWidth(150).setHeight(40);
  q3.getText().getTextStyle().setFontSize(11).setForegroundColor('#6B7280');

  const q4 = slide.insertTextBox('Job Boards\n(Reactive)');
  q4.setTop(280).setLeft(300).setWidth(130).setHeight(40);
  q4.getText().getTextStyle().setFontSize(11).setForegroundColor('#6B7280');

  // Competitive moats
  const moats = slide.insertTextBox(
    'OUR COMPETITIVE MOATS\n\n' +
    '1. Integrated Platform - Not a point solution\n' +
    '2. AI + Structure - Framework + automation\n' +
    '3. Mentorship Built-In - Collaboration native\n' +
    '4. Affordable - $10/mo vs $100/hr coaching\n' +
    '5. Data Network - More users = better AI'
  );
  moats.setTop(90).setLeft(480).setWidth(380).setHeight(200);
  moats.getText().getTextStyle().setFontSize(13).setForegroundColor(textColor);
  moats.getText().getRange(0, 22).getTextStyle().setBold(true).setFontSize(15);
}

function createGTMSlide(pres, bgColor, textColor, accentColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Title
  const title = slide.insertTextBox('Go-to-Market Strategy');
  title.setTop(30).setLeft(50).setWidth(820).setHeight(50);
  title.getText().getTextStyle().setFontSize(32).setBold(true).setForegroundColor(textColor);

  // Phases
  const phases = [
    ['Phase 1: D2C', 'Months 1-12', 'Content marketing, SEO\nLinkedIn, YouTube\nGoal: 1,000 free → 200 paid'],
    ['Phase 2: Influencers', 'Months 6-18', 'Career coach partners\n20% affiliate revenue\nGoal: 5,000 users'],
    ['Phase 3: B2B', 'Months 12-24', 'Outplacement, universities\nTeam/Enterprise tiers\nGoal: 10 enterprise accounts']
  ];

  for (let i = 0; i < 3; i++) {
    const xPos = 50 + i * 290;

    const box = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, xPos, 90, 270, 150);
    box.getFill().setSolidFill(i === 0 ? accentColor : i === 1 ? '#10B981' : '#6366F1');

    const phaseText = slide.insertTextBox(phases[i][0] + '\n' + phases[i][1] + '\n\n' + phases[i][2]);
    phaseText.setTop(100).setLeft(xPos + 10).setWidth(250).setHeight(130);
    phaseText.getText().getTextStyle().setFontSize(12).setForegroundColor('#FFFFFF');
    phaseText.getText().getRange(0, phases[i][0].length).getTextStyle().setBold(true).setFontSize(14);
    phaseText.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  }

  // Channels
  const channels = slide.insertTextBox(
    'ACQUISITION CHANNELS\n\n' +
    'SEO/Content: 40%  |  Social/Influencer: 30%  |  Paid Ads: 15%  |  Referrals: 10%  |  B2B: 5%'
  );
  channels.setTop(280).setLeft(50).setWidth(820).setHeight(80);
  channels.getText().getTextStyle().setFontSize(14).setForegroundColor(textColor);
  channels.getText().getRange(0, 20).getTextStyle().setBold(true).setFontSize(16);
  channels.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

function createTechnologySlide(pres, bgColor, textColor, accentColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Title
  const title = slide.insertTextBox('Technology & AI');
  title.setTop(30).setLeft(50).setWidth(820).setHeight(50);
  title.getText().getTextStyle().setFontSize(32).setBold(true).setForegroundColor(textColor);

  // Tech stack
  const stack = slide.insertTextBox(
    'TECH STACK\n\n' +
    '• Frontend: React 18 + TypeScript + TailwindCSS\n' +
    '• Backend: Supabase (PostgreSQL + Auth)\n' +
    '• AI: OpenAI GPT-4\n' +
    '• Email: Resend API\n' +
    '• Jobs: Jooble API\n' +
    '• Hosting: Vercel (serverless)'
  );
  stack.setTop(80).setLeft(50).setWidth(400).setHeight(180);
  stack.getText().getTextStyle().setFontSize(14).setForegroundColor(textColor);
  stack.getText().getRange(0, 10).getTextStyle().setBold(true).setFontSize(16);

  // AI Features
  const ai = slide.insertTextBox(
    'AI FEATURES\n\n' +
    '• ATS Resume Scoring (0-100)\n' +
    '• Resume vs JD Matching\n' +
    '• Milestone Generation\n' +
    '• Job Recommendations\n' +
    '• Keyword Extraction'
  );
  ai.setTop(80).setLeft(480).setWidth(380).setHeight(180);
  ai.getText().getTextStyle().setFontSize(14).setForegroundColor(textColor);
  ai.getText().getRange(0, 11).getTextStyle().setBold(true).setFontSize(16).setForegroundColor(accentColor);

  // Why this stack
  const why = slide.insertTextBox(
    'WHY THIS STACK: Fast iteration (deploy in minutes) • Cost-effective (~$0.15/user/month AI) • Scalable (10K+ users) • Secure (RLS, encrypted)'
  );
  why.setTop(280).setLeft(50).setWidth(820).setHeight(40);
  why.getText().getTextStyle().setFontSize(12).setForegroundColor('#6B7280');
  why.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // Future roadmap
  const roadmap = slide.insertTextBox(
    'FUTURE AI ROADMAP: Interview prep chatbot • Cover letter generator • Salary negotiation coach • Career path predictor'
  );
  roadmap.setTop(320).setLeft(50).setWidth(820).setHeight(30);
  roadmap.getText().getTextStyle().setFontSize(12).setItalic(true).setForegroundColor('#9CA3AF');
  roadmap.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

function createTeamSlide(pres, bgColor, textColor, accentColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Title
  const title = slide.insertTextBox('The Team');
  title.setTop(30).setLeft(50).setWidth(820).setHeight(50);
  title.getText().getTextStyle().setFontSize(32).setBold(true).setForegroundColor(textColor);

  // Founder card
  const founderBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 50, 90, 400, 180);
  founderBox.getFill().setSolidFill('#F3F4F6');

  const founderText = slide.insertTextBox(
    'RAGID KADER\nCEO & Product\n\n' +
    '• Full-stack developer and entrepreneur\n' +
    '• Experience building scalable SaaS products\n' +
    '• AI integration expertise\n' +
    '• "Built the tool I wish I had"'
  );
  founderText.setTop(100).setLeft(70).setWidth(360).setHeight(160);
  founderText.getText().getTextStyle().setFontSize(13).setForegroundColor(textColor);
  founderText.getText().getRange(0, 12).getTextStyle().setBold(true).setFontSize(18).setForegroundColor(accentColor);

  // Hiring plan
  const hiring = slide.insertTextBox(
    'HIRING PLAN (Post-Funding)\n\n' +
    '• Engineer #1: Backend/AI specialist\n' +
    '• Marketer #1: Content & growth\n' +
    '• Customer Success: User support\n\n' +
    'CULTURE\n' +
    'Remote-first • User-obsessed • Ship fast'
  );
  hiring.setTop(90).setLeft(480).setWidth(380).setHeight(180);
  hiring.getText().getTextStyle().setFontSize(13).setForegroundColor(textColor);
  hiring.getText().getRange(0, 25).getTextStyle().setBold(true).setFontSize(15);

  // Advisors placeholder
  const advisors = slide.insertTextBox('ADVISORS: [Career coaching expert] • [SaaS growth specialist] • [AI/ML advisor]');
  advisors.setTop(290).setLeft(50).setWidth(820).setHeight(30);
  advisors.getText().getTextStyle().setFontSize(12).setForegroundColor('#6B7280');
  advisors.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

function createFinancialsSlide(pres, bgColor, textColor, accentColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Title
  const title = slide.insertTextBox('Financial Projections');
  title.setTop(30).setLeft(50).setWidth(820).setHeight(50);
  title.getText().getTextStyle().setFontSize(32).setBold(true).setForegroundColor(textColor);

  // Revenue projections
  const revenue = slide.insertTextBox(
    'REVENUE MODEL\n\n' +
    'Year 1:    $50K ARR   |   500 users   |   Investment phase\n' +
    'Year 2:   $250K ARR   |   2,500 users   |   Break-even\n' +
    'Year 3:     $1M ARR   |   10,000 users   |   $200K profit\n' +
    'Year 4:     $3M ARR   |   25,000 users   |   $800K profit\n' +
    'Year 5:     $8M ARR   |   60,000 users   |   $2.5M profit'
  );
  revenue.setTop(80).setLeft(50).setWidth(500).setHeight(150);
  revenue.getText().getTextStyle().setFontSize(13).setForegroundColor(textColor);
  revenue.getText().getRange(0, 13).getTextStyle().setBold(true).setFontSize(16);

  // Use of funds
  const funds = slide.insertTextBox(
    'USE OF FUNDS ($500K)\n\n' +
    '40% Product ($200K)\n' +
    '30% Marketing ($150K)\n' +
    '20% Operations ($100K)\n' +
    '10% Reserve ($50K)\n\n' +
    '18-month runway'
  );
  funds.setTop(80).setLeft(580).setWidth(280).setHeight(180);
  funds.getText().getTextStyle().setFontSize(13).setForegroundColor(textColor);
  funds.getText().getRange(0, 21).getTextStyle().setBold(true).setFontSize(16).setForegroundColor(accentColor);

  // Key assumptions
  const assumptions = slide.insertTextBox(
    'KEY ASSUMPTIONS: 10% free-to-paid conversion • 80% annual retention • $20 blended CAC • 5% monthly growth • 70% gross margin'
  );
  assumptions.setTop(280).setLeft(50).setWidth(820).setHeight(40);
  assumptions.getText().getTextStyle().setFontSize(11).setForegroundColor('#6B7280');
  assumptions.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

function createAskSlide(pres, bgColor, textColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Main ask
  const ask = slide.insertTextBox('THE ASK');
  ask.setTop(80).setLeft(50).setWidth(820).setHeight(50);
  ask.getText().getTextStyle().setFontSize(24).setForegroundColor(textColor);
  ask.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  const amount = slide.insertTextBox('$500K SEED ROUND');
  amount.setTop(130).setLeft(50).setWidth(820).setHeight(60);
  amount.getText().getTextStyle().setFontSize(48).setBold(true).setForegroundColor(textColor);
  amount.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  const terms = slide.insertTextBox('SAFE  •  $3M Valuation Cap');
  terms.setTop(200).setLeft(50).setWidth(820).setHeight(40);
  terms.getText().getTextStyle().setFontSize(20).setForegroundColor('#E0E7FF');
  terms.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // Milestones
  const milestones = slide.insertTextBox(
    'MILESTONES TO ACHIEVE\n\n' +
    '☐ 2,500 paid users\n' +
    '☐ $250K ARR\n' +
    '☐ Mobile app launch\n' +
    '☐ 3 enterprise customers\n' +
    '☐ Series A ready'
  );
  milestones.setTop(250).setLeft(250).setWidth(420).setHeight(160);
  milestones.getText().getTextStyle().setFontSize(16).setForegroundColor(textColor);
  milestones.getText().getRange(0, 21).getTextStyle().setBold(true).setFontSize(18);
  milestones.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

function createVisionSlide(pres, bgColor, textColor, accentColor) {
  const slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(bgColor);

  // Vision
  const vision = slide.insertTextBox('"Every professional has access to world-class career coaching,\npowered by AI and community."');
  vision.setTop(80).setLeft(50).setWidth(820).setHeight(80);
  vision.getText().getTextStyle().setFontSize(24).setItalic(true).setForegroundColor(accentColor);
  vision.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // Why we'll win
  const why = slide.insertTextBox(
    'WHY CAREER PLAYBOOK WILL WIN\n\n' +
    '✓ Right team - Builder with domain expertise\n' +
    '✓ Right time - AI makes coaching affordable\n' +
    '✓ Right approach - Platform, not point solution\n' +
    '✓ Right market - Everyone needs career help eventually'
  );
  why.setTop(180).setLeft(150).setWidth(600).setHeight(150);
  why.getText().getTextStyle().setFontSize(16).setForegroundColor(textColor);
  why.getText().getRange(0, 28).getTextStyle().setBold(true).setFontSize(18);
  why.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // Contact
  const contact = slide.insertTextBox(
    'LET\'S TALK\n\n' +
    'Ragid Kader\n' +
    'ragid@live.com\n' +
    'careerplaybook.app'
  );
  contact.setTop(340).setLeft(50).setWidth(820).setHeight(100);
  contact.getText().getTextStyle().setFontSize(18).setForegroundColor(textColor);
  contact.getText().getRange(0, 10).getTextStyle().setBold(true).setFontSize(20).setForegroundColor(accentColor);
  contact.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}
