// ---- NAVBAR SCROLL ----
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');

hamburger.setAttribute('aria-expanded', 'false');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  updateActiveLink();
});

function setMobileMenu(open) {
  navLinks.classList.toggle('open', open);
  hamburger.classList.toggle('open', open);
  document.body.classList.toggle('mobile-menu-open', open);
  hamburger.setAttribute('aria-expanded', String(open));
}

hamburger.addEventListener('click', () => {
  setMobileMenu(!navLinks.classList.contains('open'));
});

navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    setMobileMenu(false);
  });
});

if (mobileMenuBackdrop) {
  mobileMenuBackdrop.addEventListener('click', () => setMobileMenu(false));
}

function updateActiveLink() {
  const sections = ['home','services','why-us','about','process','testimonials','faq','contact'];
  let current = 'home';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 120) current = id;
  });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === '#' + current);
  });
}

// ---- PARTICLES ----
(function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;
      width:${4 + Math.random() * 8}px;height:${4 + Math.random() * 8}px;
      background:${Math.random() > 0.5 ? 'rgba(13,27,75,0.12)' : 'rgba(232,100,10,0.15)'};
      left:${Math.random() * 100}%;top:${Math.random() * 100}%;
      animation:float ${4 + Math.random() * 6}s ease-in-out ${Math.random() * 4}s infinite`;
    container.appendChild(p);
  }
})();

// ---- COUNTER ANIMATION ----
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = +el.dataset.count;
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString('en-IN');
      if (current >= target) clearInterval(timer);
    }, 16);
  });
}

// ---- SCROLL REVEAL ----
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      el.classList.add('visible');
      // delay for child items
      el.querySelectorAll('[data-delay]').forEach(child => {
        child.style.transitionDelay = child.dataset.delay + 'ms';
      });
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal, .feature-card, .process-step, .about-content').forEach(el => {
  revealObserver.observe(el);
});

// ---- HERO COUNTER TRIGGER ----
const heroObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    animateCounters();
    heroObserver.disconnect();
  }
}, { threshold: 0.4 });
const heroSection = document.getElementById('home');
if (heroSection) heroObserver.observe(heroSection);

// ---- SERVICE CARDS STAGGERED ----
const serviceObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    document.querySelectorAll('.service-card').forEach((card, i) => {
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 80);
    });
    serviceObserver.disconnect();
  }
}, { threshold: 0.1 });

document.querySelectorAll('.service-card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
});
const servicesSection = document.getElementById('services');
if (servicesSection) serviceObserver.observe(servicesSection);

// ---- INTERACTIVE SERVICE REQUEST SYSTEM ----
const SERVICE_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbznusXhdPqE32uSjbIOR31BqsyZBquSG9WitcBTf1QCXTQ5hUk4fHMfU9zq7lHnIanYfQ/exec';
const SERVICE_DRIVE_FOLDER_ID = '1GHz4c1jqMnMqdBZwcHS7Me8hhzcpcu1o';
const SERVICE_SHEET_NAME = 'Service Requests';
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'docx'];
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const serviceModal = document.getElementById('serviceModal');
const serviceRequestForm = document.getElementById('serviceRequestForm');
const serviceModalIcon = document.getElementById('serviceModalIcon');
const serviceModalTitle = document.getElementById('serviceModalTitle');
const serviceModalDescription = document.getElementById('serviceModalDescription');

let activeServiceKey = null;
let activeFilePayload = null;
let activeFileReadPromise = null;
let activeFileReadError = null;
let isServiceSubmissionInProgress = false;
let lastFocusedElement = null;

const serviceConfigs = {
  aadhaar: {
    title: 'Aadhaar Services',
    description: 'Share your Aadhaar request details and supporting document for faster assistance.',
    subserviceField: 'aadhaarServiceType',
    fields: [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true, autocomplete: 'name' },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true, autocomplete: 'tel' },
      { name: 'email', label: 'Email', type: 'email', autocomplete: 'email' },
      {
        name: 'aadhaarServiceType',
        label: 'Aadhaar Service Type',
        type: 'select',
        required: true,
        full: true,
        options: ['New Enrollment', 'Aadhaar Update', 'Address Correction', 'Mobile Number Update', 'Biometric Update']
      },
      { name: 'message', label: 'Message', type: 'textarea', full: true },
      { name: 'document', label: 'Upload Document', type: 'file', full: true }
    ]
  },
  pan: {
    title: 'PAN Card Services',
    description: 'Send your PAN request and document so our team can begin the next step.',
    subserviceField: 'panServiceType',
    fields: [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true, autocomplete: 'name' },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true, autocomplete: 'tel' },
      {
        name: 'panServiceType',
        label: 'PAN Service Type',
        type: 'select',
        required: true,
        options: ['New PAN', 'PAN Correction', 'Lost PAN Reissue']
      },
      { name: 'document', label: 'Upload Document', type: 'file', full: true },
      { name: 'message', label: 'Message', type: 'textarea', full: true }
    ]
  },
  passport: {
    title: 'Passport Services',
    description: 'Tell us the passport type, city, and document details for guided support.',
    subserviceField: 'passportType',
    fields: [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true, autocomplete: 'name' },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true, autocomplete: 'tel' },
      { name: 'passportType', label: 'Passport Type', type: 'select', required: true, options: ['New Passport', 'Renewal'] },
      { name: 'city', label: 'City', type: 'text', required: true },
      { name: 'document', label: 'Upload Documents', type: 'file', full: true },
      { name: 'message', label: 'Message', type: 'textarea', full: true }
    ]
  },
  printing: {
    title: 'Printing Services',
    description: 'Upload your file and choose the print options you need.',
    subserviceField: 'printType',
    fields: [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true, autocomplete: 'name' },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true, autocomplete: 'tel' },
      { name: 'printType', label: 'Print Type', type: 'select', required: true, options: ['Black & White', 'Color Print'] },
      { name: 'printSide', label: 'Print Side', type: 'select', required: true, options: ['Single Side', 'Double Side'] },
      { name: 'copies', label: 'Number of Copies', type: 'number', required: true, min: '1', value: '1' },
      { name: 'document', label: 'Upload File', type: 'file', full: true },
      { name: 'message', label: 'Additional Instructions', type: 'textarea', full: true }
    ]
  },
  'online-form': {
    title: 'Online Form Services',
    description: 'Share the form type, deadline, and documents for accurate online submission help.',
    subserviceField: 'formType',
    fields: [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true, autocomplete: 'name' },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true, autocomplete: 'tel' },
      { name: 'formType', label: 'Form Type', type: 'text', required: true },
      { name: 'deadline', label: 'Deadline', type: 'date' },
      { name: 'document', label: 'Upload Documents', type: 'file', full: true },
      { name: 'message', label: 'Message', type: 'textarea', full: true }
    ]
  },
  'tech-support': {
    title: 'Technical Support',
    description: 'Describe your device issue and attach a screenshot or file if available.',
    subserviceField: 'deviceType',
    fields: [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true, autocomplete: 'name' },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true, autocomplete: 'tel' },
      { name: 'deviceType', label: 'Device Type', type: 'text', required: true },
      { name: 'message', label: 'Problem Description', type: 'textarea', required: true, full: true },
      { name: 'document', label: 'Upload Screenshot/File', type: 'file', full: true }
    ]
  }
};

// ---- LANGUAGE SWITCHING ----
const LANGUAGE_STORAGE_KEY = 'pandurang_language';
const languageToggle = document.getElementById('languageToggle');
let currentLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'mr' ? 'mr' : 'en';

const UI_TEXT = {
  en: {
    meta: {
      title: 'Pandurang Online Services – Smart Digital Solutions for Everyday India'
    },
    language: {
      buttonLabel: 'Switch language to Marathi'
    },
    nav: {
      home: 'Home',
      services: 'Services',
      about: 'About',
      process: 'Process',
      contact: 'Contact',
      cta: 'Get Started'
    },
    hero: {
      badge: '🇮🇳 Digital India Initiative',
      title: 'Smart Digital <span>Solutions</span> for India',
      subtitle: 'Fast, secure, and trusted online services for Aadhaar, PAN, Passport, Documentation, Printing, and Government Applications.',
      explore: 'Explore Services',
      contact: 'Contact Now',
      trust: ['✅ Fast Processing', '🔒 Secure Documentation', '🇮🇳 Digital India Services'],
      stats: ['Customers Served', 'Services Offered', 'Years of Trust'],
      floating: ['Aadhaar', 'PAN Card'],
      scroll: 'Scroll to explore'
    },
    services: {
      tag: 'What We Offer',
      title: 'Our <span class="gradient-text">Services</span>',
      subtitle: 'Choose a service, upload your documents securely, and send your request in minutes.',
      open: 'Open Service',
      cards: {
        aadhaar: {
          title: 'Aadhaar Services',
          description: 'Enrollment, updates, address correction, mobile update, and biometric support.',
          modalDescription: 'Share your Aadhaar request details and supporting document for faster assistance.'
        },
        pan: {
          title: 'PAN Card Services',
          description: 'Apply for new PAN, correct details, or request a lost PAN reissue.',
          modalDescription: 'Send your PAN request and document so our team can begin the next step.'
        },
        passport: {
          title: 'Passport Services',
          description: 'Fresh passport and renewal support with document guidance.',
          modalDescription: 'Tell us the passport type, city, and document details for guided support.'
        },
        printing: {
          title: 'Printing Services',
          description: 'Black and white, color, single-side, double-side, and document printing.',
          modalDescription: 'Upload your file and choose the print options you need.'
        },
        'online-form': {
          title: 'Online Form Services',
          description: 'Government forms, registrations, scholarships, exams, and applications.',
          modalDescription: 'Share the form type, deadline, and documents for accurate online submission help.'
        },
        'tech-support': {
          title: 'Technical Support',
          description: 'Device, software, internet, account, and digital troubleshooting help.',
          modalDescription: 'Describe your device issue and attach a screenshot or file if available.'
        }
      }
    },
    modal: {
      kicker: 'Service Request',
      close: 'Close service form',
      defaultTitle: 'Service Form',
      defaultDescription: 'Submit your details and our team will contact you shortly.'
    },
    features: {
      tag: 'Why Choose Us',
      title: 'Trusted by <span class="gradient-text">Thousands</span>',
      subtitle: 'We combine local trust with digital expertise to serve you better',
      cards: [
        ['Fast Processing', 'Quick turnaround on all services with real-time status updates'],
        ['Trusted Service', 'Government-authorized center with verified and secure processes'],
        ['Digital Expertise', 'Tech-enabled solutions with expert guidance at every step'],
        ['Customer Support', 'Dedicated support team available 6 days a week for assistance'],
        ['Secure Documentation', 'All documents handled with strict confidentiality and care'],
        ['Affordable Pricing', 'Transparent pricing with no hidden charges, value for money']
      ]
    },
    about: {
      tag: 'About Us',
      badge1: '📍 Local & Trusted',
      badge2: '✅ Gov. Authorized',
      title: 'Bridging <span class="gradient-text">Digital India</span> to Your Doorstep',
      text: 'Pandurang Online Services is a trusted local digital service center committed to making government and online services accessible to every citizen. We bring technology and community together.',
      list: [
        'Government-authorized service provider',
        'Expert staff with deep knowledge of e-governance',
        'Serving the local community with integrity since day one',
        'Digital India mission aligned operations'
      ],
      tagline: '"Smart Solutions · Digital India · Trust Always"'
    },
    process: {
      tag: 'How It Works',
      title: 'Simple <span class="gradient-text">4-Step Process</span>',
      subtitle: 'From document submission to final delivery — we make it seamless',
      steps: [
        ['Submit Documents', 'Bring your required documents to our center or share digitally'],
        ['Verification', 'Our experts verify all details for accuracy and completeness'],
        ['Online Processing', 'We handle all digital submissions and portal interactions'],
        ['Delivery & Done', 'Receive your completed document or acknowledgment receipt']
      ]
    },
    testimonials: {
      tag: 'Customer Reviews',
      title: 'What Our <span class="gradient-text">Customers Say</span>',
      cards: [
        ['"Got my Aadhaar updated within a day! Very professional staff and quick service. Highly recommended."', 'Aadhaar Services'],
        ['"पॅन कार्डसाठी अर्ज करण्याची प्रक्रिया खूप सोपी होती. त्यांनी सर्व काही हाताळले आणि मला ते फक्त एका आठवड्यात मिळाले. उत्तम काम!"', 'PAN Card Services'],
        ['"Passport application done without any hassle. The team was very helpful and guided me step by step."', 'Passport Application'],
        ['"परिसरातील सर्वोत्तम प्रिंटिंग आणि स्कॅनिंग सेंटर. परवडणारे दर आणि उत्कृष्ट दर्जाचे काम."', 'Printing Services'],
        ['"Very trustworthy center. Helped my father with his government registration. Efficient and polite staff."', 'Govt. Registration']
      ],
      previous: 'Previous',
      next: 'Next'
    },
    faq: {
      tag: 'FAQ',
      title: 'Frequently Asked <span class="gradient-text">Questions</span>',
      items: [
        ['What documents are required for Aadhaar update?', 'You need your original Aadhaar card, a valid address proof (electricity bill, ration card, bank passbook), and an identity proof document.'],
        ['How long does PAN card processing take?', 'Standard PAN card processing typically takes 7–15 working days. Expedited options may be available depending on the category.'],
        ['Can I apply for a passport here?', 'Yes! We assist with fresh passport applications, renewals, and Tatkal applications. We handle online portal submissions and document verification.'],
        ['What are your printing charges?', 'Black & White prints start at ₹2/page, color prints from ₹10/page, scanning from ₹5/page. Bulk discounts are available.'],
        ['Do you offer online form filling for scholarships?', 'Yes, we assist with all types of government scholarships, Mahaswayam, Mahajobs, and other state and central government online forms.'],
        ['What are your business hours?', 'We are open Monday to Friday, 9:00 AM to 5:00 PM. We remain closed on public holidays.']
      ]
    },
    contact: {
      tag: 'Get In Touch',
      title: 'Contact <span class="gradient-text">Us</span>',
      subtitle: "We're here to help. Reach out through any of the channels below.",
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      addressValue: 'At Post Takali Dhokeshwar Tal. Parner, Dist. Ahilyanagar',
      hours: 'Hours',
      hoursValue: 'Mon–Fri: 9:00 AM – 5:00 PM',
      whatsapp: 'Chat on WhatsApp',
      mapPlace: 'Takali Dhokeshwar, Maharashtra',
      mapLink: 'Open in Google Maps →',
      formTitle: 'Send us a Message',
      placeholders: {
        name: 'Your Full Name',
        phone: 'Phone Number',
        email: 'Email Address',
        message: 'Your message or query...'
      },
      selectDefault: 'Select Service',
      submit: 'Send Message',
      sending: 'Sending...',
      loading: 'Sending your message securely...',
      success: "Message sent! We'll contact you shortly.",
      errors: {
        name: 'Please enter your full name.',
        phone: 'Please enter a valid 10-digit Indian mobile number.',
        email: 'Please enter a valid email address.',
        submit: 'Unable to send your message right now. Please try again.'
      }
    },
    footer: {
      brand: 'Your trusted partner for all digital and government services. Empowering citizens with technology.',
      quickLinks: 'Quick Links',
      ourServices: 'Our Services',
      contact: 'Contact',
      address: '📍 At Post Takali Dhokeshwar Tal. Parner, Dist. Ahilyanagar',
      copyright: '© 2025 Pandurang Online Services. All rights reserved.',
      digitalIndia: '🇮🇳 Proud contributor to <strong>Digital India</strong> — Smart Solutions · Trust Always',
      hours: '🕐 Mon–Fri: 9AM – 5PM'
    },
    form: {
      labels: {
        'Full Name': 'Full Name',
        'Phone Number': 'Phone Number',
        Email: 'Email',
        'Aadhaar Service Type': 'Aadhaar Service Type',
        'PAN Service Type': 'PAN Service Type',
        'Passport Type': 'Passport Type',
        City: 'City',
        'Print Type': 'Print Type',
        'Print Side': 'Print Side',
        'Number of Copies': 'Number of Copies',
        'Form Type': 'Form Type',
        Deadline: 'Deadline',
        'Upload Document': 'Upload Document',
        'Upload Documents': 'Upload Documents',
        'Upload File': 'Upload File',
        Message: 'Message',
        'Additional Instructions': 'Additional Instructions',
        'Device Type': 'Device Type',
        'Problem Description': 'Problem Description',
        'Upload Screenshot/File': 'Upload Screenshot/File'
      },
      options: {
        'New Enrollment': 'New Enrollment',
        'Aadhaar Update': 'Aadhaar Update',
        'Address Correction': 'Address Correction',
        'Mobile Number Update': 'Mobile Number Update',
        'Biometric Update': 'Biometric Update',
        'New PAN': 'New PAN',
        'PAN Correction': 'PAN Correction',
        'Lost PAN Reissue': 'Lost PAN Reissue',
        'New Passport': 'New Passport',
        Renewal: 'Renewal',
        'Black & White': 'Black & White',
        'Color Print': 'Color Print',
        'Single Side': 'Single Side',
        'Double Side': 'Double Side',
        'Passport Application': 'Passport Application',
        'Online Form Filling': 'Online Form Filling',
        'Printing & Scanning': 'Printing & Scanning',
        'Internet Services': 'Internet Services',
        'Tech Support': 'Tech Support',
        'Government Registration': 'Government Registration',
        Other: 'Other'
      },
      selectPrefix: 'Select',
      writeDetails: 'Write details here...',
      uploadStrong: 'Choose file or drag it here',
      uploadHelp: 'PDF, JPG, PNG, or DOCX up to 5 MB.',
      uploadReady: 'Ready to submit',
      uploadPreparing: 'Preparing upload',
      submit: 'Submit Request',
      preparingFile: 'Preparing File...',
      submitting: 'Submitting...',
      statuses: {
        submitting: 'Submitting your request securely...',
        success: 'Request submitted successfully. Our team will contact you shortly.',
        error: 'Unable to submit right now. Please check your internet connection and try again.'
      },
      errors: {
        required: 'This field is required.',
        phone: 'Enter a valid 10-digit Indian mobile number.',
        email: 'Enter a valid email address.',
        fileType: 'Only PDF, JPG, PNG, or DOCX files are supported.',
        fileSize: 'File size must be 5 MB or less.',
        fileRead: 'Unable to read the selected file.',
        fileConvert: 'Unable to convert the selected file to Base64.',
        fileGeneric: 'Please upload a valid PDF, JPG, PNG, or DOCX file under 5 MB.',
        validPrefix: 'Please enter a valid',
        min: 'Value must be at least'
      }
    }
  },
  mr: {
    meta: {
      title: 'पांडुरंग ऑनलाइन सर्व्हिसेस – रोजच्या भारतासाठी स्मार्ट डिजिटल सोल्यूशन्स'
    },
    language: {
      buttonLabel: 'Switch language to English'
    },
    nav: {
      home: 'मुख्यपृष्ठ',
      services: 'सेवा',
      about: 'आमच्याबद्दल',
      process: 'प्रक्रिया',
      contact: 'संपर्क',
      cta: 'सुरू करा'
    },
    hero: {
      badge: '🇮🇳 डिजिटल इंडिया उपक्रम',
      title: 'भारतासाठी स्मार्ट डिजिटल <span>सोल्यूशन्स</span>',
      subtitle: 'आधार, पॅन, पासपोर्ट, डॉक्युमेंटेशन, प्रिंटिंग आणि सरकारी अर्जांसाठी जलद, सुरक्षित आणि विश्वासार्ह ऑनलाइन सेवा.',
      explore: 'सेवा पाहा',
      contact: 'आता संपर्क करा',
      trust: ['✅ जलद प्रक्रिया', '🔒 सुरक्षित कागदपत्रे', '🇮🇳 डिजिटल इंडिया सेवा'],
      stats: ['सेवा घेतलेले ग्राहक', 'उपलब्ध सेवा', 'वर्षांचा विश्वास'],
      floating: ['आधार', 'पॅन कार्ड'],
      scroll: 'पुढे पाहण्यासाठी स्क्रोल करा'
    },
    services: {
      tag: 'आम्ही काय देतो',
      title: 'आमच्या <span class="gradient-text">सेवा</span>',
      subtitle: 'सेवा निवडा, कागदपत्रे सुरक्षितपणे अपलोड करा आणि काही मिनिटांत विनंती पाठवा.',
      open: 'सेवा उघडा',
      cards: {
        aadhaar: {
          title: 'आधार सेवा',
          description: 'नवीन नोंदणी, अपडेट, पत्ता दुरुस्ती, मोबाइल अपडेट आणि बायोमेट्रिक मदत.',
          modalDescription: 'जलद मदतीसाठी तुमच्या आधार सेवेसंबंधी तपशील आणि कागदपत्र शेअर करा.'
        },
        pan: {
          title: 'पॅन कार्ड सेवा',
          description: 'नवीन पॅन, दुरुस्ती किंवा हरवलेल्या पॅनचे पुनर्मुद्रण सहज करा.',
          modalDescription: 'तुमची पॅन विनंती आणि कागदपत्र पाठवा, आमची टीम पुढची प्रक्रिया सुरू करेल.'
        },
        passport: {
          title: 'पासपोर्ट सेवा',
          description: 'नवीन पासपोर्ट आणि नूतनीकरणासाठी कागदपत्र मार्गदर्शनासह मदत.',
          modalDescription: 'पासपोर्ट प्रकार, शहर आणि कागदपत्रांचे तपशील सांगा.'
        },
        printing: {
          title: 'प्रिंटिंग सेवा',
          description: 'ब्लॅक अँड व्हाइट, कलर, सिंगल-साइड, डबल-साइड आणि डॉक्युमेंट प्रिंटिंग.',
          modalDescription: 'तुमची फाइल अपलोड करा आणि आवश्यक प्रिंट पर्याय निवडा.'
        },
        'online-form': {
          title: 'ऑनलाइन फॉर्म सेवा',
          description: 'सरकारी फॉर्म, नोंदणी, शिष्यवृत्ती, परीक्षा आणि अर्ज.',
          modalDescription: 'अचूक ऑनलाइन सबमिशनसाठी फॉर्म प्रकार, अंतिम तारीख आणि कागदपत्रे शेअर करा.'
        },
        'tech-support': {
          title: 'तांत्रिक मदत',
          description: 'डिव्हाइस, सॉफ्टवेअर, इंटरनेट, खाते आणि डिजिटल समस्यांसाठी मदत.',
          modalDescription: 'तुमच्या डिव्हाइसची समस्या लिहा आणि स्क्रीनशॉट किंवा फाइल असल्यास जोडा.'
        }
      }
    },
    modal: {
      kicker: 'सेवा विनंती',
      close: 'सेवा फॉर्म बंद करा',
      defaultTitle: 'सेवा फॉर्म',
      defaultDescription: 'तुमचे तपशील पाठवा, आमची टीम लवकरच संपर्क करेल.'
    },
    features: {
      tag: 'आम्हाला का निवडाल',
      title: '<span class="gradient-text">हजारो</span> ग्राहकांचा विश्वास',
      subtitle: 'स्थानिक विश्वास आणि डिजिटल कौशल्य यांचे मिश्रण करून आम्ही अधिक चांगली सेवा देतो',
      cards: [
        ['जलद प्रक्रिया', 'सर्व सेवांवर जलद काम आणि रिअल-टाइम स्टेटस अपडेट'],
        ['विश्वासार्ह सेवा', 'प्रमाणित आणि सुरक्षित प्रक्रियांसह सरकारी-अधिकृत केंद्र'],
        ['डिजिटल कौशल्य', 'प्रत्येक टप्प्यावर तज्ञ मार्गदर्शनासह टेक-सक्षम उपाय'],
        ['ग्राहक सहाय्य', 'मदतीसाठी आठवड्यातून 6 दिवस समर्पित सपोर्ट टीम'],
        ['सुरक्षित कागदपत्रे', 'सर्व कागदपत्रे गोपनीयता आणि काळजीपूर्वक हाताळली जातात'],
        ['परवडणारे दर', 'लपविलेले शुल्क नाही, पारदर्शक आणि किफायतशीर सेवा']
      ]
    },
    about: {
      tag: 'आमच्याबद्दल',
      badge1: '📍 स्थानिक आणि विश्वासार्ह',
      badge2: '✅ सरकारी अधिकृत',
      title: '<span class="gradient-text">डिजिटल इंडिया</span> तुमच्या दारात',
      text: 'पांडुरंग ऑनलाइन सर्व्हिसेस हे एक विश्वासार्ह स्थानिक डिजिटल सेवा केंद्र आहे. प्रत्येक नागरिकाला सरकारी आणि ऑनलाइन सेवा सहज उपलब्ध करून देणे हे आमचे उद्दिष्ट आहे.',
      list: [
        'सरकारी-अधिकृत सेवा प्रदाता',
        'ई-गव्हर्नन्सचे सखोल ज्ञान असलेला तज्ञ स्टाफ',
        'पहिल्या दिवसापासून प्रामाणिकपणे स्थानिक समाजाची सेवा',
        'डिजिटल इंडिया मिशनशी जोडलेले कामकाज'
      ],
      tagline: '"स्मार्ट सोल्यूशन्स · डिजिटल इंडिया · कायम विश्वास"'
    },
    process: {
      tag: 'काम कसे होते',
      title: 'सोपी <span class="gradient-text">4-टप्प्यांची प्रक्रिया</span>',
      subtitle: 'कागदपत्र सादरीकरणापासून अंतिम डिलिव्हरीपर्यंत आम्ही प्रक्रिया सोपी करतो',
      steps: [
        ['कागदपत्रे सबमिट करा', 'आवश्यक कागदपत्रे आमच्या केंद्रात आणा किंवा डिजिटल स्वरूपात शेअर करा'],
        ['पडताळणी', 'अचूकता आणि पूर्णतेसाठी आमचे तज्ञ सर्व तपशील तपासतात'],
        ['ऑनलाइन प्रक्रिया', 'डिजिटल सबमिशन आणि पोर्टलवरील प्रक्रिया आम्ही हाताळतो'],
        ['डिलिव्हरी आणि पूर्ण', 'पूर्ण झालेले कागदपत्र किंवा पावती मिळवा']
      ]
    },
    testimonials: {
      tag: 'ग्राहक अभिप्राय',
      title: 'आमचे <span class="gradient-text">ग्राहक काय म्हणतात</span>',
      cards: [
        ['"माझा आधार एका दिवसात अपडेट झाला! स्टाफ खूप प्रोफेशनल आणि सेवा जलद होती. नक्कीच शिफारस करतो."', 'आधार सेवा'],
        ['"पॅन कार्डसाठी अर्ज करण्याची प्रक्रिया खूप सोपी होती. त्यांनी सर्व काही हाताळले आणि मला ते फक्त एका आठवड्यात मिळाले. उत्तम काम!"', 'पॅन कार्ड सेवा'],
        ['"पासपोर्ट अर्ज कोणत्याही त्रासाशिवाय झाला. टीमने मला प्रत्येक टप्प्यावर व्यवस्थित मार्गदर्शन केले."', 'पासपोर्ट अर्ज'],
        ['"परिसरातील सर्वोत्तम प्रिंटिंग आणि स्कॅनिंग सेंटर. परवडणारे दर आणि उत्कृष्ट दर्जाचे काम."', 'प्रिंटिंग सेवा'],
        ['"खूप विश्वासार्ह केंद्र. माझ्या वडिलांच्या सरकारी नोंदणीसाठी मदत केली. कार्यक्षम आणि नम्र स्टाफ."', 'सरकारी नोंदणी']
      ],
      previous: 'मागील',
      next: 'पुढील'
    },
    faq: {
      tag: 'वारंवार विचारले जाणारे प्रश्न',
      title: 'वारंवार विचारले जाणारे <span class="gradient-text">प्रश्न</span>',
      items: [
        ['आधार अपडेटसाठी कोणती कागदपत्रे लागतात?', 'तुमचे मूळ आधार कार्ड, वैध पत्ता पुरावा (वीज बिल, रेशन कार्ड, बँक पासबुक) आणि ओळखपत्र आवश्यक आहे.'],
        ['पॅन कार्ड प्रक्रिया किती वेळ घेते?', 'सामान्य पॅन कार्ड प्रक्रिया साधारण 7–15 कामकाजाच्या दिवसांत पूर्ण होते. श्रेणीनुसार जलद पर्याय उपलब्ध असू शकतात.'],
        ['मी येथे पासपोर्टसाठी अर्ज करू शकतो का?', 'होय! आम्ही नवीन पासपोर्ट, नूतनीकरण आणि तत्काळ अर्जांसाठी मदत करतो. ऑनलाइन पोर्टल सबमिशन आणि कागदपत्र पडताळणी आम्ही हाताळतो.'],
        ['प्रिंटिंगचे दर काय आहेत?', 'ब्लॅक अँड व्हाइट प्रिंट ₹2/पान पासून, कलर प्रिंट ₹10/पान पासून, स्कॅनिंग ₹5/पान पासून. मोठ्या प्रमाणात सवलत उपलब्ध आहे.'],
        ['शिष्यवृत्तीचे ऑनलाइन फॉर्म भरता का?', 'होय, आम्ही सरकारी शिष्यवृत्ती, महास्वयं, महाजॉब्स आणि इतर राज्य व केंद्र सरकारच्या ऑनलाइन फॉर्मसाठी मदत करतो.'],
        ['तुमची कामाची वेळ काय आहे?', 'आम्ही सोमवार ते शुक्रवार सकाळी 9:00 ते संध्याकाळी 5:00 पर्यंत खुले असतो. सार्वजनिक सुट्टीच्या दिवशी बंद असतो.']
      ]
    },
    contact: {
      tag: 'संपर्क करा',
      title: 'आमच्याशी <span class="gradient-text">संपर्क</span>',
      subtitle: 'आम्ही मदतीसाठी आहोत. खालील कोणत्याही माध्यमातून संपर्क साधा.',
      phone: 'फोन',
      email: 'ईमेल',
      address: 'पत्ता',
      addressValue: 'पोस्ट टाकळी ढोकेश्वर, ता. पारनेर, जि. अहिल्यानगर',
      hours: 'वेळ',
      hoursValue: 'सोम–शुक्र: सकाळी 9:00 – संध्याकाळी 5:00',
      whatsapp: 'WhatsApp वर चॅट करा',
      mapPlace: 'टाकळी ढोकेश्वर, महाराष्ट्र',
      mapLink: 'Google Maps मध्ये उघडा →',
      formTitle: 'आम्हाला संदेश पाठवा',
      placeholders: {
        name: 'तुमचे पूर्ण नाव',
        phone: 'फोन नंबर',
        email: 'ईमेल पत्ता',
        message: 'तुमचा संदेश किंवा चौकशी...'
      },
      selectDefault: 'सेवा निवडा',
      submit: 'संदेश पाठवा',
      sending: 'पाठवत आहे...',
      loading: 'तुमचा संदेश सुरक्षितपणे पाठवत आहे...',
      success: 'संदेश पाठवला! आम्ही लवकरच संपर्क करू.',
      errors: {
        name: 'कृपया तुमचे पूर्ण नाव लिहा.',
        phone: 'कृपया वैध 10 अंकी भारतीय मोबाइल नंबर लिहा.',
        email: 'कृपया वैध ईमेल पत्ता लिहा.',
        submit: 'सध्या संदेश पाठवता आला नाही. कृपया पुन्हा प्रयत्न करा.'
      }
    },
    footer: {
      brand: 'सर्व डिजिटल आणि सरकारी सेवांसाठी तुमचा विश्वासार्ह भागीदार. तंत्रज्ञानाने नागरिकांना सक्षम बनवतो.',
      quickLinks: 'जलद दुवे',
      ourServices: 'आमच्या सेवा',
      contact: 'संपर्क',
      address: '📍 पोस्ट टाकळी ढोकेश्वर, ता. पारनेर, जि. अहिल्यानगर',
      copyright: '© 2025 पांडुरंग ऑनलाइन सर्व्हिसेस. सर्व हक्क राखीव.',
      digitalIndia: '🇮🇳 <strong>डिजिटल इंडिया</strong> चे अभिमानी योगदानकर्ते — स्मार्ट सोल्यूशन्स · कायम विश्वास',
      hours: '🕐 सोम–शुक्र: सकाळी 9 – संध्याकाळी 5'
    },
    form: {
      labels: {
        'Full Name': 'पूर्ण नाव',
        'Phone Number': 'फोन नंबर',
        Email: 'ईमेल',
        'Aadhaar Service Type': 'आधार सेवा प्रकार',
        'PAN Service Type': 'पॅन सेवा प्रकार',
        'Passport Type': 'पासपोर्ट प्रकार',
        City: 'शहर',
        'Print Type': 'प्रिंट प्रकार',
        'Print Side': 'प्रिंट बाजू',
        'Number of Copies': 'प्रतींची संख्या',
        'Form Type': 'फॉर्म प्रकार',
        Deadline: 'अंतिम तारीख',
        'Upload Document': 'कागदपत्र अपलोड करा',
        'Upload Documents': 'कागदपत्रे अपलोड करा',
        'Upload File': 'फाइल अपलोड करा',
        Message: 'संदेश',
        'Additional Instructions': 'अतिरिक्त सूचना',
        'Device Type': 'डिव्हाइस प्रकार',
        'Problem Description': 'समस्येचे वर्णन',
        'Upload Screenshot/File': 'स्क्रीनशॉट/फाइल अपलोड करा'
      },
      options: {
        'New Enrollment': 'नवीन नोंदणी',
        'Aadhaar Update': 'आधार अपडेट',
        'Address Correction': 'पत्ता दुरुस्ती',
        'Mobile Number Update': 'मोबाइल नंबर अपडेट',
        'Biometric Update': 'बायोमेट्रिक अपडेट',
        'New PAN': 'नवीन पॅन',
        'PAN Correction': 'पॅन दुरुस्ती',
        'Lost PAN Reissue': 'हरवलेले पॅन पुन्हा जारी',
        'New Passport': 'नवीन पासपोर्ट',
        Renewal: 'नूतनीकरण',
        'Black & White': 'ब्लॅक अँड व्हाइट',
        'Color Print': 'कलर प्रिंट',
        'Single Side': 'सिंगल साइड',
        'Double Side': 'डबल साइड',
        'Passport Application': 'पासपोर्ट अर्ज',
        'Online Form Filling': 'ऑनलाइन फॉर्म भरणे',
        'Printing & Scanning': 'प्रिंटिंग आणि स्कॅनिंग',
        'Internet Services': 'इंटरनेट सेवा',
        'Tech Support': 'तांत्रिक मदत',
        'Government Registration': 'सरकारी नोंदणी',
        Other: 'इतर'
      },
      selectPrefix: 'निवडा',
      writeDetails: 'तपशील येथे लिहा...',
      uploadStrong: 'फाइल निवडा किंवा येथे ड्रॅग करा',
      uploadHelp: 'PDF, JPG, PNG किंवा DOCX 5 MB पर्यंत.',
      uploadReady: 'सबमिट करण्यास तयार',
      uploadPreparing: 'अपलोडची तयारी सुरू',
      submit: 'विनंती सबमिट करा',
      preparingFile: 'फाइल तयार करत आहे...',
      submitting: 'सबमिट करत आहे...',
      statuses: {
        submitting: 'तुमची विनंती सुरक्षितपणे सबमिट करत आहे...',
        success: 'विनंती यशस्वीपणे सबमिट झाली. आमची टीम लवकरच संपर्क करेल.',
        error: 'सध्या सबमिट करता आले नाही. कृपया इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.'
      },
      errors: {
        required: 'हे फील्ड आवश्यक आहे.',
        phone: 'वैध 10 अंकी भारतीय मोबाइल नंबर लिहा.',
        email: 'वैध ईमेल पत्ता लिहा.',
        fileType: 'फक्त PDF, JPG, PNG किंवा DOCX फाइल समर्थित आहेत.',
        fileSize: 'फाइल आकार 5 MB किंवा त्यापेक्षा कमी असावा.',
        fileRead: 'निवडलेली फाइल वाचता आली नाही.',
        fileConvert: 'निवडलेली फाइल Base64 मध्ये रूपांतरित करता आली नाही.',
        fileGeneric: 'कृपया 5 MB पेक्षा कमी वैध PDF, JPG, PNG किंवा DOCX फाइल अपलोड करा.',
        validPrefix: 'कृपया वैध माहिती द्या:',
        min: 'किमान मूल्य'
      }
    }
  }
};

function i18n(path) {
  const readPath = (language) => path.split('.').reduce((value, key) => value?.[key], UI_TEXT[language]);
  return readPath(currentLanguage) ?? readPath('en') ?? path;
}

function translateFieldLabel(label) {
  return i18n(`form.labels.${label}`);
}

function translateOption(option) {
  return i18n(`form.options.${option}`);
}

function setText(selector, value, all = false) {
  const elements = all ? document.querySelectorAll(selector) : [document.querySelector(selector)];
  elements.forEach(element => {
    if (element) element.textContent = value;
  });
}

function setHtml(selector, value, all = false) {
  const elements = all ? document.querySelectorAll(selector) : [document.querySelector(selector)];
  elements.forEach(element => {
    if (element) element.innerHTML = value;
  });
}

function setIndexedContent(selector, values, mode = 'text') {
  document.querySelectorAll(selector).forEach((element, index) => {
    if (values[index] === undefined) return;
    if (mode === 'html') element.innerHTML = values[index];
    else element.textContent = values[index];
  });
}

function updateContactSelectLanguage() {
  const select = document.getElementById('service');
  if (!select) return;
  const optionValues = Array.from(select.options).map(option => option.value);
  Array.from(select.options).forEach((option, index) => {
    if (index === 0) {
      option.textContent = i18n('contact.selectDefault');
      return;
    }
    option.textContent = translateOption(optionValues[index]);
  });
}

function applyLanguage(language, shouldPersist = true) {
  currentLanguage = language === 'mr' ? 'mr' : 'en';
  if (shouldPersist) localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);

  document.documentElement.lang = currentLanguage === 'mr' ? 'mr' : 'en';
  document.body.dataset.language = currentLanguage;
  document.title = i18n('meta.title');

  if (languageToggle) {
    languageToggle.dataset.language = currentLanguage;
    languageToggle.setAttribute('aria-label', i18n('language.buttonLabel'));
  }

  setText('.nav-links a[href="#home"]', i18n('nav.home'));
  setText('.nav-links a[href="#services"]', i18n('nav.services'));
  setText('.nav-links a[href="#about"]', i18n('nav.about'));
  setText('.nav-links a[href="#process"]', i18n('nav.process'));
  setText('.nav-links a[href="#contact"]', i18n('nav.contact'));
  setText('.nav-cta', i18n('nav.cta'));

  setText('.hero-badge', i18n('hero.badge'));
  setHtml('.hero-title', i18n('hero.title'));
  setText('.hero-subtitle', i18n('hero.subtitle'));
  setText('.hero-btn.primary', i18n('hero.explore'));
  setText('.hero-btn.secondary', i18n('hero.contact'));
  setIndexedContent('.hero-trust .trust-item', i18n('hero.trust'));
  setIndexedContent('.hero-stats .stat-item p', i18n('hero.stats'));
  setIndexedContent('.floating-card span:last-child', i18n('hero.floating'));
  setText('.hero-scroll-hint span', i18n('hero.scroll'));

  setText('#services .section-tag', i18n('services.tag'));
  setHtml('#services .section-title', i18n('services.title'));
  setText('#services .section-subtitle', i18n('services.subtitle'));
  Object.keys(serviceConfigs).forEach(key => {
    setText(`#services .service-card[data-service="${key}"] h3`, i18n(`services.cards.${key}.title`));
    setText(`#services .service-card[data-service="${key}"] p`, i18n(`services.cards.${key}.description`));
    setText(`#services .service-card[data-service="${key}"] .service-open-btn`, i18n('services.open'));
  });

  setText('.modal-kicker', i18n('modal.kicker'));
  const modalClose = document.querySelector('.modal-close-btn');
  if (modalClose) modalClose.setAttribute('aria-label', i18n('modal.close'));
  if (activeServiceKey && serviceModal?.classList.contains('open')) {
    renderServiceForm(activeServiceKey);
  } else {
    setText('#serviceModalTitle', i18n('modal.defaultTitle'));
    setText('#serviceModalDescription', i18n('modal.defaultDescription'));
  }

  setText('.why-us .section-tag', i18n('features.tag'));
  setHtml('.why-us .section-title', i18n('features.title'));
  setText('.why-us .section-subtitle', i18n('features.subtitle'));
  setIndexedContent('.feature-card h3', i18n('features.cards').map(card => card[0]));
  setIndexedContent('.feature-card p', i18n('features.cards').map(card => card[1]));

  setText('.about-content .section-tag', i18n('about.tag'));
  setText('.about-badge.ab1', i18n('about.badge1'));
  setText('.about-badge.ab2', i18n('about.badge2'));
  setHtml('.about-content .section-title', i18n('about.title'));
  setText('.about-text', i18n('about.text'));
  document.querySelectorAll('.about-list li').forEach((item, index) => {
    const check = item.querySelector('.check')?.outerHTML || '<span class="check">✓</span>';
    item.innerHTML = `${check} ${escapeHtml(i18n('about.list')[index] || '')}`;
  });
  setText('.about-tagline', i18n('about.tagline'));

  setText('.process .section-tag', i18n('process.tag'));
  setHtml('.process .section-title', i18n('process.title'));
  setText('.process .section-subtitle', i18n('process.subtitle'));
  setIndexedContent('.process-step h3', i18n('process.steps').map(step => step[0]));
  setIndexedContent('.process-step p', i18n('process.steps').map(step => step[1]));

  setText('.testimonials .section-tag', i18n('testimonials.tag'));
  setHtml('.testimonials .section-title', i18n('testimonials.title'));
  setIndexedContent('.testimonial-card > p', i18n('testimonials.cards').map(card => card[0]));
  setIndexedContent('.testimonial-card .customer span', i18n('testimonials.cards').map(card => card[1]));
  if (prevBtn) prevBtn.setAttribute('aria-label', i18n('testimonials.previous'));
  if (nextBtn) nextBtn.setAttribute('aria-label', i18n('testimonials.next'));

  setText('.faq .section-tag', i18n('faq.tag'));
  setHtml('.faq .section-title', i18n('faq.title'));
  document.querySelectorAll('.faq-item').forEach((item, index) => {
    const faq = i18n('faq.items')[index];
    if (!faq) return;
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer p');
    if (question) question.innerHTML = `${escapeHtml(faq[0])} <span class="faq-arrow">▼</span>`;
    if (answer) answer.textContent = faq[1];
  });

  setText('.contact .section-tag', i18n('contact.tag'));
  setHtml('.contact .section-title', i18n('contact.title'));
  setText('.contact .section-subtitle', i18n('contact.subtitle'));
  const infoCards = document.querySelectorAll('.info-card');
  const infoLabels = [i18n('contact.phone'), i18n('contact.email'), i18n('contact.address'), i18n('contact.hours')];
  infoCards.forEach((card, index) => {
    const heading = card.querySelector('h4');
    if (heading) heading.textContent = infoLabels[index] || heading.textContent;
  });
  const hours = infoCards[3]?.querySelector('p');
  const address = infoCards[2]?.querySelector('p');
  if (address) address.textContent = i18n('contact.addressValue');
  if (hours) hours.textContent = i18n('contact.hoursValue');
  setHtml('.whatsapp-btn', `<span>💬</span> ${escapeHtml(i18n('contact.whatsapp'))}`);
  setText('.map-placeholder p', i18n('contact.mapPlace'));
  setText('.map-link', i18n('contact.mapLink'));
  setText('.contact-form h3', i18n('contact.formTitle'));
  const contactPlaceholders = {
    name: i18n('contact.placeholders.name'),
    phone: i18n('contact.placeholders.phone'),
    email: i18n('contact.placeholders.email'),
    message: i18n('contact.placeholders.message')
  };
  Object.entries(contactPlaceholders).forEach(([id, placeholder]) => {
    const input = document.getElementById(id);
    if (input) input.setAttribute('placeholder', placeholder);
  });
  updateContactSelectLanguage();
  setContactSubmitting(false);
  if (contactStatus && !contactStatus.classList.contains('error') && !contactStatus.classList.contains('loading')) {
    setContactStatus('success', i18n('contact.success'));
    contactStatus.className = 'form-success';
  }

  setText('.footer-brand p', i18n('footer.brand'));
  setIndexedContent('.footer-links h4', [i18n('footer.quickLinks'), i18n('footer.ourServices')]);
  setText('.footer-contact h4', i18n('footer.contact'));
  setText('.footer-grid > .footer-links:nth-child(2) a[href="#home"]', i18n('nav.home'));
  setText('.footer-grid > .footer-links:nth-child(2) a[href="#services"]', i18n('nav.services'));
  setText('.footer-grid > .footer-links:nth-child(2) a[href="#about"]', i18n('nav.about'));
  setText('.footer-grid > .footer-links:nth-child(2) a[href="#process"]', i18n('nav.process'));
  setText('.footer-grid > .footer-links:nth-child(2) a[href="#contact"]', i18n('nav.contact'));
  const footerServiceLinks = document.querySelectorAll('.footer-grid > .footer-links:nth-child(3) a[href="#services"]');
  const serviceKeys = ['aadhaar', 'pan', 'passport', 'printing', 'online-form', 'tech-support'];
  footerServiceLinks.forEach((link, index) => {
    link.textContent = i18n(`services.cards.${serviceKeys[index]}.title`);
  });
  const footerContactLines = document.querySelectorAll('.footer-contact p');
  if (footerContactLines[2]) footerContactLines[2].textContent = i18n('footer.address');
  if (footerContactLines[3]) footerContactLines[3].textContent = i18n('footer.hours');
  setText('.footer-bottom p:first-child', i18n('footer.copyright'));
  setHtml('.digital-india-line', i18n('footer.digitalIndia'));
}

