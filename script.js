// ---- NAVBAR SCROLL ----
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  updateActiveLink();
});

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('open');
});

navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
  });
});

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
  const requiredMark = field.required ? '<span>*</span>' : '';
  const requiredAttr = field.required ? 'required' : '';
  const fullClass = field.full ? ' full' : '';
  const autocomplete = field.autocomplete ? ` autocomplete="${field.autocomplete}"` : '';

  if (field.type === 'select') {
    const options = field.options
      .map(option => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
      .join('');

    return `
      <div class="service-field${fullClass}" data-field="${field.name}">
        <label for="${fieldId}">${escapeHtml(field.label)} ${requiredMark}</label>
        <select class="service-select" id="${fieldId}" name="${field.name}" ${requiredAttr}>
          <option value="" disabled selected>Select ${escapeHtml(field.label)}</option>
          ${options}
        </select>
        <small class="service-field-error">Please enter a valid ${escapeHtml(field.label.toLowerCase())}.</small>
      </div>
    `;
  }

  if (field.type === 'textarea') {
    return `
      <div class="service-field${fullClass}" data-field="${field.name}">
        <label for="${fieldId}">${escapeHtml(field.label)} ${requiredMark}</label>
        <textarea class="service-textarea" id="${fieldId}" name="${field.name}" rows="4" ${requiredAttr} placeholder="Write details here..."></textarea>
        <small class="service-field-error">Please enter a valid ${escapeHtml(field.label.toLowerCase())}.</small>
      </div>
    `;
  }

  if (field.type === 'file') {
    return `
      <div class="service-field full upload-control" data-field="${field.name}">
        <label for="${fieldId}">${escapeHtml(field.label)} ${requiredMark}</label>
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
            <strong>Choose file or drag it here</strong>
            <span>PDF, JPG, PNG, or DOCX up to 5 MB.</span>
          </div>
        </div>
        <div class="upload-file-meta" id="serviceFileMeta"></div>
        <div class="upload-progress" id="serviceUploadProgress">
          <div class="upload-progress-bar" id="serviceUploadProgressBar"></div>
        </div>
        <small class="service-field-error">Please upload a valid PDF, JPG, PNG, or DOCX file under 5 MB.</small>
      </div>
    `;
  }

  const minAttr = field.min ? ` min="${field.min}"` : '';
  const valueAttr = field.value ? ` value="${escapeHtml(field.value)}"` : '';

  return `
    <div class="service-field${fullClass}" data-field="${field.name}">
      <label for="${fieldId}">${escapeHtml(field.label)} ${requiredMark}</label>
      <input class="service-input" id="${fieldId}" name="${field.name}" type="${field.type}" ${requiredAttr}${autocomplete}${minAttr}${valueAttr} placeholder="${escapeHtml(field.label)}"/>
      <small class="service-field-error">Please enter a valid ${escapeHtml(field.label.toLowerCase())}.</small>
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
  serviceModalTitle.textContent = config.title;
  serviceModalDescription.textContent = config.description;

  serviceRequestForm.innerHTML = `
    ${config.fields.map(renderServiceField).join('')}
    <div class="form-status" id="serviceFormStatus" role="status"></div>
    <div class="service-submit-row">
      <button class="service-submit-btn" type="submit">
        <span class="submit-spinner" aria-hidden="true"></span>
        <span class="submit-label">Submit Request</span>
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

function setServiceSubmitting(isSubmitting, label = 'Submit Request') {
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
        reject(new Error('Unable to convert the selected file to Base64.'));
        return;
      }
      console.log('[Service Request] File converted to Base64', {
        fileName: file.name,
        base64Length: base64.length
      });
      resolve(base64);
    };

    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
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
    markServiceFieldInvalid(input, 'Only PDF, JPG, PNG, or DOCX files are supported.');
    return;
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    console.warn('[Service Request] Rejected oversized file', {
      fileName: file.name,
      fileSize: file.size
    });
    input.value = '';
    markServiceFieldInvalid(input, 'File size must be 5 MB or less.');
    return;
  }

  setFileMeta(`${file.name} - ${formatFileSize(file.size)} - Preparing upload`);
  setUploadProgress(4);
  setServiceSubmitting(true, 'Preparing File...');
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
      setFileMeta(`${file.name} - ${formatFileSize(file.size)} - Ready to submit`);
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
      markServiceFieldInvalid(input, 'This field is required.');
      isValid = false;
      return;
    }

    if (input.type === 'tel' && value) {
      const phone = value.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(phone)) {
        markServiceFieldInvalid(input, 'Enter a valid 10-digit Indian mobile number.');
        isValid = false;
      }
    }

    if (input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      markServiceFieldInvalid(input, 'Enter a valid email address.');
      isValid = false;
    }

    if (input.type === 'number' && value && Number(value) < Number(input.min || 0)) {
      markServiceFieldInvalid(input, `Value must be at least ${input.min}.`);
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
      setServiceSubmitting(true, 'Preparing File...');
      await activeFileReadPromise;

      if (activeFileReadError) {
        throw activeFileReadError;
      }
    }

    const values = collectServiceValues();
    const payload = buildServicePayload(values);

    setServiceSubmitting(true, 'Submitting...');
    setServiceStatus('success', 'Submitting your request securely...');
    const response = await submitServiceRequest(payload);
    console.log('[Service Request] Submission completed', response);
    serviceRequestForm.reset();
    resetUploadState();
    setServiceStatus('success', 'Request submitted successfully. Our team will contact you shortly.');
  } catch (error) {
    console.error('[Service Request] Submission failed', error);
    setServiceStatus('error', 'Unable to submit right now. Please check your internet connection and try again.');
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
const form = document.getElementById('contactForm');
const successMsg = document.getElementById('formSuccess');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    setTimeout(() => {
      successMsg.style.display = 'block';
      form.reset();
      btn.textContent = 'Send Message';
      btn.disabled = false;
      setTimeout(() => { successMsg.style.display = 'none'; }, 5000);
    }, 1200);
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
