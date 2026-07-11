export const TABLE_SECTIONS = [
  {
    key: 'core',
    rows: [
      { key: 'resumeExports', free: '3', pro: 'Unlimited', enterprise: 'Unlimited' },
      { key: 'templates', free: '5', pro: '120+', enterprise: '120+' },
      { key: 'realTimePreview', free: true, pro: true, enterprise: true },
      { key: 'pdfExport', free: true, pro: true, enterprise: true },
      { key: 'docxExport', free: false, pro: true, enterprise: true },
      { key: 'linkedinExport', free: false, pro: true, enterprise: true },
    ],
  },
  {
    key: 'ai',
    rows: [
      { key: 'atsCheck', free: 'Basic', pro: 'Full', enterprise: 'Full' },
      { key: 'atsScore', free: false, pro: true, enterprise: true },
      { key: 'keywordAnalysis', free: false, pro: true, enterprise: true },
      { key: 'aiCoverLetter', free: false, pro: true, enterprise: true },
      { key: 'gptCoach', free: false, pro: false, enterprise: true },
      { key: 'jobMatch', free: false, pro: false, enterprise: true },
    ],
  },
  {
    key: 'global',
    rows: [
      { key: 'usFormat', free: true, pro: true, enterprise: true },
      { key: 'euFormat', free: false, pro: true, enterprise: true },
      { key: 'gccFormat', free: false, pro: true, enterprise: true },
      { key: 'apacFormat', free: false, pro: true, enterprise: true },
      { key: 'academicCv', free: false, pro: true, enterprise: true },
      { key: 'rtlSupport', free: true, pro: true, enterprise: true },
    ],
  },
  {
    key: 'team',
    rows: [
      { key: 'teamWorkspace', free: false, pro: false, enterprise: 'Up to 20' },
      { key: 'linkedinSync', free: false, pro: false, enterprise: true },
      { key: 'prioritySupport', free: false, pro: false, enterprise: true },
      { key: 'customBranding', free: false, pro: false, enterprise: true },
    ],
  },
];