if (languageToggle) {
  languageToggle.addEventListener('click', () => {
    document.body.classList.add('language-switching');
    applyLanguage(currentLanguage === 'en' ? 'mr' : 'en');
    window.setTimeout(() => document.body.classList.remove('language-switching'), 180);
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getServiceIconMarkup(serviceKey) {
  const icon = document.querySelector(`.service-card[data-service="${serviceKey}"] .service-icon`);
  return icon ? icon.outerHTML : '';
}

function renderServiceField(field) {
  const fieldId = `service_${field.name}`;
  const labelText = translateFieldLabel(field.label);
  const requiredMark = field.required ? '<span>*</span>' : '';
  const requiredAttr = field.required ? 'required' : '';
  const fullClass = field.full ? ' full' : '';
  const autocomplete = field.autocomplete ? ` autocomplete="${field.autocomplete}"` : '';

  if (field.type === 'select') {
    const options = field.options
      .map(option => `<option value="${escapeHtml(option)}">${escapeHtml(translateOption(option))}</option>`)
      .join('');

    return `
      <div class="service-field${fullClass}" data-field="${field.name}">
        <label for="${fieldId}">${escapeHtml(labelText)} ${requiredMark}</label>
        <select class="service-select" id="${fieldId}" name="${field.name}" ${requiredAttr}>
          <option value="" disabled selected>${escapeHtml(i18n('form.selectPrefix'))} ${escapeHtml(labelText)}</option>
          ${options}
        </select>
        <small class="service-field-error">${escapeHtml(i18n('form.errors.validPrefix'))} ${escapeHtml(labelText.toLowerCase())}.</small>
      </div>
    `;
  }

  if (field.type === 'textarea') {
    return `
      <div class="service-field${fullClass}" data-field="${field.name}">
        <label for="${fieldId}">${escapeHtml(labelText)} ${requiredMark}</label>
        <textarea class="service-textarea" id="${fieldId}" name="${field.name}" rows="4" ${requiredAttr} placeholder="${escapeHtml(i18n('form.writeDetails'))}"></textarea>
        <small class="service-field-error">${escapeHtml(i18n('form.errors.validPrefix'))} ${escapeHtml(labelText.toLowerCase())}.</small>
      </div>
    `;
  }

  if (field.type === 'file') {
    return `
      <div class="service-field full upload-control" data-field="${field.name}">
        <label for="${fieldId}">${escapeHtml(labelText)} ${requiredMark}</label>
        <div class="upload-dropzone" data-upload-dropzone>
          <input class="service-file-input" id="${fieldId}" name="${field.name}" type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" ${requiredAttr}/>
          <div class="upload-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <path d="m17 8-5-5-5 5"/>
              <path d="M12 3v12"/>
            </svg>
          </div>
          <div class="upload-copy">
            <strong>${escapeHtml(i18n('form.uploadStrong'))}</strong>
            <span>${escapeHtml(i18n('form.uploadHelp'))}</span>
          </div>
        </div>
        <div class="upload-file-meta" id="serviceFileMeta"></div>
        <div class="upload-progress" id="serviceUploadProgress">
          <div class="upload-progress-bar" id="serviceUploadProgressBar"></div>
        </div>
        <small class="service-field-error">${escapeHtml(i18n('form.errors.fileGeneric'))}</small>
      </div>
    `;
  }

  const minAttr = field.min ? ` min="${field.min}"` : '';
  const valueAttr = field.value ? ` value="${escapeHtml(field.value)}"` : '';

  return `
    <div class="service-field${fullClass}" data-field="${field.name}">
      <label for="${fieldId}">${escapeHtml(labelText)} ${requiredMark}</label>
      <input class="service-input" id="${fieldId}" name="${field.name}" type="${field.type}" ${requiredAttr}${autocomplete}${minAttr}${valueAttr} placeholder="${escapeHtml(labelText)}"/>
      <small class="service-field-error">${escapeHtml(i18n('form.errors.validPrefix'))} ${escapeHtml(labelText.toLowerCase())}.</small>
    </div>
  `;
}

function renderServiceForm(serviceKey) {
  const config = serviceConfigs[serviceKey];
  if (!config || !serviceRequestForm) return;

  activeServiceKey = serviceKey;
  activeFilePayload = null;
  activeFileReadPromise = null;
  activeFileReadError = null;
  isServiceSubmissionInProgress = false;

  serviceModalIcon.innerHTML = getServiceIconMarkup(serviceKey);
  serviceModalTitle.textContent = i18n(`services.cards.${serviceKey}.title`);
  serviceModalDescription.textContent = i18n(`services.cards.${serviceKey}.modalDescription`);

  serviceRequestForm.innerHTML = `
    ${config.fields.map(renderServiceField).join('')}
    <div class="form-status" id="serviceFormStatus" role="status"></div>
    <div class="service-submit-row">
      <button class="service-submit-btn" type="submit">
        <span class="submit-spinner" aria-hidden="true"></span>
        <span class="submit-label">${escapeHtml(i18n('form.submit'))}</span>
      </button>
    </div>
  `;

  setupServiceUpload();
}

function openServiceModal(serviceKey) {
  if (!serviceModal || !serviceConfigs[serviceKey]) return;
  lastFocusedElement = document.activeElement;
  renderServiceForm(serviceKey);
  serviceModal.classList.add('open');
  serviceModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  setTimeout(() => {
    const firstField = serviceRequestForm.querySelector('input, select, textarea, button');
    if (firstField) firstField.focus();
  }, 80);
}

function closeServiceModal() {
  if (!serviceModal) return;
  serviceModal.classList.remove('open');
  serviceModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  activeServiceKey = null;
  activeFilePayload = null;
  activeFileReadPromise = null;
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

function setUploadProgress(percent) {
  const progress = document.getElementById('serviceUploadProgress');
  const bar = document.getElementById('serviceUploadProgressBar');
  if (!progress || !bar) return;
  progress.classList.add('show');
  bar.style.width = `${Math.max(0, Math.min(percent, 100))}%`;
}

function setFileMeta(message) {
  const meta = document.getElementById('serviceFileMeta');
  if (!meta) return;
  meta.textContent = message;
  meta.classList.toggle('show', Boolean(message));
}

function setServiceStatus(type, message) {
  const status = document.getElementById('serviceFormStatus');
  if (!status) return;
  status.className = `form-status ${type} show`;
  status.textContent = message;
}

function clearServiceStatus() {
  const status = document.getElementById('serviceFormStatus');
  if (!status) return;
  status.className = 'form-status';
  status.textContent = '';
}

function setServiceSubmitting(isSubmitting, label = i18n('form.submit')) {
  const submitBtn = serviceRequestForm?.querySelector('.service-submit-btn');
  const submitLabel = serviceRequestForm?.querySelector('.submit-label');
  if (!submitBtn || !submitLabel) return;
  submitBtn.disabled = isSubmitting;
  submitBtn.classList.toggle('loading', isSubmitting);
  submitLabel.textContent = label;
}

function getFileExtension(fileName) {
  return fileName.split('.').pop().toLowerCase();
}

function isAllowedFile(file) {
  const extension = getFileExtension(file.name);
  return ALLOWED_FILE_EXTENSIONS.includes(extension) || ALLOWED_FILE_TYPES.includes(file.type);
}

function readFileAsBase64(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    console.log('[Service Request] Reading file with FileReader.readAsDataURL()', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    reader.onprogress = event => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error(i18n('form.errors.fileConvert')));
        return;
      }
      console.log('[Service Request] File converted to Base64', {
        fileName: file.name,
        base64Length: base64.length
      });
      resolve(base64);
    };

    reader.onerror = () => reject(new Error(i18n('form.errors.fileRead')));
    reader.readAsDataURL(file);
  });
}

function markServiceFieldInvalid(input, message) {
  const field = input.closest('.service-field');
  const error = field?.querySelector('.service-field-error');
  if (!field) return;
  field.classList.add('invalid');
  if (error && message) error.textContent = message;
}

function clearInvalidState(input) {
  const field = input.closest('.service-field');
  if (field) field.classList.remove('invalid');
}

function resetUploadState() {
  activeFilePayload = null;
  activeFileReadPromise = null;
  activeFileReadError = null;
  setFileMeta('');
  setUploadProgress(0);
  const progress = document.getElementById('serviceUploadProgress');
  if (progress) progress.classList.remove('show');
}

function handleSelectedFile(file, input) {
  clearInvalidState(input);
  clearServiceStatus();
  resetUploadState();

  if (!file) return;

  if (!isAllowedFile(file)) {
    console.warn('[Service Request] Rejected unsupported file type', {
      fileName: file.name,
      fileType: file.type
    });
    input.value = '';
    markServiceFieldInvalid(input, i18n('form.errors.fileType'));
    return;
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    console.warn('[Service Request] Rejected oversized file', {
      fileName: file.name,
      fileSize: file.size
    });
    input.value = '';
    markServiceFieldInvalid(input, i18n('form.errors.fileSize'));
    return;
  }

  setFileMeta(`${file.name} - ${formatFileSize(file.size)} - ${i18n('form.uploadPreparing')}`);
  setUploadProgress(4);
  setServiceSubmitting(true, i18n('form.preparingFile'));
  console.log('[Service Request] Upload preparation started', {
    fileName: file.name,
    fileType: file.type || `application/${getFileExtension(file.name)}`,
    fileSize: file.size
  });

  activeFileReadPromise = readFileAsBase64(file, setUploadProgress)
    .then(base64 => {
      activeFilePayload = {
        fileName: file.name,
        fileType: file.type || `application/${getFileExtension(file.name)}`,
        size: file.size,
        fileBase64: base64
      };
      setUploadProgress(100);
      setFileMeta(`${file.name} - ${formatFileSize(file.size)} - ${i18n('form.uploadReady')}`);
      console.log('[Service Request] Upload file is ready for submission', {
        fileName: activeFilePayload.fileName,
        fileType: activeFilePayload.fileType,
        fileSize: activeFilePayload.size
      });
    })
    .catch(error => {
      activeFileReadError = error;
      console.error('[Service Request] File preparation failed', error);
      input.value = '';
      markServiceFieldInvalid(input, error.message);
    })
    .finally(() => {
      setServiceSubmitting(false);
    });
}

function setupServiceUpload() {
  const fileInput = serviceRequestForm.querySelector('.service-file-input');
  const dropzone = serviceRequestForm.querySelector('[data-upload-dropzone]');
  if (!fileInput || !dropzone) return;

  fileInput.addEventListener('change', () => {
    handleSelectedFile(fileInput.files[0], fileInput);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, event => {
      event.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, event => {
      event.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', event => {
    const file = event.dataTransfer.files[0];
    if (!file) return;
    fileInput.files = event.dataTransfer.files;
    handleSelectedFile(file, fileInput);
  });
}

function validateServiceForm() {
  let isValid = true;
  clearServiceStatus();

  serviceRequestForm.querySelectorAll('.service-field').forEach(field => {
    const input = field.querySelector('input, select, textarea');
    if (!input) return;

    clearInvalidState(input);
    const value = input.type === 'file' ? input.value : input.value.trim();

    if (input.required && !value) {
      markServiceFieldInvalid(input, i18n('form.errors.required'));
      isValid = false;
      return;
    }

    if (input.type === 'tel' && value) {
      const phone = value.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(phone)) {
        markServiceFieldInvalid(input, i18n('form.errors.phone'));
        isValid = false;
      }
    }

    if (input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      markServiceFieldInvalid(input, i18n('form.errors.email'));
      isValid = false;
    }

    if (input.type === 'number' && value && Number(value) < Number(input.min || 0)) {
      markServiceFieldInvalid(input, `${i18n('form.errors.min')} ${input.min}.`);
      isValid = false;
    }
  });

  const firstInvalid = serviceRequestForm.querySelector('.service-field.invalid input, .service-field.invalid select, .service-field.invalid textarea');
  if (firstInvalid) firstInvalid.focus();
  return isValid;
}

function collectServiceValues() {
  const values = {};
  serviceRequestForm.querySelectorAll('input, select, textarea').forEach(input => {
    if (input.type === 'file' || !input.name) return;
    values[input.name] = input.value.trim();
  });
  return values;
}

function buildServicePayload(values) {
  const config = serviceConfigs[activeServiceKey];
  const file = activeFilePayload;
  const message = values.message || '';

  return {
    action: 'createServiceRequest',
    timestamp: new Date().toISOString(),
    service: config.title,
    subservice: values[config.subserviceField] || '',
    name: values.fullName || '',
    phone: (values.phone || '').replace(/\D/g, ''),
    email: values.email || '',
    message,
    fileUrl: '',
    fileName: file?.fileName || '',
    fileType: file?.fileType || '',
    fileBase64: file?.fileBase64 || '',
    status: 'New',
    sheetName: SERVICE_SHEET_NAME,
    folderId: SERVICE_DRIVE_FOLDER_ID,
    uploadedFileUrl: '',
    uploadedFileName: file?.fileName || '',
    fileMimeType: file?.fileType || '',
    fileSize: file?.size || '',
    fields: values
  };
}

async function submitServiceRequest(payload) {
  console.log('[Service Request] Sending request to Google Apps Script', getSafeLogPayload(payload));

  try {
    return await postServiceJson(payload, 'application/json');
  } catch (error) {
    console.error('[Service Request] application/json submission failed', error);

    if (!isLikelyCorsOrPreflightError(error)) {
      throw error;
    }

    console.warn('[Service Request] Retrying with text/plain JSON for Google Apps Script CORS compatibility');
    return postServiceJson(payload, 'text/plain;charset=utf-8');
  }
}

async function postServiceJson(payload, contentType) {
  const response = await fetch(SERVICE_WEB_APP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': contentType
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  const responseData = parseAppsScriptResponse(responseText);

  console.log('[Service Request] Apps Script response', {
    status: response.status,
    ok: response.ok,
    contentType,
    response: responseData || responseText
  });

  if (!response.ok) {
    throw new Error(`Apps Script returned HTTP ${response.status}.`);
  }

  if (responseData?.success === false || responseData?.status === 'error') {
    throw new Error(responseData.message || responseData.error || 'Apps Script rejected the request.');
  }

  return responseData || { success: true, raw: responseText };
}

function parseAppsScriptResponse(responseText) {
  if (!responseText) return null;

  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.warn('[Service Request] Apps Script response was not JSON', responseText);
    return null;
  }
}

function isLikelyCorsOrPreflightError(error) {
  return error instanceof TypeError || /cors|failed to fetch|networkerror|load failed/i.test(error.message || '');
}

function getSafeLogPayload(payload) {
  return {
    ...payload,
    fileBase64: payload.fileBase64 ? `[base64:${payload.fileBase64.length} chars]` : '',
    fields: { ...payload.fields }
  };
}

async function handleServiceSubmit(event) {
  event.preventDefault();
  if (isServiceSubmissionInProgress) {
    console.warn('[Service Request] Duplicate submit prevented');
    return;
  }

  if (!activeServiceKey) return;

  if (!validateServiceForm()) {
    console.warn('[Service Request] Validation failed');
    return;
  }

  isServiceSubmissionInProgress = true;

  try {
    if (activeFileReadPromise) {
      setServiceSubmitting(true, i18n('form.preparingFile'));
      await activeFileReadPromise;

      if (activeFileReadError) {
        throw activeFileReadError;
      }
    }

    const values = collectServiceValues();
    const payload = buildServicePayload(values);

    setServiceSubmitting(true, i18n('form.submitting'));
    setServiceStatus('success', i18n('form.statuses.submitting'));
    const response = await submitServiceRequest(payload);
    console.log('[Service Request] Submission completed', response);
    serviceRequestForm.reset();
    resetUploadState();
    setServiceStatus('success', i18n('form.statuses.success'));
  } catch (error) {
    console.error('[Service Request] Submission failed', error);
    setServiceStatus('error', i18n('form.statuses.error'));
  } finally {
    isServiceSubmissionInProgress = false;
    setServiceSubmitting(false);
  }
}

document.querySelectorAll('.service-card[data-service]').forEach(card => {
  card.addEventListener('click', () => openServiceModal(card.dataset.service));
  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openServiceModal(card.dataset.service);
    }
  });
});

document.querySelectorAll('[data-modal-close]').forEach(closeTarget => {
  closeTarget.addEventListener('click', closeServiceModal);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && serviceModal?.classList.contains('open')) {
    closeServiceModal();
  }
  if (event.key === 'Escape' && navLinks?.classList.contains('open')) {
    setMobileMenu(false);
  }
});

if (serviceRequestForm) {
  serviceRequestForm.addEventListener('submit', handleServiceSubmit);
  serviceRequestForm.addEventListener('input', event => {
    const input = event.target.closest('input, select, textarea');
    if (input) clearInvalidState(input);
  });
}

// ---- FAQ ACCORDION ----
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ---- TESTIMONIAL SLIDER ----
const track = document.getElementById('testimonialTrack');
const dotsContainer = document.getElementById('sliderDots');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

if (track) {
  const cards = track.querySelectorAll('.testimonial-card');
  const total = cards.length;
  const visible = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
  const maxIndex = total - visible;
  let current = 0;
  let autoTimer;

  // Create dots
  for (let i = 0; i <= maxIndex; i++) {
    const dot = document.createElement('div');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  }

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, maxIndex));
    const cardWidth = cards[0].offsetWidth + 24;
    track.style.transform = `translateX(-${current * cardWidth}px)`;
    dotsContainer.querySelectorAll('.slider-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
    resetAuto();
  }

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current < maxIndex ? current + 1 : 0), 4000);
  }

  prevBtn.addEventListener('click', () => goTo(current > 0 ? current - 1 : maxIndex));
  nextBtn.addEventListener('click', () => goTo(current < maxIndex ? current + 1 : 0));
  resetAuto();
}

// ---- CONTACT FORM ----
const contactForm = document.getElementById('contactForm');
const contactStatus = document.getElementById('formSuccess');
let isContactSubmissionInProgress = false;

function getContactValue(id) {
  return document.getElementById(id)?.value.trim() || '';
}

function setContactStatus(type, message) {
  if (!contactStatus) return;
  contactStatus.className = `form-success ${type}`;
  contactStatus.textContent = message;
}

function clearContactStatus() {
  if (!contactStatus) return;
  contactStatus.className = 'form-success';
  contactStatus.textContent = '';
}

function setContactSubmitting(isSubmitting) {
  const btn = contactForm?.querySelector('.form-submit');
  if (!btn) return;
  btn.disabled = isSubmitting;
  btn.classList.toggle('loading', isSubmitting);
  btn.textContent = isSubmitting ? i18n('contact.sending') : i18n('contact.submit');
}

function validateContactForm() {
  const name = getContactValue('name');
  const phone = getContactValue('phone').replace(/\D/g, '');
  const email = getContactValue('email');

  if (!name) {
    setContactStatus('error', i18n('contact.errors.name'));
    return false;
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    setContactStatus('error', i18n('contact.errors.phone'));
    return false;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setContactStatus('error', i18n('contact.errors.email'));
    return false;
  }

  return true;
}

function buildContactPayload() {
  const selectedService = getContactValue('service');

  return {
    action: 'createContactRequest',
    timestamp: new Date().toISOString(),
    source: 'Contact Form',
    service: 'Contact Form',
    subservice: selectedService,
    name: getContactValue('name'),
    phone: getContactValue('phone').replace(/\D/g, ''),
    email: getContactValue('email'),
    message: getContactValue('message'),
    fileUrl: '',
    fileName: '',
    fileType: '',
    fileBase64: '',
    status: 'New',
    sheetName: SERVICE_SHEET_NAME,
    folderId: SERVICE_DRIVE_FOLDER_ID,
    fields: {
      source: 'Contact Form',
      selectedService
    }
  };
}

async function submitContactRequest(payload) {
  console.log('[Contact Form] Sending request to Google Apps Script', payload);

  try {
    return await postServiceJson(payload, 'application/json');
  } catch (error) {
    console.error('[Contact Form] application/json submission failed', error);

    if (!isLikelyCorsOrPreflightError(error)) {
      throw error;
    }

    console.warn('[Contact Form] Retrying with text/plain JSON for Google Apps Script CORS compatibility');
    return postServiceJson(payload, 'text/plain;charset=utf-8');
  }
}

if (contactForm) {
  contactForm.addEventListener('input', clearContactStatus);

  contactForm.addEventListener('submit', async event => {
    event.preventDefault();

    if (isContactSubmissionInProgress) {
      console.warn('[Contact Form] Duplicate submit prevented');
      return;
    }

    clearContactStatus();

    if (!validateContactForm()) {
      return;
    }

    isContactSubmissionInProgress = true;
    setContactSubmitting(true);
    setContactStatus('loading', i18n('contact.loading'));

    try {
      const payload = buildContactPayload();
      const response = await submitContactRequest(payload);
      console.log('[Contact Form] Submission completed', response);
      contactForm.reset();
      setContactStatus('success', i18n('contact.success'));
    } catch (error) {
      console.error('[Contact Form] Submission failed', error);
      setContactStatus('error', i18n('contact.errors.submit'));
    } finally {
      isContactSubmissionInProgress = false;
      setContactSubmitting(false);
    }
  });
}

// ---- SMOOTH SCROLL ----
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 72, behavior: 'smooth' });
    }
  });
});

// THEME TOGGLE

const themeToggle =
document.getElementById('themeToggle');

const savedTheme =
localStorage.getItem('theme');

if(savedTheme === 'dark'){
document.body.classList.add('dark-mode');
}

themeToggle.addEventListener('click', () => {

document.body.classList.toggle('dark-mode');

if(document.body.classList.contains('dark-mode')){
localStorage.setItem('theme','dark');
}else{
localStorage.setItem('theme','light');
}

});

applyLanguage(currentLanguage, false);
